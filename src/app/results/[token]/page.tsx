import { verifyToken } from "@/app/api/share/generate/route";

interface ShareData {
  fullName: string;
  loanPurpose: string;
  requestedCapital: number;
  annualRate: number;
  effectiveTenure: number;
  requiredEmi: number;
  maxEligibleAmount: number;
  isApproved: boolean;
  cibilScore: number;
  creditBand: string;
  foir: number;
  foirLimit: number;
  totalInterestPayable: number;
  iat: number;
  exp: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function SharedResultPage({ params }: { params: { token: string } }) {
  const data = verifyToken(params.token) as ShareData | null;

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 font-body text-center px-8">
        <span className="material-symbols-outlined text-error text-6xl">link_off</span>
        <h1 className="font-headline font-bold text-2xl text-primary">Invalid or Expired Link</h1>
        <p className="text-on-surface-variant max-w-sm">This result link is no longer valid. Shared links expire after 7 days.</p>
        <a href="/" className="mt-4 px-6 py-3 bg-primary text-white font-headline font-bold rounded-lg hover:opacity-90 transition-all">
          Run New Check
        </a>
      </div>
    );
  }

  const scoreProgress = (data.cibilScore - 350) / (900 - 350);
  const dashArray = 440;
  const dashOffset = dashArray - dashArray * scoreProgress;
  const sharedDate = new Date(data.iat).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background text-on-background font-body">
      <nav className="bg-white border-b border-slate-100 shadow-sm h-16 flex items-center justify-between px-8">
        <a href="/" className="font-headline font-extrabold text-xl text-primary">LoanCheck</a>
        <span className="font-label text-[10px] uppercase tracking-widest text-outline">Shared Result · {sharedDate}</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <div className="text-center space-y-3">
          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-label text-xs font-bold uppercase tracking-widest ${data.isApproved ? "bg-[#e8f5e9] text-[#2e7d32]" : "bg-error-container text-on-error-container"}`}>
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              {data.isApproved ? "check_circle" : "info"}
            </span>
            {data.isApproved ? "Loan Approved" : "Loan Assessment"}
          </span>
          <h1 className="font-headline font-extrabold text-5xl text-primary">{data.fullName}</h1>
          <p className="text-on-surface-variant">{data.loanPurpose} Loan · Shared on {sharedDate}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Requested", value: fmt(data.requestedCapital) },
            { label: "Max Eligible", value: fmt(data.maxEligibleAmount) },
            { label: "Monthly EMI", value: fmt(data.requiredEmi) },
            { label: "Interest Rate", value: `${data.annualRate}% APR` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 text-center shadow-sm">
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{label}</p>
              <p className="font-headline font-extrabold text-xl text-primary">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CIBIL */}
          <div className="bg-primary text-white p-8 rounded-xl flex flex-col items-center gap-4">
            <p className="font-label text-[10px] uppercase tracking-widest text-on-primary-container">Simulated CIBIL</p>
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle cx="80" cy="80" r="70" fill="none" stroke="white" strokeWidth="8"
                  strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-headline font-extrabold text-3xl">{data.cibilScore}</span>
                <span className="text-xs opacity-60">/ 900</span>
              </div>
            </div>
            <span className="px-4 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">{data.creditBand}</span>
          </div>

          {/* Key metrics */}
          <div className="space-y-3">
            {[
              { label: "FOIR", value: `${data.foir}% of ${data.foirLimit}% limit`, icon: "bar_chart" },
              { label: "Total Interest", value: fmt(data.totalInterestPayable), icon: "account_balance" },
              { label: "Tenure", value: `${data.effectiveTenure} months`, icon: "schedule" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">{label}</p>
                  <p className="font-headline font-bold text-on-background">{value}</p>
                </div>
                <span className="material-symbols-outlined text-on-tertiary-container opacity-40">{icon}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-outline-variant/10 pt-8 flex justify-center">
          <a href="/step-1" className="bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold px-10 py-4 rounded-xl hover:opacity-90 transition-all flex items-center gap-2">
            Check My Eligibility
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
      </main>
    </div>
  );
}
