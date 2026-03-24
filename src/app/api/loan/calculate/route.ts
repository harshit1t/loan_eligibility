import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const LoanCalculationSchema = z.object({
  fullName: z.string().min(2).max(100),
  age: z.number().int().min(18).max(65),
  employmentStatus: z.enum(["Salaried", "Freelance", "Business"]),
  monthlyIncome: z.number().min(10000),
  requestedCapital: z.number().min(10000).max(100_000_000),
  loanPurpose: z.enum(["Home", "Education", "Business"]),
  repaymentTerm: z.number().int().min(12).max(360),
  monthlyEmi: z.number().min(0).default(0),
  creditCardOutstanding: z.number().min(0).default(0),
  activeLoanAccounts: z.number().int().min(0).default(0),
});

export type LoanCalculationInput = z.infer<typeof LoanCalculationSchema>;

// FOIR limits per RBI/NBFC lending guidelines
const FOIR_LIMITS: Record<string, number> = {
  Salaried: 0.50,
  Freelance: 0.45,
  Business: 0.40,
};

// Base retail rates per loan purpose (Repo + spread)
const RATE_BY_PURPOSE: Record<string, number> = {
  Home: 8.90,
  Education: 11.00,
  Business: 12.50,
};

// Standard Indian retirement age for tenure capping
function getMaxTenureMonths(age: number): number {
  return Math.max(0, (60 - age) * 12);
}

function simulateCibilScore(input: LoanCalculationInput, foir: number): number {
  let score = 700;

  if (input.monthlyIncome >= 100000) score += 50;
  else if (input.monthlyIncome >= 50000) score += 25;
  else if (input.monthlyIncome < 25000) score -= 30;

  if (foir < 0.3) score += 60;
  else if (foir < 0.4) score += 30;
  else if (foir > 0.55) score -= 60;
  else if (foir > 0.45) score -= 30;

  if (input.employmentStatus === "Salaried") score += 40;
  else if (input.employmentStatus === "Business") score += 10;
  else score -= 10;

  score -= Math.min(input.activeLoanAccounts, 5) * 20;

  if (input.age >= 25 && input.age <= 45) score += 30;
  else if (input.age < 25 || input.age > 55) score -= 20;

  return Math.min(900, Math.max(350, Math.round(score)));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const coerced = {
      ...body,
      age: Number(body.age),
      monthlyIncome: Number(body.monthlyIncome),
      requestedCapital: Number(body.requestedCapital),
      repaymentTerm: Number(body.repaymentTerm),
      monthlyEmi: Number(body.monthlyEmi || 0),
      creditCardOutstanding: Number(body.creditCardOutstanding || 0),
      activeLoanAccounts: Number(body.activeLoanAccounts || 0),
    };

    const parsed = LoanCalculationSchema.safeParse(coerced);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // Try to fetch live rate, fall back to hardcoded purpose rate
    let annualRate = RATE_BY_PURPOSE[input.loanPurpose] / 100;
    let rateSource = "Fallback Rate";
    try {
      const ratesRes = await fetch(`${req.nextUrl.origin}/api/rates/live`, { next: { revalidate: 3600 } });
      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        const key = `${input.loanPurpose.toLowerCase()}_loan_rate`;
        if (ratesData.data?.[key]) {
          annualRate = ratesData.data[key] / 100;
          rateSource = ratesData.data.source;
        }
      }
    } catch {
      // use fallback
    }

    const foirLimit = FOIR_LIMITS[input.employmentStatus];
    const r = annualRate / 12;
    const n = input.repaymentTerm;

    // Credit card outstanding contributes ~5% min payment to obligations
    const ccMinPayment = input.creditCardOutstanding * 0.05;
    const totalObligations = input.monthlyEmi + ccMinPayment;

    const foir = totalObligations / input.monthlyIncome;
    const availableEmiCapacity = Math.max(0, input.monthlyIncome * foirLimit - totalObligations);

    const maxEligibleAmount = availableEmiCapacity > 0
      ? availableEmiCapacity * ((1 - Math.pow(1 + r, -n)) / r)
      : 0;

    // Cap tenure if loan would extend past retirement age (60)
    const maxTenureByAge = getMaxTenureMonths(input.age);
    const effectiveTenure = Math.min(n, maxTenureByAge);
    const tenureCapped = effectiveTenure < n;

    const finalMaxAmount = tenureCapped
      ? availableEmiCapacity * ((1 - Math.pow(1 + r, -effectiveTenure)) / r)
      : maxEligibleAmount;

    const requiredEmi = input.requestedCapital > 0
      ? (input.requestedCapital * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
      : 0;

    const isApproved = finalMaxAmount >= input.requestedCapital && input.requestedCapital > 0;

    const cibilScore = simulateCibilScore(input, foir);
    const creditBand =
      cibilScore >= 800 ? "Excellent" :
      cibilScore >= 750 ? "Very Good" :
      cibilScore >= 700 ? "Good" :
      cibilScore >= 650 ? "Fair" : "Poor";

    const totalRepayment = requiredEmi * n;
    const totalInterestPayable = isApproved ? totalRepayment - input.requestedCapital : 0;

    return NextResponse.json({
      success: true,
      data: {
        isApproved,
        maxEligibleAmount: Math.round(finalMaxAmount),
        requestedCapital: input.requestedCapital,
        requiredEmi: Math.round(requiredEmi),
        availableEmiCapacity: Math.round(availableEmiCapacity),
        foir: parseFloat((foir * 100).toFixed(2)),
        foirLimit: foirLimit * 100,
        annualInterestRate: parseFloat((annualRate * 100).toFixed(2)),
        rateSource,
        effectiveTenure,
        tenureCapped,
        tenureCappedReason: tenureCapped
          ? `Tenure reduced to ${effectiveTenure} months (loan must close before age 60)`
          : null,
        cibilScore,
        creditBand,
        totalRepayment: Math.round(totalRepayment),
        totalInterestPayable: Math.round(totalInterestPayable),
        approvalReason: isApproved
          ? `Your income of ₹${input.monthlyIncome.toLocaleString("en-IN")} supports an EMI capacity of ₹${Math.round(availableEmiCapacity).toLocaleString("en-IN")}/month. Requested amount is within eligible limit.`
          : `Available EMI capacity of ₹${Math.round(availableEmiCapacity).toLocaleString("en-IN")}/month supports a maximum loan of ₹${Math.round(finalMaxAmount).toLocaleString("en-IN")}. Reduce the loan amount or increase income to qualify.`,
      },
    });
  } catch (err) {
    console.error("[/api/loan/calculate]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
