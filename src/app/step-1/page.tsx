"use client";

import { useLoan } from "@/context/LoanContext";
import { useRouter } from "next/navigation";

export default function Step1() {
  const router = useRouter();
  const { data, updateData } = useLoan();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/step-2");
  };

  return (
    <div className="bg-[#f8f9ff] font-['Inter'] text-[#0d1c2e] min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 w-full h-1 z-[60] flex">
        <div className="h-full bg-[#3c83f7] transition-all duration-500" style={{ width: '20%' }}></div>
        <div className="h-full bg-[#c4c6cf]/20 flex-1"></div>
      </div>

      <nav className="fixed top-0 w-full z-50 bg-white border-b border-slate-100 shadow-sm h-16">
        <div className="flex justify-between items-center h-full px-8 max-w-full mx-auto">
          <div className="text-xl font-extrabold tracking-tighter text-[#000613] font-['Manrope']">
            LoanCheck
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <span className="text-slate-500 font-['Manrope'] tracking-tight font-bold">Dashboard</span>
            <span className="text-slate-500 font-['Manrope'] tracking-tight font-bold">My Loans</span>
            <span className="text-slate-500 font-['Manrope'] tracking-tight font-bold">Support</span>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-[#3c83f7] font-['Manrope'] font-bold text-2xl">01</span>
                  <span className="text-[#74777f] font-['Inter'] text-sm font-medium tracking-widest uppercase">/ 05 Steps</span>
                </div>
                <h1 className="font-['Manrope'] text-5xl font-extrabold tracking-tight text-[#000613] leading-[1.1]">
                  The Foundation of Your Facility.
                </h1>
                <p className="text-[#43474e] text-lg leading-relaxed max-w-md">
                  Institutional grade lending begins with precision. Provide your personal details to initialize your bespoke credit assessment.
                </p>
              </div>
              <div className="relative rounded-xl overflow-hidden aspect-video shadow-2xl shadow-[#000613]/10">
                <img alt="Institutional background" className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTWeMJIy7F2MfsGRExdDuoFiOecC5ZVcF5AkSEY2VDoiwK_N86P3B5SBmTA2_HG9ILFA9DQQ_M1TE9NcMf01EX3pnf6xCjLuyrl4S35_1uWQ0JmbEG5ZQKuwvuNuw4o7D3PC-4Bx-I2k8UB0Z7zcj8qLPfer8GZUV1GSwtmbAy-nDoOuet2EKHsXmdxdUA8FT_s25VqpqD4td4cMMP4p94KO72Y1kCOjYk3TftO19NEMuIKNr9uyhJj8Vzdh5AW1HZM0MGpgTcTg" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000613]/40 to-transparent"></div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white rounded-xl p-10 md:p-12 shadow-[0px_10px_40px_rgba(13,28,46,0.06)] border border-[#c4c6cf]/10">
                <form className="space-y-12" onSubmit={handleNext}>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="block font-['Inter'] text-xs font-semibold text-[#43474e] uppercase tracking-wider">Full Name</label>
                        <input required value={data.fullName} onChange={e => updateData({ fullName: e.target.value })} className="w-full bg-[#eff4ff] outline-none border-b-2 border-transparent focus:border-[#3c83f7] rounded-t-lg transition-all px-4 py-4 text-[#0d1c2e] placeholder:text-[#74777f]/50" placeholder="e.g. Ramesh Kumar" type="text" />
                      </div>
                      <div className="space-y-2">
                        <label className="block font-['Inter'] text-xs font-semibold text-[#43474e] uppercase tracking-wider">Age</label>
                        <input required min="18" max="100" value={data.age} onChange={e => updateData({ age: e.target.value })} className="w-full bg-[#eff4ff] outline-none border-b-2 border-transparent focus:border-[#3c83f7] rounded-t-lg transition-all px-4 py-4 text-[#0d1c2e] placeholder:text-[#74777f]/50" placeholder="21+" type="number" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block font-['Inter'] text-xs font-semibold text-[#43474e] uppercase tracking-wider">Employment Status</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {["Salaried", "Freelance", "Business"].map((status) => (
                        <button 
                          key={status}
                          onClick={() => updateData({ employmentStatus: status as any })}
                          className={`group relative flex flex-col items-start p-5 rounded-lg transition-all shadow-sm ${data.employmentStatus === status ? 'bg-[#001f3f] text-white ring-1 ring-[#001f3f]' : 'bg-[#eff4ff] text-[#0d1c2e] hover:bg-[#dce9ff]'}`} 
                          type="button"
                        >
                          <span className="material-symbols-outlined mb-3 opacity-80" style={data.employmentStatus === status ? { fontVariationSettings: "'FILL' 1" } : {}}>
                            {status === "Salaried" ? "work" : status === "Freelance" ? "palette" : "domain"}
                          </span>
                          <span className="font-['Manrope'] font-bold text-sm">{status}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-['Inter'] text-xs font-semibold text-[#43474e] uppercase tracking-wider">Estimated Monthly Income (INR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3c83f7] font-bold">₹</span>
                      <input required value={data.monthlyIncome} onChange={e => updateData({ monthlyIncome: e.target.value })} className="w-full bg-[#eff4ff] outline-none border-b-2 border-transparent focus:border-[#3c83f7] rounded-t-lg transition-all pl-10 pr-4 py-4 text-[#0d1c2e] text-xl font-['Manrope'] font-bold" placeholder="0.00" type="number" step="1000" />
                    </div>
                  </div>

                  <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs text-[#43474e]/60 max-w-[240px]">
                      By continuing, you agree to our initial data processing protocols for credit screening.
                    </p>
                    <button className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-[#000613] to-[#001f3f] text-white font-['Manrope'] font-bold rounded-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2" type="submit">
                      Next Step
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
