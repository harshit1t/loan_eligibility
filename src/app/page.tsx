import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-on-background font-body flex flex-col">
      {/* Nav */}
      <nav className="w-full border-b border-outline-variant/10 px-8 h-16 flex items-center justify-between bg-white sticky top-0 z-50 shadow-sm">
        <span className="font-headline font-extrabold text-xl text-primary tracking-tight">LoanCheck</span>
        <Link
          href="/step-1"
          className="bg-primary text-white font-headline font-bold px-6 py-2.5 rounded-lg text-sm hover:opacity-90 transition-all"
        >
          Check Eligibility
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-grow flex flex-col items-center justify-center text-center px-6 py-24 max-w-4xl mx-auto w-full">
        <span className="inline-block bg-surface-container-low text-on-tertiary-container font-label text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8">
          India's FOIR-based Loan Eligibility Engine
        </span>
        <h1 className="font-headline font-extrabold text-5xl md:text-7xl tracking-tight text-primary leading-[1.05] mb-6">
          Know your loan<br />eligibility in<br />
          <span className="text-on-tertiary-container">2 minutes.</span>
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl max-w-xl leading-relaxed mb-12">
          Enter your income and existing obligations. Our engine applies FOIR calculations and live RBI repo rates to determine exactly how much you qualify for.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/step-1"
            className="bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold px-10 py-5 rounded-xl text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            Start Application
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
          <Link
            href="/dashboard"
            className="bg-surface-container-low text-on-surface font-headline font-bold px-10 py-5 rounded-xl text-lg border border-outline-variant/20 hover:bg-surface-container-high transition-all"
          >
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Feature row */}
      <section className="border-t border-outline-variant/10 bg-surface-container-lowest py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "account_balance",
              title: "Live RBI Rates",
              desc: "Interest rates derived from the RBI Repo Rate in real time — not hardcoded numbers.",
            },
            {
              icon: "bar_chart",
              title: "FOIR Engine",
              desc: "Uses Fixed Obligation to Income Ratio, the same standard used by Indian banks and NBFCs.",
            },
            {
              icon: "calendar_today",
              title: "Full EMI Schedule",
              desc: "Get a month-by-month amortization schedule with prepayment impact analysis.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col gap-4 p-8 bg-white rounded-xl border border-outline-variant/10 shadow-sm">
              <span className="material-symbols-outlined text-on-tertiary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              <h3 className="font-headline font-bold text-xl text-on-background">{title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Financial Tools */}
      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <h2 className="font-headline font-bold text-3xl text-primary text-center mb-3">Financial Tools</h2>
        <p className="text-on-surface-variant text-center text-sm mb-12">Standalone calculators you can use independently</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/tools/tax-benefit" className="group flex flex-col gap-4 p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-on-tertiary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-xl text-on-background mb-1">Tax Benefit Calculator</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Calculate your actual post-tax cost of a home loan. Section 24(b) interest + 80C principal deductions under old vs new tax regime.</p>
            </div>
            <div className="flex gap-2">
              <span className="bg-surface-container-low text-on-surface font-label text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide">Sec 24(b)</span>
              <span className="bg-surface-container-low text-on-surface font-label text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide">Sec 80C</span>
              <span className="bg-surface-container-low text-on-surface font-label text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide">Old vs New Regime</span>
            </div>
          </Link>

          <Link href="/tools/joint-loan" className="group flex flex-col gap-4 p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-on-tertiary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-xl text-on-background mb-1">Joint Loan Calculator</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Add a co-applicant to see combined FOIR capacity. Compares standalone vs joint eligibility with income-proportional ownership split.</p>
            </div>
            <div className="flex gap-2">
              <span className="bg-surface-container-low text-on-surface font-label text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide">Combined FOIR</span>
              <span className="bg-surface-container-low text-on-surface font-label text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide">Co-applicant</span>
              <span className="bg-surface-container-low text-on-surface font-label text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide">Ownership Split</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Steps row */}
      <section className="py-16 px-6 max-w-5xl mx-auto w-full border-t border-outline-variant/10">
        <h2 className="font-headline font-bold text-3xl text-primary text-center mb-12">How it works</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { step: "01", label: "Personal Info" },
            { step: "02", label: "Loan Details" },
            { step: "03", label: "Existing Debt" },
            { step: "04", label: "Review" },
            { step: "05", label: "Result" },
          ].map(({ step, label }) => (
            <div key={step} className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center font-headline font-extrabold text-on-tertiary-container">
                {step}
              </div>
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-outline-variant/10 py-8 px-8 flex justify-between items-center text-xs text-outline">
        <span className="font-headline font-bold">LoanCheck</span>
        <span>For demonstration purposes only. Not financial advice.</span>
      </footer>
    </div>
  );
}
