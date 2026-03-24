"use client";

import { formatINR } from "@/context/LoanContext";
import { useState } from "react";

interface YearRow {
  year: number;
  interestPaid: number;
  principalPaid: number;
  sec24bDeduction: number;
  sec80cDeduction: number;
  totalDeduction: number;
  taxSaving: number;
  effectiveCost: number;
}

interface TaxResult {
  regime: string;
  applicableDeductions: string[];
  yearlyBreakdown: YearRow[];
  totals: {
    totalInterest: number;
    totalTaxSaving: number;
    totalEffectiveCost: number;
  };
  effectiveInterestRate: number;
  summary: string;
}

export default function TaxBenefitPage() {
  const [form, setForm] = useState({
    principal: "5000000",
    annualRate: "8.9",
    tenureMonths: "240",
    annualIncome: "1200000",
    taxRegime: "old",
    isFirstTimeBuyer: false,
  });
  const [result, setResult] = useState<TaxResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tax/benefit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principal: Number(form.principal),
          annualRate: Number(form.annualRate),
          tenureMonths: Number(form.tenureMonths),
          annualIncome: Number(form.annualIncome),
          taxRegime: form.taxRegime,
          isFirstTimeBuyer: form.isFirstTimeBuyer,
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

  const update = (key: string, val: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen bg-background text-on-background font-body">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm h-16 flex items-center justify-between px-8">
        <a href="/" className="font-headline font-extrabold text-xl text-primary">LoanCheck</a>
        <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Tax Benefit Calculator</span>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div>
          <p className="font-label text-xs uppercase tracking-widest text-on-tertiary-container mb-2">Home Loan Tax Benefits</p>
          <h1 className="font-headline font-extrabold text-4xl text-primary mb-3">Section 24(b) &amp; 80C Calculator</h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            Calculate your actual post-tax cost of a home loan. Under the old tax regime, you can claim up to ₹2L/year on interest (Sec 24b) and ₹1.5L/year on principal (Sec 80C).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-6 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 shadow-sm h-fit">
            <h2 className="font-headline font-bold text-xl text-on-background">Loan &amp; Income Details</h2>

            {[
              { label: "Loan Amount (₹)", key: "principal", placeholder: "50,00,000" },
              { label: "Interest Rate (% p.a.)", key: "annualRate", placeholder: "8.9" },
              { label: "Tenure (Months)", key: "tenureMonths", placeholder: "240" },
              { label: "Annual Income (₹)", key: "annualIncome", placeholder: "12,00,000" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{label}</label>
                <input
                  required
                  className="w-full bg-surface-container-high rounded-lg px-4 py-3 font-headline font-bold text-on-background outline-none focus:ring-2 focus:ring-primary"
                  placeholder={placeholder}
                  type="number"
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => update(key, e.target.value)}
                />
              </div>
            ))}

            <div>
              <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Tax Regime</label>
              <div className="flex gap-3">
                {["old", "new"].map((regime) => (
                  <button
                    key={regime}
                    type="button"
                    onClick={() => update("taxRegime", regime)}
                    className={`flex-1 py-3 rounded-lg font-headline font-bold capitalize transition-all ${form.taxRegime === regime ? "bg-primary text-white" : "bg-surface-container-low text-on-surface"}`}
                  >
                    {regime} Regime
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFirstTimeBuyer}
                onChange={(e) => update("isFirstTimeBuyer", e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-on-surface-variant">First-time home buyer (Sec 80EEA)</span>
            </label>

            <button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold py-4 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
              {loading ? "Calculating…" : "Calculate Tax Benefit"}
              {!loading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
            </button>
          </form>

          {/* Result */}
          <div className="lg:col-span-7 space-y-6">
            {error && (
              <div className="bg-error-container text-on-error-container p-4 rounded-lg font-body text-sm">{error}</div>
            )}

            {result && (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Total Interest", value: formatINR(result.totals.totalInterest), accent: false },
                    { label: "Tax Saving", value: formatINR(result.totals.totalTaxSaving), accent: true },
                    { label: "Effective Rate", value: `${result.effectiveInterestRate}%`, accent: false },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className={`p-6 rounded-xl border border-outline-variant/10 ${accent ? "bg-primary-container text-white" : "bg-surface-container-lowest"}`}>
                      <p className={`font-label text-[10px] uppercase tracking-widest mb-2 ${accent ? "text-on-primary-container" : "text-on-surface-variant"}`}>{label}</p>
                      <p className={`font-headline font-extrabold text-2xl ${accent ? "text-white" : "text-primary"}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Summary text */}
                <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-on-tertiary-container">
                  <p className="text-on-surface font-body leading-relaxed">{result.summary}</p>
                </div>

                {/* Applicable deductions */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">Applicable Deductions</h3>
                  <ul className="space-y-2">
                    {result.applicableDeductions.map((d) => (
                      <li key={d} className="flex items-start gap-2 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-on-tertiary-container text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Year-by-year table (first 5 years) */}
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
                  <div className="px-6 py-5 border-b border-outline-variant/10">
                    <h3 className="font-headline font-bold text-lg text-primary">Year-by-Year Breakdown</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">First 5 years shown</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-container-low">
                          {["Year", "Interest Paid", "Principal Paid", "Sec 24(b)", "Sec 80C", "Tax Saving", "Effective Cost"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.yearlyBreakdown.slice(0, 5).map((row) => (
                          <tr key={row.year} className="border-t border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-on-surface-variant">Y{row.year}</td>
                            <td className="px-4 py-3 text-on-surface">{formatINR(row.interestPaid)}</td>
                            <td className="px-4 py-3 text-on-surface">{formatINR(row.principalPaid)}</td>
                            <td className="px-4 py-3 text-on-surface">{formatINR(row.sec24bDeduction)}</td>
                            <td className="px-4 py-3 text-on-surface">{formatINR(row.sec80cDeduction)}</td>
                            <td className="px-4 py-3 font-bold text-[#2e7d32]">{formatINR(row.taxSaving)}</td>
                            <td className="px-4 py-3 font-bold text-primary">{formatINR(row.effectiveCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {!result && !loading && !error && (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30">calculate</span>
                <p className="text-on-surface-variant font-body">Fill in the form and calculate to see your tax savings.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
