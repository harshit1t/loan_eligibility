"use client";

import { formatINR } from "@/context/LoanContext";
import { useState } from "react";

interface ApplicantEligibility {
  monthlyIncome: number;
  employmentStatus: string;
  foirLimit: number;
  availableEmi: number;
  maxLoan: number;
  effectiveTenure: number;
  isApprovedAlone: boolean;
}

interface JointResult {
  primaryApplicant: ApplicantEligibility;
  coApplicant: ApplicantEligibility;
  joint: {
    combinedMonthlyIncome: number;
    foirLimit: number;
    availableEmi: number;
    maxLoan: number;
    effectiveTenure: number;
    isApproved: boolean;
    additionalEligibilityVsPrimary: number;
  };
  requestedCapital: number;
  requiredEmi: number;
  annualRate: number;
  ownershipRecommendation: {
    primaryApplicantShare: number;
    coApplicantShare: number;
    primaryApplicantPercent: number;
    coApplicantPercent: number;
    note: string;
  };
  verdict: string;
}

const EMPLOYMENT_OPTS = ["Salaried", "Freelance", "Business"];

export default function JointLoanPage() {
  const [form, setForm] = useState({
    pa: { monthlyIncome: "100000", employmentStatus: "Salaried", monthlyEmi: "0", age: "32" },
    ca: { monthlyIncome: "70000", employmentStatus: "Salaried", monthlyEmi: "0", age: "30" },
    requestedCapital: "8000000",
    repaymentTerm: "240",
    annualRate: "8.9",
  });
  const [result, setResult] = useState<JointResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateApplicant = (who: "pa" | "ca", key: string, val: string) =>
    setForm((prev) => ({ ...prev, [who]: { ...prev[who], [key]: val } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/v1/loan/joint-calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryIncome: Number(form.pa.monthlyIncome),
          secondaryIncome: Number(form.ca.monthlyIncome),
          primaryEmi: Number(form.pa.monthlyEmi),
          secondaryEmi: Number(form.ca.monthlyEmi),
          requestedCapital: Number(form.requestedCapital),
          tenureMonths: Number(form.repaymentTerm), // match v1 key
          annualRate: Number(form.annualRate),
        }),
      });
      const json = await res.json();
      if (json.success) setResult(json.data);
      else setError(typeof json.details === 'object' ? Object.values(json.details).flat().join(", ") : (json.error || "Calculation failed"));
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const ApplicantForm = ({ who, label }: { who: "pa" | "ca"; label: string }) => (
    <div className="bg-surface-container-low p-6 rounded-xl space-y-4">
      <h3 className="font-headline font-bold text-base text-on-background">{label}</h3>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Monthly Income (₹)", key: "monthlyIncome", placeholder: "1,00,000" },
          { label: "Age", key: "age", placeholder: "32" },
          { label: "Existing EMI (₹)", key: "monthlyEmi", placeholder: "0" },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">{label}</label>
            <input
              required
              className="w-full bg-surface-container-highest rounded-lg px-3 py-2.5 font-bold text-on-background outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder={placeholder}
              type="number"
              value={form[who][key as keyof typeof form.pa]}
              onChange={(e) => updateApplicant(who, key, e.target.value)}
            />
          </div>
        ))}
        <div>
          <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">Employment</label>
          <select
            className="w-full bg-surface-container-highest rounded-lg px-3 py-2.5 font-bold text-on-background outline-none focus:ring-2 focus:ring-primary text-sm"
            value={form[who].employmentStatus}
            onChange={(e) => updateApplicant(who, "employmentStatus", e.target.value)}
          >
            {EMPLOYMENT_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-on-background font-body">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm h-16 flex items-center justify-between px-8">
        <a href="/" className="font-headline font-extrabold text-xl text-primary">LoanCheck</a>
        <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Joint Loan Calculator</span>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div>
          <p className="font-label text-xs uppercase tracking-widest text-on-tertiary-container mb-2">Co-applicant Eligibility</p>
          <h1 className="font-headline font-extrabold text-4xl text-primary mb-3">Joint Loan Calculator</h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            Adding a co-applicant combines FOIR capacity and significantly increases eligibility. Common for home loans with spouse or parent as co-applicant.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-6 h-fit">
            <ApplicantForm who="pa" label="Primary Applicant" />
            <ApplicantForm who="ca" label="Co-Applicant" />

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 space-y-4">
              <h3 className="font-headline font-bold text-base text-on-background">Loan Details</h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: "Requested Amount (₹)", key: "requestedCapital", placeholder: "80,00,000" },
                  { label: "Tenure (Months)", key: "repaymentTerm", placeholder: "240" },
                  { label: "Interest Rate (% p.a.)", key: "annualRate", placeholder: "8.9" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5">{label}</label>
                    <input
                      required
                      className="w-full bg-surface-container-high rounded-lg px-4 py-3 font-headline font-bold text-on-background outline-none focus:ring-2 focus:ring-primary"
                      placeholder={placeholder}
                      type="number"
                      value={form[key as keyof typeof form] as string}
                      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold py-4 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
              {loading ? "Calculating…" : "Calculate Joint Eligibility"}
              {!loading && <span className="material-symbols-outlined text-sm">group</span>}
            </button>
          </form>

          {/* Result */}
          <div className="lg:col-span-7 space-y-6">
            {error && <div className="bg-error-container text-on-error-container p-4 rounded-lg text-sm">{error}</div>}

            {result && (
              <>
                {/* Verdict banner */}
                <div className={`p-6 rounded-xl border-l-4 ${result.joint.isApproved ? "border-on-tertiary-container bg-[#e8f5e9]" : "border-error bg-error-container/20"}`}>
                  <p className={`font-body leading-relaxed ${result.joint.isApproved ? "text-[#1b5e20]" : "text-on-error-container"}`}>{result.verdict}</p>
                </div>

                {/* Eligibility comparison */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Primary Alone", value: formatINR(result.primaryApplicant.maxLoan), approved: result.primaryApplicant.isApprovedAlone },
                    { label: "Co-applicant Alone", value: formatINR(result.coApplicant.maxLoan), approved: result.coApplicant.isApprovedAlone },
                    { label: "Joint Eligibility", value: formatINR(result.joint.maxLoan), approved: result.joint.isApproved, accent: true },
                  ].map(({ label, value, approved, accent }) => (
                    <div key={label} className={`p-5 rounded-xl border border-outline-variant/10 ${accent ? "bg-primary-container text-white" : "bg-surface-container-lowest"}`}>
                      <p className={`font-label text-[10px] uppercase tracking-widest mb-2 ${accent ? "text-on-primary-container" : "text-on-surface-variant"}`}>{label}</p>
                      <p className={`font-headline font-extrabold text-xl ${accent ? "text-white" : "text-primary"}`}>{value}</p>
                      <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${approved ? "bg-[#e8f5e9] text-[#2e7d32]" : "bg-error-container text-on-error-container"}`}>
                        {approved ? "✓ Eligible" : "✗ Below request"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* FOIR breakdown */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 space-y-4">
                  <h3 className="font-headline font-bold text-lg text-primary">FOIR Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      { label: "Combined Income", value: formatINR(result.joint.combinedMonthlyIncome) + "/mo" },
                      { label: "FOIR Limit Applied", value: `${result.joint.foirLimit}%` },
                      { label: "Available EMI Capacity", value: formatINR(result.joint.availableEmi) + "/mo" },
                      { label: "Required EMI", value: formatINR(result.requiredEmi) + "/mo" },
                      { label: "Effective Tenure", value: `${result.joint.effectiveTenure} months` },
                      { label: "Boost vs Primary Alone", value: `+${formatINR(result.joint.additionalEligibilityVsPrimary)}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-surface-container-low p-4 rounded-lg">
                        <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
                        <p className="font-headline font-bold text-on-background">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ownership recommendation */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
                  <h3 className="font-headline font-bold text-lg text-primary mb-1">Ownership Recommendation</h3>
                  <p className="text-xs text-on-surface-variant mb-4">{result.ownershipRecommendation.note}</p>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-surface-container-low p-4 rounded-lg">
                      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Primary Applicant</p>
                      <p className="font-headline font-bold text-xl text-primary">{formatINR(result.ownershipRecommendation.primaryApplicantShare)}</p>
                      <p className="text-xs text-on-surface-variant">{result.ownershipRecommendation.primaryApplicantPercent}% share</p>
                    </div>
                    <div className="flex-1 bg-surface-container-low p-4 rounded-lg">
                      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Co-Applicant</p>
                      <p className="font-headline font-bold text-xl text-primary">{formatINR(result.ownershipRecommendation.coApplicantShare)}</p>
                      <p className="text-xs text-on-surface-variant">{result.ownershipRecommendation.coApplicantPercent}% share</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!result && !loading && !error && (
              <div className="flex flex-col items-center justify-center h-64 gap-4 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30">group</span>
                <p className="text-on-surface-variant font-body">Fill in both applicant details to see joint eligibility.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
