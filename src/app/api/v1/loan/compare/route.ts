import { NextRequest } from "next/server";
import { z } from "zod";
import { createResponse, createErrorResponse } from "@/lib/api-response";

const CompareSchema = z.object({
  monthlyIncome: z.number().min(10000),
  requestedCapital: z.number().min(50000),
  repaymentTerm: z.number().int().min(12).max(360),
  employmentStatus: z.enum(["Salaried", "Freelance", "Business"]),
  monthlyEmi: z.number().min(0).default(0),
  loanPurpose: z.enum(["Home", "Education", "Business"]).default("Home"),
});

const LENDERS = [
  { name: "SBI", fullName: "State Bank of India", type: "PSU", baseRate: { Home: 8.50, Education: 11.15, Business: 12.00 }, processingFee: 0.0035, processingFeeCap: 10000, prepaymentPenalty: 0, minMonthlyIncome: 25000, maxLTV: 0.90, specialNote: "No prepayment penalty on floating rate. Rebate for women borrowers." },
  { name: "HDFC Bank", fullName: "HDFC Bank Ltd", type: "Private", baseRate: { Home: 8.75, Education: 11.50, Business: 12.50 }, processingFee: 0.005, processingFeeCap: 7500, prepaymentPenalty: 0, minMonthlyIncome: 30000, maxLTV: 0.90, specialNote: "Doorstep service. HDFC Reach program for self-employed." },
  { name: "ICICI Bank", fullName: "ICICI Bank Ltd", type: "Private", baseRate: { Home: 8.75, Education: 11.25, Business: 12.25 }, processingFee: 0.005, processingFeeCap: 10000, prepaymentPenalty: 0, minMonthlyIncome: 30000, maxLTV: 0.90, specialNote: "Instant in-principle approval. Part prepayment allowed anytime." },
  { name: "Axis Bank", fullName: "Axis Bank Ltd", type: "Private", baseRate: { Home: 8.75, Education: 13.70, Business: 14.95 }, processingFee: 0.01, processingFeeCap: 10000, prepaymentPenalty: 0, minMonthlyIncome: 25000, maxLTV: 0.85, specialNote: "Shubh Aarambh loan: no EMI for first 3 months." },
  { name: "PNB Housing", fullName: "PNB Housing Finance", type: "HFC", baseRate: { Home: 8.65, Education: 12.00, Business: 13.50 }, processingFee: 0.0025, processingFeeCap: 15000, prepaymentPenalty: 0, minMonthlyIncome: 20000, maxLTV: 0.90, specialNote: "Roshni scheme for affordable housing. No foreclosure charges." },
  { name: "IDFC First", fullName: "IDFC First Bank", type: "Private", baseRate: { Home: 8.85, Education: 13.50, Business: 14.00 }, processingFee: 0.0025, processingFeeCap: 999999, prepaymentPenalty: 0, minMonthlyIncome: 30000, maxLTV: 0.90, specialNote: "Transparent pricing. No hidden charges policy." },
];

const FOIR_LIMITS: Record<string, number> = { Salaried: 0.50, Freelance: 0.45, Business: 0.40 };

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  try {
    const body = await req.json();
    const parsed = CompareSchema.safeParse(body);
    if (!parsed.success) return createErrorResponse("Validation failed", 400, requestId, parsed.error.flatten().fieldErrors);

    const { monthlyIncome, requestedCapital, repaymentTerm, employmentStatus, monthlyEmi, loanPurpose } = parsed.data;
    const foirLimit = FOIR_LIMITS[employmentStatus];
    const availableEmi = Math.max(0, monthlyIncome * foirLimit - monthlyEmi);

    const offers = LENDERS.map((lender) => {
      const rate = lender.baseRate[loanPurpose as keyof typeof lender.baseRate] / 100;
      const r = rate / 12;
      const n = repaymentTerm;
      const emi = Math.round((requestedCapital * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
      const maxEligible = Math.round(availableEmi * ((1 - Math.pow(1 + r, -n)) / r));
      const isEligible = maxEligible >= requestedCapital && monthlyIncome >= lender.minMonthlyIncome;

      return {
        lender: lender.name, fullName: lender.fullName, type: lender.type,
        annualRate: lender.baseRate[loanPurpose as keyof typeof lender.baseRate],
        emi, maxEligible, isEligible, totalInterest: Math.round(emi * n - requestedCapital),
        processingFee: Math.round(Math.min(requestedCapital * lender.processingFee, lender.processingFeeCap)),
        totalCostOfCredit: Math.round(emi * n - requestedCapital + Math.min(requestedCapital * lender.processingFee, lender.processingFeeCap)),
        totalRepayment: Math.round(emi * n),
        specialNote: lender.specialNote,
      };
    });

    const eligible = offers.filter((o) => o.isEligible).sort((a, b) => a.totalCostOfCredit - b.totalCostOfCredit).map((o, i) => ({ ...o, rank: i + 1, isBestDeal: i === 0 }));
    const ineligible = offers.filter((o) => !o.isEligible).map((o) => ({ ...o, rank: null, isBestDeal: false }));

    return createResponse({ requestedCapital, repaymentTerm, loanPurpose, eligible, ineligible, summary: { totalLenders: LENDERS.length, eligibleCount: eligible.length, bestDeal: eligible[0]?.lender ?? null, bestRate: eligible[0]?.annualRate ?? null, savingsByChoosingBest: (eligible[eligible.length - 1]?.totalCostOfCredit ?? 0) - (eligible[0]?.totalCostOfCredit ?? 0) } }, 200, requestId);
  } catch (err) {
    console.error("[/api/v1/loan/compare]", err);
    return createErrorResponse("Comparison process failed", 500, requestId);
  }
}
