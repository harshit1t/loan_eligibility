"use client";

import { formatINR } from "@/context/LoanContext";
import { useState } from "react";

interface CheckpointResult {
  month: number;
  stressProbability: number;
  stressedScenarios: number;
  incomeP10: number;
  incomeP50: number;
  incomeP90: number;
  breakEvenIncome: number;
}

interface StressResult {
  emi: number;
  currentFoir: number;
  foirLimit: number;
  stressByCheckpoint: CheckpointResult[];
  riskBand: "Low" | "Moderate" | "High" | "Critical";
  riskColor: string;
  maxStressProbability: number;
  incomeDropToStress: number;
  breakEvenIncome: number;
  interpretation: string;
}

const RISK_STYLE: Record<string, string> = {
  Low: "text-[#2e7d32] bg-[#e8f5e9]",
  Moderate: "text-[#f57f17] bg-[#fff8e1]",
  High: "text-[#e65100] bg-[#fff3e0]",
  Critical: "text-[#ba1a1a] bg-[#ffdad6]",
};

const EMPLOYMENT_OPTS = ["Salaried", "Freelance", "Business"];

export default function StressTestPage() {
  const [form, setForm] = useState({
    principal: "5000000",
    annualRate: "8.9",
    tenureMonths: "240",
    monthlyIncome: "100000",
    employmentStatus: "Salaried",
    incomeVolatility: "0.20",
    simulations: "1000",
  });
  const [result, setResult] = useState<StressResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/loan/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principal: Number(form.principal),
          annualRate: Number(form.annualRate),
          tenureMonths: Number(form.tenureMonths),
          monthlyIncome: Number(form.monthlyIncome),
          employmentStatus: form.employmentStatus,
          incomeVolatility: Number(form.incomeVolatility),
          simulations: Number(form.simulations),
        }),
      });
      const json = await res.json();
      if (json.success) setResult(json.data);
      else setError(JSON.stringify(json.details ?? json.error));
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-background text-on-background font-body">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm h-16 flex items-center justify-between px-8">
        <a href="/" className="font-headline font-extrabold text-xl text-primary">LoanCheck</a>
        <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Monte Carlo Stress Test</span>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div>
          <p className="font-label text-xs uppercase tracking-widest text-on-tertiary-container mb-2">Quantitative Risk Analysis</p>
          <h1 className="font-headline font-extrabold text-4xl text-primary mb-3">Loan Stress Test</h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            Simulates 1,000 income paths using Geometric Brownian Motion. At each checkpoint, calculates the probability your income drops enough to breach your FOIR limit — the same methodology used by credit risk teams.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-4 space-y-5 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 shadow-sm h-fit">
            {[
              { label: "Loan Amount (₹)", key: "principal", placeholder: "50,00,000" },
              { label: "Interest Rate (% p.a.)", key: "annualRate", placeholder: "8.9" },
              { label: "Tenure (Months)", key: "tenureMonths", placeholder: "240" },
              { label: "Monthly Income (₹)", key: "monthlyIncome", placeholder: "1,00,000" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5 block">{label}</label>
                <input required type="number" placeholder={placeholder}
                  className="w-full bg-surface-container-high rounded-lg px-4 py-3 font-headline font-bold outline-none focus:ring-2 focus:ring-primary"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => update(key, e.target.value)}
                />
              </div>
            ))}

            <div>
              <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5 block">Employment</label>
              <select className="w-full bg-surface-container-high rounded-lg px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-primary"
                value={form.employmentStatus} onChange={(e) => update("employmentStatus", e.target.value)}>
                {EMPLOYMENT_OPTS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 block">
                Income Volatility (σ): <span className="font-bold text-primary">{(Number(form.incomeVolatility) * 100).toFixed(0)}%</span>
              </label>
              <input type="range" min="0.05" max="0.60" step="0.05"
                className="w-full accent-primary"
                value={form.incomeVolatility}
                onChange={(e) => update("incomeVolatility", e.target.value)}
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                <span>5% (Very Stable)</span>
                <span>60% (High Risk)</span>
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold py-4 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
              {loading ? `Running ${form.simulations} simulations…` : "Run Stress Test"}
              {!loading && <span className="material-symbols-outlined text-sm">science</span>}
            </button>
          </form>

          {/* Results */}
          <div className="lg:col-span-8 space-y-6">
            {error && <div className="bg-error-container text-on-error-container p-4 rounded-lg text-sm">{error}</div>}

            {result && (
              <>
                {/* Risk band */}
                <div className={`p-6 rounded-xl flex items-center gap-5 ${RISK_STYLE[result.riskBand]}`}>
                  <div className="text-5xl font-headline font-extrabold">{result.riskBand}</div>
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-widest opacity-70 mb-1">Risk Band · Max Stress Probability</p>
                    <p className="font-headline font-bold text-3xl">{result.maxStressProbability.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Interpretation */}
                <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-on-tertiary-container">
                  <p className="font-body text-on-surface leading-relaxed">{result.interpretation}</p>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Monthly EMI", value: formatINR(result.emi) },
                    { label: "Current FOIR", value: `${result.currentFoir}%` },
                    { label: "Break-even Income", value: formatINR(result.breakEvenIncome) },
                    { label: "Income Drop to Distress", value: `${result.incomeDropToStress.toFixed(1)}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 shadow-sm">
                      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{label}</p>
                      <p className="font-headline font-bold text-xl text-primary">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Checkpoint table */}
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
                  <div className="px-6 py-5 border-b border-outline-variant/10">
                    <h2 className="font-headline font-bold text-xl text-primary">Stress Probability by Checkpoint</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">Based on {result.stressByCheckpoint[0]?.stressedScenarios !== undefined ? "1,000" : ""} Monte Carlo simulations</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-container-low">
                          {["Checkpoint", "Stress Probability", "Income P10 (Worst)", "Income P50 (Median)", "Income P90 (Best)", "Break-even"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left font-label text-[10px] uppercase tracking-widest text-on-surface-variant whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.stressByCheckpoint.map((row) => {
                          const stressClass =
                            row.stressProbability < 5 ? "text-[#2e7d32]"
                            : row.stressProbability < 15 ? "text-[#f57f17]"
                            : row.stressProbability < 30 ? "text-[#e65100]"
                            : "text-[#ba1a1a]";

                          return (
                            <tr key={row.month} className="border-t border-outline-variant/10">
                              <td className="px-4 py-4 font-bold text-on-surface">Month {row.month}</td>
                              <td className={`px-4 py-4 font-extrabold font-headline text-lg ${stressClass}`}>{row.stressProbability}%</td>
                              <td className="px-4 py-4 text-on-surface-variant">{formatINR(row.incomeP10)}</td>
                              <td className="px-4 py-4 text-on-background">{formatINR(row.incomeP50)}</td>
                              <td className="px-4 py-4 text-on-surface-variant">{formatINR(row.incomeP90)}</td>
                              <td className="px-4 py-4 font-medium text-on-tertiary-container">{formatINR(row.breakEvenIncome)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* What is GBM explainer */}
                <div className="bg-surface-container-low p-5 rounded-xl text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-bold text-on-surface">Methodology:</span> Income paths simulated using Geometric Brownian Motion (dY = μYdt + σYdW) with zero drift (conservative, no income growth assumed) and annualised volatility σ = {(Number(form.incomeVolatility) * 100).toFixed(0)}%. Gaussian noise generated via Box-Muller transform. FOIR breach occurs when EMI / simulated_income &gt; {result.foirLimit}%.
                </div>
              </>
            )}

            {!result && !loading && !error && (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30">science</span>
                <p className="text-on-surface-variant">Configure the simulation parameters and run the stress test.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
