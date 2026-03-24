"use client";

import { useLoan } from "@/context/LoanContext";
import { useRouter } from "next/navigation";

export default function Step3() {
  const router = useRouter();
  const { data, updateData } = useLoan();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/step-4");
  };

  return (
    <div className="bg-background font-body text-on-background min-h-screen flex flex-col pt-16">
      <header className="fixed top-0 w-full z-50 bg-white dark:bg-[#000613] border-b border-slate-100 dark:border-slate-800/50 shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center h-16 px-8 max-w-full mx-auto">
          <div className="text-xl font-extrabold tracking-tighter text-[#000613] dark:text-white font-headline">
            The Sovereign Editorial
          </div>
        </div>
      </header>

      <main className="flex-grow pt-8 pb-20 px-6 max-w-5xl mx-auto w-full">
        <div className="mb-16">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="block font-label text-on-surface-variant text-sm font-medium uppercase tracking-widest mb-1">Application Wizard</span>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-background">Step 3</h2>
            </div>
            <div className="text-right">
              <span className="font-label text-outline text-xs font-medium uppercase tracking-widest">Progress</span>
              <div className="font-headline text-xl font-bold text-on-tertiary-container">03 <span className="text-outline-variant">/ 05</span></div>
            </div>
          </div>
          <div className="relative h-[2px] w-full bg-outline-variant/20 overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-on-tertiary-container transition-all duration-700 ease-out" style={{ width: '60%' }}></div>
          </div>
        </div>

        <form onSubmit={handleNext} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <section className="lg:col-span-7 space-y-12">
            <div>
              <h1 className="font-headline text-4xl font-extrabold tracking-tighter text-on-background mb-4 leading-tight">
                Existing Debt <br /> &amp; Obligations
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed max-w-prose">
                To provide an accurate lending profile, we require a comprehensive overview of your current financial commitments. This ensures institutional grade compliance.
              </p>
            </div>
            
            <div className="space-y-10">
              <div className="group">
                <label className="block font-label text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-4 group-focus-within:text-on-tertiary-container transition-colors">
                  Monthly EMI Payments (INR)
                </label>
                <div className="relative bg-surface-container-high rounded-t-DEFAULT border-b-2 border-transparent transition-all group-focus-within:bg-surface-container-highest group-focus-within:border-on-tertiary-container">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant font-headline font-bold">₹</span>
                  <input required value={data.monthlyEmi} onChange={(e) => updateData({ monthlyEmi: e.target.value })} className="w-full bg-transparent outline-none border-none py-5 pl-12 pr-6 font-headline text-2xl font-bold text-on-background focus:ring-0 placeholder:text-outline-variant/50" placeholder="0" type="number" />
                </div>
                <p className="mt-3 text-xs text-outline font-medium italic">Include auto, home, and personal loan installments.</p>
              </div>
              
              <div className="group">
                <label className="block font-label text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-4 group-focus-within:text-on-tertiary-container transition-colors">
                  Total Credit Card Outstanding (INR)
                </label>
                <div className="relative bg-surface-container-high rounded-t-DEFAULT border-b-2 border-transparent transition-all group-focus-within:bg-surface-container-highest group-focus-within:border-on-tertiary-container">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant font-headline font-bold">₹</span>
                  <input required value={data.creditCardOutstanding} onChange={(e) => updateData({ creditCardOutstanding: e.target.value })} className="w-full bg-transparent outline-none border-none py-5 pl-12 pr-6 font-headline text-2xl font-bold text-on-background focus:ring-0 placeholder:text-outline-variant/50" placeholder="0" type="number" />
                </div>
                <p className="mt-3 text-xs text-outline font-medium italic">Combined balance across all active credit facilities.</p>
              </div>
              
              <div>
                <label className="block font-label text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-6">
                  Number of Active Loan Accounts
                </label>
                <div className="flex flex-wrap gap-4">
                  {["0", "1", "2", "3+"].map((num) => (
                    <button 
                      key={num}
                      onClick={() => updateData({ activeLoanAccounts: num })}
                      className={`flex-1 min-w-[80px] py-4 font-headline font-bold text-xl rounded-lg transition-all ${data.activeLoanAccounts === num ? 'bg-primary-container text-on-primary ring-2 ring-on-tertiary-container shadow-sm' : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'}`} 
                      type="button"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="pt-8 flex items-center justify-between">
              <button type="button" onClick={() => router.push('/step-2')} className="px-8 py-4 font-headline font-bold text-on-tertiary-container hover:underline transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back
              </button>
              <button type="submit" className="px-12 py-5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-lg rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all">
                Proceed to Review
              </button>
            </div>
          </section>

          <aside className="lg:col-span-5 space-y-8">
            <div className="bg-surface-container-low p-8 rounded-xl space-y-8">
              <div className="aspect-square w-full rounded-lg overflow-hidden relative">
                <img className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaEwtbhINv70L2HH0vvuurTCBWX2Awu4ZdiYkafWtSj5_VFYSzsj-MkP6C2pj89xt8xbnuvJNZVIgNcUH-Qlmpbe9csDb3oxrsSZiJoCEvR8eHYbt4Rjxwl0GYYRVjL6yYhdWXKOCAECZYbnCqtG5Jubro2MWc2UdcNxqFgYiGWqHJzO2BQACJjaL6GqYnjFL8P2YuBqyoNos0nUMv_IOhJa9SO_PAq-lVQC9nx-TsZ8lAL6GUdIQBCMBrubF3vWjUO4arhcSUmA" alt="financial data" />
                <div className="absolute inset-0 bg-primary-container/20 mix-blend-multiply"></div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-on-tertiary-container rounded-lg">
                    <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-on-background">Encrypted Disclosure</h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">Your data is secured using 256-bit AES encryption. Information is solely used for debt-to-income ratio verification.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-surface-container-highest rounded-lg">
                    <span className="material-symbols-outlined text-on-tertiary-container text-xl">insights</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-on-background">DTI Calculation</h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">Most institutional lenders prefer a total debt-to-income ratio below 40% for optimal rates.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </main>
    </div>
  )
}
