"use client";

import { useLoan, formatINR, CalcResult } from "@/context/LoanContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Step5() {
  const router = useRouter();
  const { data, setCalcResult: saveResult } = useLoan();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const downloadPdf = async (r: CalcResult) => {
    setDownloading(true);
    try {
      const res = await fetch("/api/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...r, fullName: data.fullName, loanPurpose: data.loanPurpose }),
      });
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LoanCheck-${data.fullName.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("PDF generation failed.");
    } finally {
      setDownloading(false);
    }
  };

  const shareResult = async (r: CalcResult) => {
    setSharing(true);
    try {
      const res = await fetch("/api/share/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...r,
          annualRate: r.annualInterestRate, // fix: CalcResult uses annualInterestRate; API schema expects annualRate
          fullName: data.fullName,
          loanPurpose: data.loanPurpose,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShareUrl(json.data.shareUrl);
        navigator.clipboard?.writeText(json.data.shareUrl).catch(() => {});
      } else {
        const msg = Object.values(json.details ?? {}).flat().join(", ") || json.error;
        alert("Share failed: " + msg);
      }
    } catch {
      alert("Share failed — network error.");
    } finally {
      setSharing(false);
    }
  };

  useEffect(() => {
    const payload = {
      fullName: data.fullName,
      age: Number(data.age),
      employmentStatus: data.employmentStatus,
      monthlyIncome: Number(data.monthlyIncome),
      requestedCapital: Number(data.requestedCapital),
      loanPurpose: data.loanPurpose,
      repaymentTerm: Number(data.repaymentTerm),
      monthlyEmi: Number(data.monthlyEmi || 0),
      creditCardOutstanding: Number(data.creditCardOutstanding || 0),
      activeLoanAccounts: Number(data.activeLoanAccounts || 0),
    };

    fetch("/api/loan/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setResult(json.data);
          saveResult(json.data); // persist to context for dashboard
        } else {
          const msgs = Object.values(json.details ?? {}).flat().join(", ");
          setError(msgs || json.error || "Calculation failed.");
        }
      })
      .catch(() => setError("Network error. Please try again."))
      .finally(() => setLoading(false));
  }, [data]);

  const scoreProgress = result ? (result.cibilScore - 350) / (900 - 350) : 0;
  const dashArray = 440;
  const dashOffset = dashArray - dashArray * scoreProgress;

  return (
    <div className="bg-background text-on-background font-body min-h-screen flex flex-col overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center h-16 px-8 max-w-full mx-auto">
          <div className="text-xl font-extrabold tracking-tighter text-[#000613] font-headline">LoanCheck</div>
        </div>
      </nav>

      <main className="flex-grow pt-16 flex flex-col">
        {/* Progress 100% */}
        <div className="w-full h-1 bg-outline-variant/20 relative">
          <div className="absolute top-0 left-0 h-full bg-on-tertiary-container w-full transition-all duration-1000"></div>
        </div>

        {loading && (
          <div className="flex-grow flex flex-col items-center justify-center gap-6 py-24">
            <div className="w-16 h-16 rounded-full border-4 border-on-tertiary-container border-t-transparent animate-spin"></div>
            <p className="font-headline font-bold text-xl text-primary">Running Eligibility Engine…</p>
            <p className="font-body text-sm text-on-surface-variant">Fetching live RBI rates &amp; calculating FOIR</p>
          </div>
        )}

        {error && (
          <div className="flex-grow flex flex-col items-center justify-center gap-6 py-24 px-8 text-center">
            <span className="material-symbols-outlined text-error text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            <h2 className="font-headline font-bold text-2xl text-primary">Validation Error</h2>
            <p className="text-on-surface-variant max-w-md">{error}</p>
            <button onClick={() => router.push("/step-1")} className="mt-4 px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-headline font-bold">
              Start Over
            </button>
          </div>
        )}

        {!loading && !error && result && (
          <div className="max-w-6xl mx-auto w-full px-8 py-16 flex flex-col md:flex-row gap-16">
            {/* Left col */}
            <div className="flex-1 space-y-12">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-on-tertiary-container">
                  <span className="font-headline font-bold text-lg">Step 5 of 5</span>
                  <span className="w-8 h-[1px] bg-on-tertiary-container/30"></span>
                  <span className="font-label text-xs uppercase tracking-widest text-outline">Application Complete</span>
                </div>
                <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-primary leading-tight">
                  {result.isApproved ? "Approval Secured." : "Assessment Complete."}
                </h1>
              </div>

              {/* Status card */}
              <div className="bg-surface-container-lowest p-10 rounded-xl shadow-[0px_10px_40px_rgba(13,28,46,0.06)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-surface-container-low rounded-full opacity-50"></div>
                <div className="relative z-10 flex flex-col items-start space-y-6">
                  <div className={`w-20 h-20 ${result.isApproved ? "bg-on-tertiary-container" : "bg-outline"} flex items-center justify-center rounded-full shadow-lg`}>
                    <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {result.isApproved ? "check_circle" : "info"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="font-label text-xs font-medium uppercase tracking-widest text-on-tertiary-container">
                      Status: {result.isApproved ? "Approved" : "Conditionally Assessed"}
                    </p>
                    <h2 className="font-headline text-3xl font-bold text-on-surface">
                      {result.isApproved ? "Loan Approved" : "Loan Amount Adjusted"}
                    </h2>
                    <p className="text-on-surface-variant font-body leading-relaxed max-w-lg">{result.approvalReason}</p>
                    {result.tenureCapped && (
                      <p className="text-xs font-medium bg-error-container text-on-error-container px-3 py-2 rounded-lg inline-block mt-2">
                        ⚠ {result.tenureCappedReason}
                      </p>
                    )}
                  </div>
                  <div className="pt-2 flex flex-wrap gap-4">
                    {result.isApproved ? (
                      <button
                        onClick={() => { saveResult(result); router.push("/dashboard"); }}
                        className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-4 rounded-lg font-headline font-bold hover:opacity-90 transition-all flex items-center space-x-2"
                      >
                        <span>Sign Loan Agreement</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    ) : (
                      <button onClick={() => router.push("/step-2")} className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-4 rounded-lg font-headline font-bold hover:opacity-90 transition-all flex items-center space-x-2">
                        <span>Adjust Loan</span>
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    )}
                    <button
                        onClick={() => result && downloadPdf(result)}
                        disabled={downloading}
                        className="bg-surface-container-highest text-on-primary-fixed px-8 py-4 rounded-lg font-headline font-bold hover:bg-surface-container-high transition-all flex items-center space-x-2 disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span>{downloading ? "Generating…" : "Download PDF"}</span>
                      </button>
                      <button
                        onClick={() => result && shareResult(result)}
                        disabled={sharing}
                        className="bg-surface-container-highest text-on-primary-fixed px-8 py-4 rounded-lg font-headline font-bold hover:bg-surface-container-high transition-all flex items-center space-x-2 disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-sm">share</span>
                        <span>{sharing ? "Generating…" : shareUrl ? "Link Copied!" : "Share Result"}</span>
                      </button>
                    </div>
                    {shareUrl && (
                      <p className="text-xs text-on-surface-variant mt-2 break-all">Shareable link (7 days): <span className="font-mono text-on-tertiary-container">{shareUrl}</span></p>
                    )}
                </div>
              </div>

              {/* AI Underwriter */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-on-tertiary-container">psychology</span>
                  <h3 className="font-headline text-xl font-bold text-on-surface">AI Underwriter Analysis</h3>
                </div>
                <div className="bg-surface-container-low p-8 rounded-lg border-l-4 border-on-tertiary-container">
                  <p className="text-on-surface font-body italic leading-loose text-lg">
                    &ldquo;{result.isApproved
                      ? `The applicant's FOIR of ${result.foir}% is well within the prescribed limit of ${result.foirLimit}%. Available EMI capacity of ${formatINR(result.availableEmiCapacity)}/month comfortably covers required EMI of ${formatINR(result.requiredEmi)}. Rate source: ${result.rateSource}. Recommendation: Execute.`
                      : `Available EMI capacity of ${formatINR(result.availableEmiCapacity)}/month supports a maximum exposure of ${formatINR(result.maxEligibleAmount)}. FOIR stands at ${result.foir}% against a limit of ${result.foirLimit}%. Recommend reducing principal or extending tenure.`}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></div>
                    <span className="text-xs font-label uppercase tracking-widest text-outline">Verified by Sovereign Core Intelligence · {result.rateSource}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right col */}
            <div className="w-full md:w-96 flex flex-col space-y-6">
              {/* CIBIL Score */}
              <div className="bg-primary text-white p-8 rounded-xl flex flex-col items-center space-y-4 text-center">
                <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-primary-container">Simulated CIBIL Score</p>
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-primary-container" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="8"></circle>
                    <circle className="text-on-tertiary-container" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeWidth="8"></circle>
                  </svg>
                  <div className="absolute flex flex-col">
                    <span className="font-headline text-5xl font-extrabold">{result.cibilScore}</span>
                    <span className="font-label text-xs opacity-50">/ 900</span>
                  </div>
                </div>
                <div className="px-4 py-1 bg-on-tertiary-container/20 rounded-full">
                  <p className="text-[10px] font-bold uppercase tracking-widest">{result.creditBand}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: "Max Eligible", value: formatINR(result.maxEligibleAmount), icon: "payments" },
                  { label: "Required EMI", value: formatINR(result.requiredEmi) + "/mo", icon: "calendar_today" },
                  { label: "Interest Rate", value: `${result.annualInterestRate}% APR`, icon: "trending_down" },
                  { label: "Total Interest", value: formatINR(result.totalInterestPayable), icon: "account_balance" },
                  { label: "FOIR", value: `${result.foir}% of ${result.foirLimit}% limit`, icon: "bar_chart" },
                  { label: "Tenure", value: `${result.effectiveTenure} months`, icon: "schedule" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="bg-surface-container-low p-5 rounded-lg flex justify-between items-center">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-label uppercase tracking-widest text-outline">{label}</p>
                      <p className="font-headline font-bold text-on-surface text-sm">{value}</p>
                    </div>
                    <span className="material-symbols-outlined text-on-tertiary-container opacity-40">{icon}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
