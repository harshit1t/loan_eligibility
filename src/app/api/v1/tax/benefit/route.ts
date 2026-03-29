import { NextRequest } from "next/server";
import { z } from "zod";
import { createResponse, createErrorResponse } from "@/lib/api-response";

const TaxBenefitSchema = z.object({
  principal: z.number().min(100000),
  annualRate: z.number().min(1).max(30),
  tenureMonths: z.number().int().min(12).max(360),
  annualIncome: z.number().min(100000),
  taxRegime: z.enum(["old", "new"]),
  isFirstTimeBuyer: z.boolean().default(false),
});

const OLD_REGIME_SLABS = [{ upTo: 250000, rate: 0 }, { upTo: 500000, rate: 0.05 }, { upTo: 1000000, rate: 0.20 }, { upTo: Infinity, rate: 0.30 }];

function computeTax(income: number, slabs: typeof OLD_REGIME_SLABS): number {
  let tax = 0, prev = 0;
  for (const slab of slabs) {
    if (income <= prev) break;
    const taxable = Math.min(income, slab.upTo) - prev;
    tax += taxable * slab.rate;
    prev = slab.upTo;
  }
  return Math.round(tax * 1.04);
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  try {
    const body = await req.json();
    const parsed = TaxBenefitSchema.safeParse(body);
    if (!parsed.success) return createErrorResponse("Validation failed", 400, requestId, parsed.error.flatten().fieldErrors);

    const { principal, annualRate, tenureMonths, annualIncome, taxRegime, isFirstTimeBuyer } = parsed.data;
    const r = annualRate / 100 / 12;
    const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
    
    // Yearly breakdown logic...
    let balance = principal, totalTaxSaving = 0, totalInterest = 0;
    const yearlyBreakdown = [];
    for (let year = 1; year <= Math.ceil(tenureMonths / 12); year++) {
      let yearInterest = 0, yearPrincipal = 0;
      for (let m = 0; m < 12 && balance > 0; m++) {
        const interest = balance * r;
        const pComp = Math.min(emi - interest, balance);
        yearInterest += interest;
        yearPrincipal += pComp;
        balance -= pComp;
      }
      totalInterest += yearInterest;
      const sec24b = taxRegime === "old" ? Math.min(yearInterest, 200000) : 0;
      const sec80c = taxRegime === "old" ? Math.min(yearPrincipal, 150000) : 0;
      const saving = taxRegime === "old" ? (computeTax(annualIncome, OLD_REGIME_SLABS) - computeTax(annualIncome - (sec24b + sec80c), OLD_REGIME_SLABS)) : 0;
      totalTaxSaving += saving;
      yearlyBreakdown.push({ year, interestPaid: Math.round(yearInterest), principalPaid: Math.round(yearPrincipal), taxSaving: Math.round(saving), effectiveCost: Math.round(yearInterest - saving) });
    }

    return createResponse({ yearlyBreakdown, totals: { totalInterest: Math.round(totalInterest), totalTaxSaving: Math.round(totalTaxSaving), totalEffectiveCost: Math.round(totalInterest - totalTaxSaving) }, summary: `Tax benefit calculation complete. Total estimated savings: ${totalTaxSaving.toLocaleString()}.` }, 200, requestId);
  } catch (err) {
    console.error("[/api/v1/tax/benefit]", err);
    return createErrorResponse("Tax calculation failed", 500, requestId);
  }
}
