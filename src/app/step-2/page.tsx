"use client";

import { useLoan } from "@/context/LoanContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Rates {
  repo_rate: number;
  home_loan_rate: number;
  personal_loan_rate: number;
  education_loan_rate: number;
  business_loan_rate: number;
  effective_date: string;
  source: string;
}

function getRateForPurpose(rates: Rates, purpose: string): number {
  const map: Record<string, keyof Rates> = {
    Home: "home_loan_rate",
    Education: "education_loan_rate",
    Business: "business_loan_rate",
  };
  return rates[map[purpose] ?? "home_loan_rate"] as number;
}

export default function Step2() {
  const router = useRouter();
  const { data, updateData } = useLoan();
  const [rates, setRates] = useState<Rates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rates/live")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setRates(json.data);
      })
      .catch(() => {})
      .finally(() => setRatesLoading(false));
  }, []);

  const currentRate = rates ? getRateForPurpose(rates, data.loanPurpose) : null;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/step-3");
  };

  return (
    <div className="bg-background font-body text-on-background min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-white border-b border-slate-100 shadow-sm transition-all duration-200">
        <div className="flex justify-between items-center h-16 px-8 max-w-full mx-auto">
          <div className="text-xl font-extrabold tracking-tighter text-[#000613] font-headline">
            The Sovereign Editorial
          </div>
        </div>
      </header>

      <div className="fixed top-16 left-0 w-full h-1 bg-outline-variant/20 z-50">
        <div className="h-full bg-on-tertiary-container transition-all duration-500" style={{ width: "40%" }}></div>
      </div>

      <main className="flex-grow pt-32 pb-32 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="mb-16">
          <div className="flex items-baseline space-x-3 mb-2">
            <span className="font-headline font-bold text-3xl text-primary">02</span>
            <span className="font-label text-sm text-outline tracking-widest uppercase">/ 05 Steps</span>
          </div>
          <h1 className="font-headline font-extrabold text-5xl md:text-6xl tracking-tight text-primary max-w-2xl leading-tight">
            Define your loan <br /> requirements.
          </h1>
        </div>

        <form onSubmit={handleNext} className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-16">
            <section>
              <label className="font-label font-medium text-xs text-on-surface-variant uppercase tracking-widest mb-6 block">
                Requested Capital (INR)
              </label>
              <div className="relative group">
                <span className="absolute left-0 bottom-4 font-headline text-4xl text-outline-variant group-focus-within:text-on-tertiary-container transition-colors">₹</span>
                <input
                  required
                  min="10000"
                  value={data.requestedCapital}
                  onChange={(e) => updateData({ requestedCapital: e.target.value })}
                  className="w-full outline-none bg-transparent border-none border-b-2 border-outline-variant/30 focus:ring-0 focus:border-on-tertiary-container font-headline text-6xl md:text-7xl font-bold tracking-tighter text-primary pl-10 pb-4 transition-all placeholder:text-surface-container-highest"
                  placeholder="0"
                  type="number"
                />
              </div>
              <p className="mt-4 font-body text-sm text-on-secondary-container">
                Enter the total amount required for your institutional or personal venture.
              </p>
            </section>

            <section>
              <label className="font-label font-medium text-xs text-on-surface-variant uppercase tracking-widest mb-6 block">
                Loan Purpose
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {["Home", "Education", "Business"].map((purpose) => (
                  <button
                    key={purpose}
                    onClick={() => updateData({ loanPurpose: purpose as any })}
                    className={`group flex flex-col p-8 transition-all text-left rounded-lg ghost-border relative ${
                      data.loanPurpose === purpose
                        ? "bg-surface-container-high ring-2 ring-primary"
                        : "bg-surface-container-low hover:bg-surface-container-high"
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-on-tertiary-container mb-4 text-3xl">
                      {purpose === "Home" ? "home" : purpose === "Education" ? "school" : "business_center"}
                    </span>
                    <span className="font-headline font-bold text-lg text-primary">{purpose}</span>
                    <span className="font-body text-xs text-on-secondary-container mt-1">
                      {purpose === "Home" ? "Real estate & Mortgages" : purpose === "Education" ? "Tuition & Development" : "Expansion & Liquidity"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <label className="font-label font-medium text-xs text-on-surface-variant uppercase tracking-widest mb-6 block">
                Repayment Term (Months)
              </label>
              <div className="flex flex-wrap gap-4">
                {["12", "24", "36", "48", "60"].map((term) => (
                  <button
                    key={term}
                    onClick={() => updateData({ repaymentTerm: term })}
                    className={`px-8 py-5 font-headline font-bold rounded-lg transition-all ghost-border ${
                      data.repaymentTerm === term
                        ? "bg-primary-container text-on-primary ring-2 ring-primary"
                        : "bg-surface-container-low text-primary hover:bg-surface-container-high"
                    }`}
                    type="button"
                  >
                    {term} Months
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 space-y-6">
              {/* Live Rate Card */}
              <div className="bg-surface-container-lowest p-8 rounded-xl ghost-border shadow-[0px_10px_40px_rgba(13,28,46,0.06)] relative overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                  <div className={`w-2 h-2 rounded-full ${ratesLoading ? "bg-outline animate-pulse" : "bg-on-tertiary-container animate-pulse"}`}></div>
                  <span className="font-label text-[10px] uppercase tracking-widest text-outline">
                    {ratesLoading ? "Fetching live rates…" : rates?.source ?? "Rate Data"}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-2xl text-primary mb-6">Live Rate Snapshot</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                    <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">RBI Repo Rate</span>
                    <span className="font-headline font-bold text-on-tertiary-container">
                      {ratesLoading ? "—" : `${rates?.repo_rate ?? "—"}%`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                    <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                      {data.loanPurpose} Loan Rate
                    </span>
                    <span className="font-headline font-bold text-primary text-xl">
                      {ratesLoading ? "—" : `${currentRate ?? "—"}% p.a.`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
                    <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Processing Fee</span>
                    <span className="font-headline font-bold text-primary">₹0</span>
                  </div>
                  {rates && (
                    <p className="text-[10px] text-outline italic pt-1">
                      Rates effective from {rates.effective_date}. Subject to underwriting.
                    </p>
                  )}
                </div>
              </div>

              {/* Trust signals */}
              <div className="flex items-center space-x-4 px-2">
                <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                <p className="font-label text-[10px] uppercase tracking-tighter text-outline leading-tight">
                  Rates derived from RBI Repo Rate.<br />Institutional Grade Data.
                </p>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Action Bar */}
          <div className="fixed bottom-0 left-0 w-full bg-surface/80 backdrop-blur-xl border-t border-outline-variant/10 py-6 px-8 z-40">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <button onClick={() => router.push("/step-1")} className="font-label text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center space-x-2" type="button">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                <span>PREVIOUS STEP</span>
              </button>
              <button className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-12 py-4 rounded-lg font-headline font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-lg flex items-center space-x-3" type="submit">
                <span>CONTINUE TO STEP 3</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
