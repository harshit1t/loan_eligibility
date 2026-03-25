"use client";

import { formatINR } from "@/context/LoanContext";
import { useState } from "react";

interface LenderOffer {
  lender: string;
  fullName: string;
  type: string;
  annualRate: number;
  emi: number;
  maxEligible: number;
  isEligible: boolean;
  totalInterest: number;
  processingFee: number;
  totalCostOfCredit: number;
  totalRepayment: number;
  prepaymentPenalty: number;
  specialNote: string;
  rank: number | null;
  isBestDeal: boolean;
}

interface CompareResult {
  requestedCapital: number;
  repaymentTerm: number;
  loanPurpose: string;
  eligible: LenderOffer[];
  ineligible: LenderOffer[];
  summary: {
    totalLenders: number;
    eligibleCount: number;
    bestDeal: string | null;
    bestRate: number | null;
    savingsByChoosingBest: number;
  };
}

const EMPLOYMENT_OPTS = ["Salaried", "Freelance", "Business"];
const PURPOSE_OPTS = ["Home", "Education", "Business"];

export default function LoanComparePage() {
  const [form, setForm] = useState({
    monthlyIncome: "100000",
    requestedCapital: "5000000",
    repaymentTerm: "240",
    employmentStatus: "Salaried",
    monthlyEmi: "0",
    loanPurpose: "Home",
  });
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/loan/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyIncome: Number(form.monthlyIncome),
          requestedCapital: Number(form.requestedCapital),
          repaymentTerm: Number(form.repaymentTerm),
          employmentStatus: form.employmentStatus,
          monthlyEmi: Number(form.monthlyEmi),
          loanPurpose: form.loanPurpose,
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
        <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Lender Comparison</span>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div>
          <p className="font-label text-xs uppercase tracking-widest text-on-tertiary-container mb-2">Multi-Lender</p>
          <h1 className="font-headline font-extrabold text-4xl text-primary mb-3">Loan Comparison Engine</h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            Compare offers from SBI, HDFC, ICICI, Axis, PNB Housing, and IDFC First. Ranked by <strong>Total Cost of Credit</strong> — not just the headline rate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <form onSubmit={handleSubmit} className="lg:col-span-4 space-y-5 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 shadow-sm h-fit">
            {[
              { label: "Monthly Income (₹)", key: "monthlyIncome", placeholder: "1,00,000" },
              { label: "Loan Amount (₹)", key: "requestedCapital", placeholder: "50,00,000" },
              { label: "Tenure (Months)", key: "repaymentTerm", placeholder: "240" },
              { label: "Existing EMI (₹)", key: "monthlyEmi", placeholder: "0" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5 block">{label}</label>
                <input
                  required type="number" placeholder={placeholder}
                  className="w-full bg-surface-container-high rounded-lg px-4 py-3 font-headline font-bold text-on-background outline-none focus:ring-2 focus:ring-primary"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => update(key, e.target.value)}
                />
              </div>
            ))}
            <div>
              <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5 block">Employment</label>
              <select className="w-full bg-surface-container-high rounded-lg px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-primary" value={form.employmentStatus} onChange={(e) => update("employmentStatus", e.target.value)}>
                {EMPLOYMENT_OPTS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5 block">Loan Purpose</label>
              <div className="flex gap-2">
                {PURPOSE_OPTS.map((p) => (
                  <button key={p} type="button" onClick={() => update("loanPurpose", p)}
                    className={`flex-1 py-2.5 rounded-lg font-headline font-bold text-sm transition-all ${form.loanPurpose === p ? "bg-primary text-white" : "bg-surface-container-low text-on-surface"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold py-4 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
              {loading ? "Comparing…" : "Compare Lenders"}
              {!loading && <span className="material-symbols-outlined text-sm">compare_arrows</span>}
            </button>
          </form>

          <div className="lg:col-span-8 space-y-6">
            {error && <div className="bg-error-container text-on-error-container p-4 rounded-lg text-sm">{error}</div>}

            {result && (
              <>
                {/* Summary banner */}
                {result.summary.savingsByChoosingBest > 0 && (
                  <div className="bg-[#e8f5e9] border border-[#a5d6a7] rounded-xl p-5 flex items-center gap-4">
                    <span className="material-symbols-outlined text-[#2e7d32] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
                    <div>
                      <p className="font-headline font-bold text-[#1b5e20]">
                        Save {formatINR(result.summary.savingsByChoosingBest)} by choosing {result.summary.bestDeal}
                      </p>
                      <p className="text-sm text-[#2e7d32]">vs. the most expensive eligible lender — over the full loan tenure</p>
                    </div>
                  </div>
                )}

                {/* Offers table */}
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
                  <div className="px-6 py-5 border-b border-outline-variant/10">
                    <h2 className="font-headline font-bold text-xl text-primary">Eligible Lenders ({result.eligible.length})</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface-container-low">
                          {["#", "Lender", "Rate", "EMI/mo", "Processing Fee", "Total Interest", "Total Cost", ""].map((h) => (
                            <th key={h} className="px-4 py-3 text-left font-label text-[10px] uppercase tracking-widest text-on-surface-variant whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.eligible.map((offer) => (
                          <tr key={offer.lender} className={`border-t border-outline-variant/10 transition-colors ${offer.isBestDeal ? "bg-[#e8f5e9]/50" : ""}`}>
                            <td className="px-4 py-4 font-headline font-bold text-on-surface-variant">{offer.rank}</td>
                            <td className="px-4 py-4">
                              <div className="font-bold text-on-background">{offer.lender}</div>
                              <div className="text-[10px] text-on-surface-variant">{offer.type}</div>
                            </td>
                            <td className="px-4 py-4 font-bold text-primary">{offer.annualRate}%</td>
                            <td className="px-4 py-4 font-bold text-on-background">{formatINR(offer.emi)}</td>
                            <td className="px-4 py-4 text-on-surface-variant">{formatINR(offer.processingFee)}</td>
                            <td className="px-4 py-4 text-on-surface-variant">{formatINR(offer.totalInterest)}</td>
                            <td className="px-4 py-4 font-bold text-on-background">{formatINR(offer.totalCostOfCredit)}</td>
                            <td className="px-4 py-4">
                              {offer.isBestDeal && (
                                <span className="bg-[#e8f5e9] text-[#2e7d32] font-label text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide font-bold whitespace-nowrap">Best Deal</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Special notes */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
                  <h3 className="font-headline font-bold text-lg text-primary mb-4">Lender Notes</h3>
                  <div className="space-y-3">
                    {result.eligible.map((o) => (
                      <div key={o.lender} className="flex gap-3 text-sm">
                        <span className="font-bold text-on-background w-24 shrink-0">{o.lender}</span>
                        <span className="text-on-surface-variant">{o.specialNote}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {result.ineligible.length > 0 && (
                  <div className="bg-surface-container-low p-5 rounded-xl text-sm text-on-surface-variant">
                    <span className="font-bold text-on-surface">Not eligible: </span>
                    {result.ineligible.map((o) => o.lender).join(" · ")}
                    {" — income or profile below minimum threshold"}
                  </div>
                )}
              </>
            )}

            {!result && !loading && !error && (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30">compare_arrows</span>
                <p className="text-on-surface-variant">Fill in your details to compare lenders.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
