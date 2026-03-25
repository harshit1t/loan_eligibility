import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const StressTestSchema = z.object({
  principal: z.number().min(10000),
  annualRate: z.number().min(1).max(30),
  tenureMonths: z.number().int().min(12).max(360),
  monthlyIncome: z.number().min(5000),
  employmentStatus: z.enum(["Salaried", "Freelance", "Business"]),
  incomeVolatility: z.number().min(0.01).max(1).default(0.20), // annualised σ
  simulations: z.number().int().min(100).max(5000).default(1000),
});

const FOIR_LIMITS: Record<string, number> = { Salaried: 0.50, Freelance: 0.45, Business: 0.40 };

// Box-Muller transform: generate standard normal random variable
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Simulate one income path using Geometric Brownian Motion
// dY_t = μ * Y_t * dt + σ * Y_t * dW_t
function simulateIncomePath(
  initialIncome: number,
  annualDrift: number,   // μ: expected annual income growth (0 = no growth assumed = conservative)
  annualVol: number,     // σ: annual income volatility
  months: number
): number[] {
  const dt = 1 / 12; // monthly timestep
  const path: number[] = [initialIncome];
  let Y = initialIncome;

  for (let t = 1; t <= months; t++) {
    // GBM: Y_{t+dt} = Y_t * exp((μ - σ²/2)*dt + σ*√dt*Z)
    const drift = (annualDrift - 0.5 * annualVol ** 2) * dt;
    const diffusion = annualVol * Math.sqrt(dt) * gaussianRandom();
    Y = Y * Math.exp(drift + diffusion);
    path.push(Y);
  }
  return path;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const coerced = {
      ...body,
      principal: Number(body.principal),
      annualRate: Number(body.annualRate),
      tenureMonths: Number(body.tenureMonths),
      monthlyIncome: Number(body.monthlyIncome),
      incomeVolatility: Number(body.incomeVolatility ?? 0.20),
      simulations: Number(body.simulations ?? 1000),
    };

    const parsed = StressTestSchema.safeParse(coerced);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { principal, annualRate, tenureMonths, monthlyIncome, employmentStatus, incomeVolatility, simulations } = parsed.data;

    const r = annualRate / 100 / 12;
    const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
    const foirLimit = FOIR_LIMITS[employmentStatus];
    const currentFoir = emi / monthlyIncome;

    // Conservative: assume 0% income growth (worst-case scenario)
    const annualDrift = 0.0;

    // Checkpoints (months): 12m, 36m, 60m (or tenure end if shorter)
    const checkpoints = [12, 36, 60].filter((m) => m <= tenureMonths);

    // Run Monte Carlo simulations
    const results = Array.from({ length: simulations }, () =>
      simulateIncomePath(monthlyIncome, annualDrift, incomeVolatility, Math.min(61, tenureMonths))
    );

    // At each checkpoint, count scenarios where FOIR exceeds limit (income stress)
    const stressByCheckpoint = checkpoints.map((month) => {
      const stressedCount = results.filter((path) => {
        const simIncome = path[Math.min(month, path.length - 1)];
        return emi / simIncome > foirLimit;
      }).length;

      // Income distribution at this checkpoint
      const incomes = results.map((p) => p[Math.min(month, p.length - 1)]).sort((a, b) => a - b);
      const p10 = Math.round(incomes[Math.floor(simulations * 0.1)]);
      const p50 = Math.round(incomes[Math.floor(simulations * 0.5)]);
      const p90 = Math.round(incomes[Math.floor(simulations * 0.9)]);

      const stressProbability = stressedCount / simulations;

      return {
        month,
        stressProbability: parseFloat((stressProbability * 100).toFixed(2)),
        stressedScenarios: stressedCount,
        incomeP10: p10,
        incomeP50: p50,
        incomeP90: p90,
        // Minimum income needed to not be stressed:
        breakEvenIncome: Math.round(emi / foirLimit),
      };
    });

    // Overall risk at worst checkpoint
    const maxStress = Math.max(...stressByCheckpoint.map((c) => c.stressProbability));
    const riskBand =
      maxStress < 5 ? "Low"
      : maxStress < 15 ? "Moderate"
      : maxStress < 30 ? "High"
      : "Critical";

    const riskColor =
      riskBand === "Low" ? "green"
      : riskBand === "Moderate" ? "amber"
      : riskBand === "High" ? "orange"
      : "red";

    // Stress multiplier: what income drop % would push into distress today?
    const incomeDropToStress = Math.max(0, 1 - (emi / foirLimit) / monthlyIncome);

    return NextResponse.json({
      success: true,
      data: {
        inputs: {
          principal,
          annualRate,
          tenureMonths,
          monthlyIncome,
          employmentStatus,
          incomeVolatility,
          simulations,
        },
        emi: Math.round(emi),
        currentFoir: parseFloat((currentFoir * 100).toFixed(2)),
        foirLimit: foirLimit * 100,
        stressByCheckpoint,
        riskBand,
        riskColor,
        maxStressProbability: maxStress,
        incomeDropToStress: parseFloat((incomeDropToStress * 100).toFixed(2)),
        breakEvenIncome: Math.round(emi / foirLimit),
        interpretation:
          riskBand === "Low"
            ? `Strong repayment capacity. Income would need to fall ${(incomeDropToStress * 100).toFixed(0)}% before loan becomes unaffordable. Low risk of default.`
            : riskBand === "Moderate"
            ? `Moderate income volatility risk. Under ${simulations} simulated scenarios, up to ${maxStress.toFixed(1)}% result in FOIR breach. Consider a 3-6 month EMI buffer.`
            : riskBand === "High"
            ? `High stress probability (${maxStress.toFixed(1)}%). Income needs to stay above ₹${Math.round(emi / foirLimit).toLocaleString("en-IN")}/month. Recommend loan insurance cover.`
            : `Critical risk. Over ${maxStress.toFixed(1)}% of scenarios result in financial stress. Loan amount or tenure should be reconsidered.`,
      },
    });
  } catch (err) {
    console.error("[/api/loan/stress-test]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
