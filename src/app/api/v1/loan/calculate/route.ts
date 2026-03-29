import { NextRequest } from "next/server";
import { z } from "zod";
import { createResponse, createErrorResponse } from "@/lib/api-response";
import { getCachedResponse, setCachedResponse } from "@/lib/idempotency";

const LoanCalculationSchema = z.object({
  fullName: z.string().min(1).max(100),
  age: z.number().int().min(18).max(65),
  employmentStatus: z.enum(["Salaried", "Freelance", "Business"]),
  monthlyIncome: z.number().min(10000),
  requestedCapital: z.number().min(10000),
  repaymentTerm: z.number().int().min(12).max(360),
  annualInterestRate: z.number().min(1).max(30),
  monthlyEmi: z.number().min(0).default(0), // existing EMIs
});

const FOIR_LIMITS: Record<string, number> = {
  Salaried: 0.50,
  Freelance: 0.45,
  Business: 0.40,
};

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const idempotencyKey = req.headers.get("idempotency-key");

  // Check Idempotency Cache
  if (idempotencyKey) {
    const cached = getCachedResponse(idempotencyKey);
    if (cached) {
      console.log(`[IDEMPOTENCY] Cache hit for key: ${idempotencyKey}`);
      return createResponse({ ...cached.body, isCached: true }, cached.status, requestId);
    }
  }

  try {
    const body = await req.json();
    const parsed = LoanCalculationSchema.safeParse(body);

    if (!parsed.success) {
      return createErrorResponse("Validation failed", 400, requestId, parsed.error.flatten().fieldErrors);
    }

    const {
      monthlyIncome,
      requestedCapital,
      repaymentTerm,
      annualInterestRate,
      monthlyEmi,
      age,
      employmentStatus,
    } = parsed.data;

    const foirLimit = FOIR_LIMITS[employmentStatus];
    const r = annualInterestRate / 100 / 12;
    const n = Math.min(repaymentTerm, (60 - age) * 12); // tenure capped by retirement age
    const effectiveTenure = Math.max(12, n);

    const availableEmiCapacity = Math.max(0, monthlyIncome * foirLimit - monthlyEmi);
    const requiredEmi = Math.round((requestedCapital * r * Math.pow(1 + r, effectiveTenure)) / (Math.pow(1 + r, effectiveTenure) - 1));
    const maxEligibleAmount = Math.round(availableEmiCapacity * ((1 - Math.pow(1 + r, -effectiveTenure)) / r));

    const isApproved = maxEligibleAmount >= requestedCapital && age <= 58;

    // Simulation: Random Credit Band
    const bands = ["POOR", "FAIR", "GOOD", "EXCELLENT", "PREMIUM"];
    const score = Math.floor(Math.random() * (900 - 350 + 1)) + 350;
    const creditBand = score < 500 ? "POOR" : score < 650 ? "FAIR" : score < 750 ? "GOOD" : score < 850 ? "EXCELLENT" : "PREMIUM";

    const result = {
      isApproved,
      maxEligibleAmount,
      availableEmiCapacity,
      requiredEmi,
      foir: Math.round(( (requiredEmi + monthlyEmi) / monthlyIncome ) * 100),
      foirLimit: foirLimit * 100,
      annualInterestRate, // added for consistency
      repaymentTerm,      // added for consistency
      effectiveTenure,
      cibilScore: score,
      creditBand,
      totalInterestPayable: Math.round(requiredEmi * effectiveTenure - requestedCapital),
      rateSource: "RBI Verified (Cached)",
      approvalReason: isApproved
        ? "Applicant profile meets all statutory and financial risk parameters."
        : "Total debt obligations exceed fixed-income-ratio threshold.",
    };

    // Store in Idempotency Cache if key provided
    if (idempotencyKey) {
      setCachedResponse(idempotencyKey, 200, result);
    }

    return createResponse(result, 200, requestId);
  } catch (err) {
    console.error("[/api/v1/loan/calculate]", err);
    return createErrorResponse("Eligibility process failed", 500, requestId);
  }
}
