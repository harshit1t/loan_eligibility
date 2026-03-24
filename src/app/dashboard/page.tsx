"use client";

import { useLoan, formatINR } from "@/context/LoanContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type EmiStatus = "PAID" | "UPCOMING" | "PENDING" | "OVERDUE";

interface EmiEntry {
  month: number;
  dueDate: string;
  emi: number;
  principal: number;
  interest: number;
  outstandingBalance: number;
  status: EmiStatus;
  paidDate?: string;
}

interface DashboardData {
  loanAccountNumber: string;
  borrowerName: string;
  loanPurpose: string;
  principal: number;
  annualRate: number;
  tenureMonths: number;
  disbursementDate: string;
  schedule: EmiEntry[];
  summary: {
    paidInstallments: number;
    remainingInstallments: number;
    totalPrincipalPaid: number;
    totalInterestPaid: number;
    outstandingPrincipal: number;
    completionPercent: number;
    nextEmi: EmiEntry | null;
  };
  prepaymentImpact: {
    extraPayment: number;
    monthsSaved: number;
    interestSaved: number;
  };
}

const STATUS_CONFIG: Record<EmiStatus, { label: string; color: string; bg: string; icon: string }> = {
  PAID: { label: "Paid", color: "text-[#2e7d32]", bg: "bg-[#e8f5e9]", icon: "check_circle" },
  UPCOMING: { label: "Due Soon", color: "text-[#3c83f7]", bg: "bg-[#e3f2fd]", icon: "schedule" },
  OVERDUE: { label: "Overdue", color: "text-[#ba1a1a]", bg: "bg-[#ffdad6]", icon: "warning" },
  PENDING: { label: "Pending", color: "text-[#74777f]", bg: "bg-[#eff4ff]", icon: "radio_button_unchecked" },
};

