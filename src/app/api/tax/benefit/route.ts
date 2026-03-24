import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TaxBenefitSchema = z.object({
  principal: z.number().min(100000),
  annualRate: z.number().min(1).max(30),
  tenureMonths: z.number().int().min(12).max(360),
  annualIncome: z.number().min(100000),
  taxRegime: z.enum(["old", "new"]),
  isFirstTimeBuyer: z.boolean().default(false),
});

// Income tax slabs — FY 2024-25
// Note: New regime does NOT allow Sec 24(b) or 80C deductions
const OLD_REGIME_SLABS = [
  { upTo: 250000, rate: 0 },
  { upTo: 500000, rate: 0.05 },
  { upTo: 1000000, rate: 0.20 },
  { upTo: Infinity, rate: 0.30 },
];

const NEW_REGIME_SLABS = [
  { upTo: 300000, rate: 0 },
  { upTo: 600000, rate: 0.05 },
  { upTo: 900000, rate: 0.10 },
  { upTo: 1200000, rate: 0.15 },
  { upTo: 1500000, rate: 0.20 },
  { upTo: Infinity, rate: 0.30 },
];

function computeTax(income: number, slabs: typeof OLD_REGIME_SLABS): number {
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (income <= prev) break;
    const taxable = Math.min(income, slab.upTo) - prev;
    tax += taxable * slab.rate;
    prev = slab.upTo;
  }
  return Math.round(tax * 1.04); // 4% health & education cess
}

function buildYearlySchedule(principal: number, annualRate: number, tenureMonths: number) {
  const r = annualRate / 100 / 12;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  let balance = principal;
  const yearlyData: { year: number; interestPaid: number; principalPaid: number }[] = [];

  for (let year = 1; year <= Math.ceil(tenureMonths / 12); year++) {
    let yearInterest = 0;
    let yearPrincipal = 0;
    const monthsThisYear = Math.min(12, tenureMonths - (year - 1) * 12);
    for (let m = 0; m < monthsThisYear; m++) {
      if (balance <= 0) break;
      const interest = balance * r;
      const principalComponent = Math.min(emi - interest, balance);
      yearInterest += interest;
      yearPrincipal += principalComponent;
      balance = Math.max(0, balance - principalComponent);
    }
    yearlyData.push({ year, interestPaid: Math.round(yearInterest), principalPaid: Math.round(yearPrincipal) });
  }
  return yearlyData;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const coerced = {
      ...body,
      principal: Number(body.principal),
      annualRate: Number(body.annualRate),
      tenureMonths: Number(body.tenureMonths),
      annualIncome: Number(body.annualIncome),
      isFirstTimeBuyer: Boolean(body.isFirstTimeBuyer),
    };

    const parsed = TaxBenefitSchema.safeParse(coerced);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { principal, annualRate, tenureMonths, annualIncome, taxRegime, isFirstTimeBuyer } = parsed.data;
    const schedule = buildYearlySchedule(principal, annualRate, tenureMonths);

    const slabs = taxRegime === "old" ? OLD_REGIME_SLABS : NEW_REGIME_SLABS;
    const baseTax = computeTax(annualIncome, slabs);

    // Sec 24(b) — interest deduction (max ₹2L/yr, old regime only)
    const SEC_24B_LIMIT = 200000;
    // Sec 80C — principal deduction (max ₹1.5L/yr, part of total 80C pool, old regime only)
    const SEC_80C_LIMIT = 150000;
    // Sec 80EEA — additional ₹1.5L for affordable housing first-time buyers (loan before Mar 2022 — expired but included for awareness)
    const SEC_80EEA_LIMIT = isFirstTimeBuyer ? 150000 : 0;

    const yearlyBreakdown = schedule.map(({ year, interestPaid, principalPaid }) => {
      let taxSaving = 0;
      let sec24bDeduction = 0;
      let sec80cDeduction = 0;
      let sec80eeaDeduction = 0;

      if (taxRegime === "old") {
        sec24bDeduction = Math.min(interestPaid, SEC_24B_LIMIT);
        sec80cDeduction = Math.min(principalPaid, SEC_80C_LIMIT);
        sec80eeaDeduction = isFirstTimeBuyer ? Math.min(Math.max(0, interestPaid - SEC_24B_LIMIT), SEC_80EEA_LIMIT) : 0;

        const totalDeduction = sec24bDeduction + sec80cDeduction + sec80eeaDeduction;
        const adjustedIncome = Math.max(0, annualIncome - totalDeduction);
        const taxAfterDeduction = computeTax(adjustedIncome, slabs);
        taxSaving = baseTax - taxAfterDeduction;
      }
      // New regime: no deductions on home loan

      return {
        year,
        interestPaid,
        principalPaid,
        sec24bDeduction,
        sec80cDeduction,
        sec80eeaDeduction,
        totalDeduction: sec24bDeduction + sec80cDeduction + sec80eeaDeduction,
        taxSaving: Math.max(0, taxSaving),
        effectiveCost: interestPaid - Math.max(0, taxSaving),
      };
    });

    const totals = yearlyBreakdown.reduce(
      (acc, row) => ({
        totalInterest: acc.totalInterest + row.interestPaid,
        totalPrincipal: acc.totalPrincipal + row.principalPaid,
        totalTaxSaving: acc.totalTaxSaving + row.taxSaving,
        totalEffectiveCost: acc.totalEffectiveCost + row.effectiveCost,
      }),
      { totalInterest: 0, totalPrincipal: 0, totalTaxSaving: 0, totalEffectiveCost: 0 }
    );

    const effectiveInterestRate = totals.totalTaxSaving > 0
      ? (((totals.totalEffectiveCost) / principal) / (tenureMonths / 12)) * 100
      : annualRate;

    return NextResponse.json({
      success: true,
      data: {
        regime: taxRegime,
        isFirstTimeBuyer,
        applicableDeductions: taxRegime === "old"
          ? ["Section 24(b) — Interest up to ₹2,00,000/yr", "Section 80C — Principal up to ₹1,50,000/yr", ...(isFirstTimeBuyer ? ["Section 80EEA — Additional interest ₹1,50,000/yr (if affordable housing)"] : [])]
          : ["No deductions available under new tax regime for home loan interest or principal"],
        yearlyBreakdown,
        totals: {
          ...totals,
          totalInterest: Math.round(totals.totalInterest),
          totalTaxSaving: Math.round(totals.totalTaxSaving),
          totalEffectiveCost: Math.round(totals.totalEffectiveCost),
        },
        effectiveInterestRate: parseFloat(effectiveInterestRate.toFixed(2)),
        summary: taxRegime === "old"
          ? `After tax benefits, your effective loan cost reduces by ₹${Math.round(totals.totalTaxSaving).toLocaleString("en-IN")}. Effective rate drops from ${annualRate}% to ~${effectiveInterestRate.toFixed(2)}% p.a.`
          : "The new tax regime does not allow home loan interest/principal deductions. Consider switching to the old regime to avail ₹3.5L+ in annual deductions.",
      },
    });
  } catch (err) {
    console.error("[/api/tax/benefit]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
