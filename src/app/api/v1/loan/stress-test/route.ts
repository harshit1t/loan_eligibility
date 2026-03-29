import { NextRequest } from "next/server";
import { z } from "zod";
import { createResponse, createErrorResponse } from "@/lib/api-response";

const StressTestSchema = z.object({
  principal: z.number().min(10000),
  annualRate: z.number().min(1).max(30),
  tenureMonths: z.number().int().min(12).max(360),
  monthlyIncome: z.number().min(5000),
  employmentStatus: z.enum(["Salaried", "Freelance", "Business"]),
  incomeVolatility: z.number().min(0.01).max(1).default(0.20),
  simulations: z.number().int().min(100).max(5000).default(1000),
});

const FOIR_LIMITS: Record<string, number> = { Salaried: 0.50, Freelance: 0.45, Business: 0.40 };

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function simulateIncomePath(initialIncome: number, annualDrift: number, annualVol: number, months: number): number[] {
  const dt = 1 / 12;
  const path: number[] = [initialIncome];
  let Y = initialIncome;
  for (let t = 1; t <= months; t++) {
    const drift = (annualDrift - 0.5 * annualVol ** 2) * dt;
    const diffusion = annualVol * Math.sqrt(dt) * gaussianRandom();
    Y = Y * Math.exp(drift + diffusion);
    path.push(Y);
  }
  return path;
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  try {
    const body = await req.json();
    const parsed = StressTestSchema.safeParse(body);
    if (!parsed.success) return createErrorResponse("Validation failed", 400, requestId, parsed.error.flatten().fieldErrors);

    const { principal, annualRate, tenureMonths, monthlyIncome, employmentStatus, incomeVolatility, simulations } = parsed.data;
    const r = annualRate / 100 / 12;
    const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
    const foirLimit = FOIR_LIMITS[employmentStatus];

    const results = Array.from({ length: simulations }, () => simulateIncomePath(monthlyIncome, 0, incomeVolatility, Math.min(61, tenureMonths)));
    const checkpoints = [12, 36, 60].filter((m) => m <= tenureMonths);

    const stressByCheckpoint = checkpoints.map((month) => {
      const stressedCount = results.filter((path) => emi / path[Math.min(month, path.length - 1)] > foirLimit).length;
      const incomes = results.map((p) => p[Math.min(month, p.length - 1)]).sort((a, b) => a - b);
      return {
        month, stressProbability: parseFloat(((stressedCount / simulations) * 100).toFixed(2)),
        stressedScenarios: stressedCount,
        incomeP10: Math.round(incomes[Math.floor(simulations * 0.1)]),
        incomeP50: Math.round(incomes[Math.floor(simulations * 0.5)]),
        incomeP90: Math.round(incomes[Math.floor(simulations * 0.9)]),
        breakEvenIncome: Math.round(emi / foirLimit),
      };
    });

    const maxStress = Math.max(...stressByCheckpoint.map((c) => c.stressProbability));
    return createResponse({
      emi: Math.round(emi), currentFoir: parseFloat(((emi / monthlyIncome) * 100).toFixed(2)), foirLimit: foirLimit * 100, stressByCheckpoint,
      riskBand: maxStress < 5 ? "Low" : maxStress < 15 ? "Moderate" : maxStress < 30 ? "High" : "Critical",
      maxStressProbability: maxStress, incomeDropToStress: parseFloat((Math.max(0, 1 - (emi / foirLimit) / monthlyIncome) * 100).toFixed(2)),
      breakEvenIncome: Math.round(emi / foirLimit), interpretation: `Stress test complete. Maximum risk at ${maxStress}% across simulated scenarios.`
    }, 200, requestId);
  } catch (err) {
    console.error("[/api/v1/loan/stress-test]", err);
    return createErrorResponse("Stress test failed", 500, requestId);
  }
}