function StatusChip({ status }: { status: EmiStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color}`}>
      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: status === "PAID" ? "'FILL' 1" : "'FILL' 0" }}>{config.icon}</span>
      {config.label}
    </span>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { data, calcResult } = useLoan();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "paid">("all");
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  useEffect(() => {
    const principal = calcResult?.requestedCapital ?? Number(data.requestedCapital);
    const annualRate = calcResult?.annualInterestRate ?? 10.5;
    const tenureMonths = calcResult?.effectiveTenure ?? Number(data.repaymentTerm);

    if (!principal || !tenureMonths) {
      router.push("/step-1");
      return;
    }

    fetch("/api/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        principal,
        annualRate,
        tenureMonths,
        borrowerName: data.fullName || "Applicant",
        loanPurpose: data.loanPurpose,
      }),
    })
      .then((r) => r.json())
      .then((json) => { if (json.success) setDashData(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredSchedule = dashData?.schedule.filter((e) => {
    if (activeTab === "upcoming") return e.status === "UPCOMING" || e.status === "OVERDUE";
    if (activeTab === "paid") return e.status === "PAID";
    return true;
  }) ?? [];

  const displayedSchedule = showFullSchedule ? filteredSchedule : filteredSchedule.slice(0, 6);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="w-14 h-14 rounded-full border-4 border-on-tertiary-container border-t-transparent animate-spin"></div>
        <p className="font-headline font-bold text-xl text-primary">Loading your dashboard…</p>
      </div>
    );
  }

  if (!dashData) return null;

  const { summary, prepaymentImpact } = dashData;
  const progressDeg = (summary.completionPercent / 100) * 360;

  return (
    <div className="min-h-screen bg-background text-on-background font-body">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center h-16 px-8 max-w-7xl mx-auto">
          <div className="text-xl font-extrabold tracking-tighter text-[#000613] font-headline">
            The Sovereign Editorial
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <p className="font-headline font-bold text-sm text-on-background">{dashData.borrowerName}</p>
              <p className="font-label text-[10px] uppercase tracking-widest text-outline">{dashData.loanAccountNumber}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-on-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 md:px-8 py-10 space-y-10">

        {/* Hero greeting */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="font-label text-xs uppercase tracking-widest text-on-tertiary-container mb-1">Customer Dashboard</p>
            <h1 className="font-headline font-extrabold text-4xl text-primary leading-tight">
              Welcome back, {data.fullName?.split(" ")[0] || "Applicant"}.
            </h1>
            <p className="text-on-surface-variant mt-1">
              {dashData.loanPurpose} loan · {dashData.tenureMonths}-month tenure · ₹{dashData.annualRate}% p.a.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-surface-container-low rounded-lg font-label text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-high transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">download</span>
              Statement
            </button>
            <button className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-label text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-sm">payments</span>
              Pay EMI
            </button>
          </div>
        </div>

        {/* KPI bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Loan Amount", value: formatINR(dashData.principal), icon: "account_balance", accent: false },
            { label: "Outstanding", value: formatINR(summary.outstandingPrincipal), icon: "trending_down", accent: true },
            { label: "EMIs Paid", value: `${summary.paidInstallments} / ${dashData.tenureMonths}`, icon: "check_circle", accent: false },
            { label: "Next EMI", value: summary.nextEmi ? formatINR(summary.nextEmi.emi) : "—", icon: "calendar_today", accent: false },
          ].map(({ label, value, icon, accent }) => (
            <div key={label} className={`p-6 rounded-xl ${accent ? "bg-primary-container text-white" : "bg-surface-container-lowest border border-outline-variant/10 shadow-sm"}`}>
              <div className="flex justify-between items-start mb-3">
                <p className={`font-label text-[10px] uppercase tracking-widest ${accent ? "text-on-primary-container" : "text-on-surface-variant"}`}>{label}</p>
                <span className={`material-symbols-outlined text-lg ${accent ? "text-on-tertiary-container" : "text-on-tertiary-container opacity-50"}`}>{icon}</span>
              </div>
              <p className={`font-headline font-extrabold text-2xl ${accent ? "text-white" : "text-primary"}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Middle: Progress + Next EMI + Prepayment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Loan health ring */}
          <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm flex flex-col items-center gap-4">
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Loan Completion</p>
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="66" fill="none" stroke="#e6eeff" strokeWidth="14" />
                <circle
                  cx="80" cy="80" r="66" fill="none"
                  stroke="#3c83f7" strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 66}`}
                  strokeDashoffset={`${2 * Math.PI * 66 * (1 - summary.completionPercent / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-headline font-extrabold text-4xl text-primary">{summary.completionPercent}%</span>
                <span className="font-label text-[10px] text-outline uppercase tracking-widest">Done</span>
              </div>
            </div>
            <div className="w-full space-y-2 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Principal Paid</span>
                <span className="font-bold text-primary">{formatINR(summary.totalPrincipalPaid)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Interest Paid</span>
                <span className="font-bold text-primary">{formatINR(summary.totalInterestPaid)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-on-surface-variant">Remaining</span>
                <span className="font-bold text-on-tertiary-container">{summary.remainingInstallments} EMIs</span>
              </div>
            </div>
          </div>

          {/* Next EMI card */}
          {summary.nextEmi && (
            <div className="bg-gradient-to-br from-primary to-primary-container text-white rounded-xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-on-primary-container">Next Due</p>
                </div>
                <p className="font-headline font-extrabold text-4xl mb-1">{formatINR(summary.nextEmi.emi)}</p>
                <p className="text-on-primary-container text-sm">
                  Due: {new Date(summary.nextEmi.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="mt-8 space-y-2 text-sm bg-white/10 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-on-primary-container">Principal</span>
                  <span className="font-bold">{formatINR(summary.nextEmi.principal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-primary-container">Interest</span>
                  <span className="font-bold">{formatINR(summary.nextEmi.interest)}</span>
                </div>
                <div className="border-t border-white/20 pt-2 flex justify-between">
                  <span className="text-on-primary-container">Balance After</span>
                  <span className="font-bold text-on-tertiary-container">{formatINR(summary.nextEmi.outstandingBalance)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Prepayment impact */}
          <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-tertiary-container">bolt</span>
              <p className="font-headline font-bold text-on-background">Prepayment Impact</p>
            </div>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              If you pay an extra <span className="font-bold text-on-tertiary-container">{formatINR(prepaymentImpact.extraPayment)}</span> today:
            </p>
            <div className="space-y-3 mt-2">
              <div className="bg-surface-container-low rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">Months Saved</p>
                  <p className="font-headline font-bold text-2xl text-on-tertiary-container">{prepaymentImpact.monthsSaved}</p>
                </div>
                <span className="material-symbols-outlined text-on-tertiary-container opacity-40 text-3xl">schedule</span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-label text-[10px] uppercase tracking-widest text-outline mb-1">Interest Saved</p>
                  <p className="font-headline font-bold text-xl text-[#2e7d32]">{formatINR(prepaymentImpact.interestSaved)}</p>
                </div>
                <span className="material-symbols-outlined text-[#2e7d32] opacity-40 text-3xl">savings</span>
              </div>
            </div>
            <button className="mt-auto w-full py-3 border border-outline-variant/30 rounded-lg font-label text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-all">
              Calculate Custom Prepayment
            </button>
          </div>
        </div>

        {/* EMI Schedule */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-8 py-6 border-b border-outline-variant/10">
            <div>
              <h2 className="font-headline font-bold text-xl text-primary">EMI Schedule</h2>
              <p className="font-body text-sm text-on-surface-variant mt-0.5">Full amortization schedule · {dashData.tenureMonths} installments</p>
            </div>
            <div className="flex gap-2">
              {(["all", "upcoming", "paid"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-label text-xs font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab ? "bg-primary text-white" : "bg-surface-container-low text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low">
                  {["#", "Due Date", "EMI", "Principal", "Interest", "Balance", "Status", "Paid On"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedSchedule.map((entry, i) => (
                  <tr
                    key={entry.month}
                    className={`border-t border-outline-variant/10 transition-colors ${
                      entry.status === "UPCOMING" ? "bg-[#e3f2fd]/40" :
                      entry.status === "OVERDUE" ? "bg-[#ffdad6]/30" :
                      i % 2 === 0 ? "" : "bg-surface-container-low/30"
                    }`}
                  >
                    <td className="px-6 py-4 font-headline font-bold text-on-surface-variant">{entry.month}</td>
                    <td className="px-6 py-4 text-on-surface whitespace-nowrap">
                      {new Date(entry.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 font-headline font-bold text-on-surface">{formatINR(entry.emi)}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{formatINR(entry.principal)}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{formatINR(entry.interest)}</td>
                    <td className="px-6 py-4 font-medium text-primary">{formatINR(entry.outstandingBalance)}</td>
                    <td className="px-6 py-4"><StatusChip status={entry.status} /></td>
                    <td className="px-6 py-4 text-on-surface-variant text-xs">
                      {entry.paidDate
                        ? new Date(entry.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSchedule.length > 6 && (
            <div className="px-8 py-5 border-t border-outline-variant/10 flex justify-center">
              <button
                onClick={() => setShowFullSchedule(!showFullSchedule)}
                className="font-label text-xs font-bold uppercase tracking-widest text-on-tertiary-container hover:underline flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">{showFullSchedule ? "expand_less" : "expand_more"}</span>
                {showFullSchedule ? `Collapse` : `View all ${filteredSchedule.length} installments`}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center py-8 border-t border-outline-variant/10 gap-4">
          <p className="font-label text-[10px] uppercase tracking-widest text-outline">
            Loan Account: {dashData.loanAccountNumber} · Disbursed: {new Date(dashData.disbursementDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <button onClick={() => router.push("/step-1")} className="font-label text-[10px] uppercase tracking-widest text-outline hover:text-on-tertiary-container transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Apply for New Loan
          </button>
        </div>
      </main>
    </div>
  );
}
