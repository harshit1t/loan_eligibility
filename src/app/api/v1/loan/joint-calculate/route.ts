import { NextRequest } from "next/server";
import { z } from "zod";
import { createResponse, createErrorResponse } from "@/lib/api-response";

const JointLoanSchema = z.object({
  primaryIncome: z.number().min(10000),
  secondaryIncome: z.number().min(0),
  primaryEmi: z.number().min(0).default(0),
  secondaryEmi: z.number().min(0).default(0),
  requestedCapital: z.number().min(10000),
  annualRate: z.number().min(1).max(30),
  tenureMonths: z.number().int().min(12).max(360),
});

const FOIR_LIMIT = 0.50; // Joint loans usually allow higher aggregate FOIR

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  try {
    const body = await req.json();
    const parsed = JointLoanSchema.safeParse(body);
    if (!parsed.success) return createErrorResponse("Validation failed", 400, requestId, parsed.error.flatten().fieldErrors);

    const { primaryIncome, secondaryIncome, primaryEmi, secondaryEmi, requestedCapital, annualRate, tenureMonths } = parsed.data;
    
    const totalIncome = primaryIncome + secondaryIncome;
    const totalExistingEmi = primaryEmi + secondaryEmi;
    const r = annualRate / 100 / 12;
    const n = tenureMonths;

    const aggregateCapacity = Math.max(0, totalIncome * FOIR_LIMIT - totalExistingEmi);
    const requiredEmi = Math.round((requestedCapital * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    const maxEligible = Math.round(aggregateCapacity * ((1 - Math.pow(1 + r, -n)) / r));

    const isApproved = maxEligible >= requestedCapital;

    // Ownership split based on income contribution
    const primarySplit = Math.round((primaryIncome / totalIncome) * 100);
    const secondarySplit = 100 - primarySplit;

    return createResponse({
      totalIncome, aggregateCapacity, requiredEmi, maxEligible, isApproved,
      primarySplit, secondarySplit,
      combinedFoir: Math.round(((requiredEmi + totalExistingEmi) / totalIncome) * 100),
      standaloneEligibility: {
        primary: Math.round(Math.max(0, primaryIncome * 0.45 - primaryEmi) * ((1 - Math.pow(1 + r, -n)) / r)),
        secondary: Math.round(Math.max(0, secondaryIncome * 0.45 - secondaryEmi) * ((1 - Math.pow(1 + r, -n)) / r)),
      }
    }, 200, requestId);
  } catch (err) {
    console.error("[/api/v1/loan/joint-calculate]", err);
    return createErrorResponse("Joint calculation failed", 500, requestId);
  }
}
