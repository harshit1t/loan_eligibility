"use client";

import { useLoan, formatINR, calculateEligibility } from "@/context/LoanContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Step4() {
  const router = useRouter();
  const { data } = useLoan();
  const [confirmed, setConfirmed] = useState(false);

  // Simplified calculation for monthly payment based on generic 10.5% rate
  const { requiredEmi } = calculateEligibility(data);

  const handleConfirm = () => {
    if (confirmed) {
      router.push("/step-5");
    } else {
      alert("Please certify that the information is accurate.");
    }
  };

  return (
    <div className="bg-background font-body text-on-background min-h-screen flex flex-col pt-16">
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-slate-100 shadow-sm h-16 flex justify-between items-center px-8 max-w-full mx-auto">
        <div className="text-xl font-extrabold tracking-tighter text-[#000613] font-headline">
          LoanCheck
        </div>
      </nav>

      <div className="fixed top-16 left-0 w-full h-1 bg-outline-variant/20 z-40">
        <div className="h-full bg-on-tertiary-container" style={{ width: '80%' }}></div>
      </div>

      <main className="pt-28 pb-20 px-6 max-w-6xl mx-auto w-full">
        <header className="mb-16 space-y-2">
          <div className="flex items-center space-x-3 mb-4">
            <span className="font-headline font-bold text-headline-sm text-primary">Step 4</span>
            <span className="h-px w-8 bg-outline-variant"></span>
            <span className="font-label text-label-md text-outline uppercase tracking-widest">Review Summary</span>
          </div>
          <h1 className="font-headline font-extrabold text-4xl lg:text-5xl tracking-tight text-on-background">
            Verify your submission.
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl leading-relaxed">
            Please ensure all information provided is accurate. Once submitted, these details will form the legal basis of your institutional loan agreement.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <section className="md:col-span-7 bg-surface-container-lowest p-10 rounded-xl shadow-[0px_10px_40px_rgba(13,28,46,0.04)] border border-outline-variant/10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="font-headline font-bold text-2xl text-primary">Identity Profile</h2>
              <button onClick={() => router.push("/step-1")} className="text-on-tertiary-container font-semibold text-sm hover:underline flex items-center space-x-2">
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>Edit</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-y-10 gap-x-12">
              <div className="space-y-1">
                <label className="font-label text-xs font-medium text-on-surface-variant uppercase tracking-widest">Full Legal Name</label>
                <p className="font-body text-lg font-semibold text-on-surface">{data.fullName || "Not provided"}</p>
              </div>
              <div className="space-y-1">
                <label className="font-label text-xs font-medium text-on-surface-variant uppercase tracking-widest">Age</label>
                <div className="flex items-center space-x-2 text-on-surface font-semibold">
                  <span className="font-body text-base">{data.age || "N/A"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-label text-xs font-medium text-on-surface-variant uppercase tracking-widest">Employment</label>
                <p className="font-body text-base text-on-surface leading-snug">{data.employmentStatus}</p>
              </div>
            </div>
          </section>

          <section className="md:col-span-5 bg-primary-container p-10 rounded-xl text-white space-y-8">
            <h2 className="font-headline font-bold text-2xl">Loan Configuration</h2>
            <div className="space-y-6">
              <div className="pb-6 border-b border-white/10 flex justify-between items-end">
                <div>
                  <label className="block font-label text-[10px] font-bold text-on-primary-container uppercase tracking-widest mb-2">Requested Amount</label>
                  <p className="font-headline font-extrabold text-4xl">{formatINR(data.requestedCapital)}</p>
                </div>
                <button onClick={() => router.push("/step-2")} className="text-on-primary-container hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-label text-[10px] font-bold text-on-primary-container uppercase tracking-widest mb-1">Term Length</label>
                  <p className="font-body text-lg font-medium">{data.repaymentTerm} Months</p>
                </div>
                <div>
                  <label className="block font-label text-[10px] font-bold text-on-primary-container uppercase tracking-widest mb-1">Interest Rate</label>
                  <p className="font-body text-lg font-medium">10.50% APR</p>
                </div>
              </div>
              <div className="pt-6 border-t border-white/10">
                <label className="block font-label text-[10px] font-bold text-on-primary-container uppercase tracking-widest mb-1">Estimated Monthly Payment</label>
                <p className="font-headline font-bold text-2xl text-on-tertiary-container">{formatINR(requiredEmi)}</p>
              </div>
            </div>
          </section>

          <section className="md:col-span-12 bg-surface-container-low p-10 rounded-xl border border-outline-variant/10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="font-headline font-bold text-2xl text-primary">Financial Statement</h2>
              <button onClick={() => router.push("/step-3")} className="text-on-tertiary-container font-semibold text-sm hover:underline flex items-center space-x-2">
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>Update Records</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-surface-container-lowest p-8 rounded-lg">
                <label className="font-label text-xs font-medium text-on-surface-variant uppercase tracking-widest block mb-4">Monthly Income</label>
                <span className="font-headline font-bold text-3xl text-primary">{formatINR(data.monthlyIncome)}</span>
                <p className="text-xs text-on-tertiary-container font-medium mt-2 flex items-center">
                  <span className="material-symbols-outlined text-xs mr-1">check_circle</span>
                  Self-Reporting
                </p>
              </div>
              <div className="bg-surface-container-lowest p-8 rounded-lg">
                <label className="font-label text-xs font-medium text-on-surface-variant uppercase tracking-widest block mb-4">Monthly EMI</label>
                <span className="font-headline font-bold text-3xl text-primary">{formatINR(data.monthlyEmi)}</span>
              </div>
              <div className="bg-surface-container-lowest p-8 rounded-lg">
                <label className="font-label text-xs font-medium text-on-surface-variant uppercase tracking-widest block mb-4">Credit Outstanding</label>
                <span className="font-headline font-bold text-3xl text-primary">{formatINR(data.creditCardOutstanding)}</span>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-20 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="flex items-center space-x-4">
            <input 
              checked={confirmed} 
              onChange={(e) => setConfirmed(e.target.checked)} 
              className="w-5 h-5 rounded border-outline-variant text-primary-container focus:ring-primary-container" 
              id="confirm" 
              type="checkbox" 
            />
            <label className="text-sm font-medium text-on-surface-variant cursor-pointer" htmlFor="confirm">
              I certify that all provided information is accurate and true to the best of my knowledge.
            </label>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={() => router.push('/step-3')} className="px-8 py-4 text-on-primary-fixed-variant font-semibold hover:text-primary transition-colors">
              Go Back
            </button>
            <button onClick={handleConfirm} className="px-12 py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all">
              Confirm &amp; Validate
            </button>
          </div>
        </footer>
      </main>
    </div>
  )
}
