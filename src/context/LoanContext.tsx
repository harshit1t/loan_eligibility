"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type EmploymentStatus = "Salaried" | "Freelance" | "Business";
type LoanPurpose = "Home" | "Education" | "Business";

interface LoanData {
  fullName: string;
  age: string;
  employmentStatus: EmploymentStatus;
  monthlyIncome: string;
  requestedCapital: string;
  loanPurpose: LoanPurpose;
  repaymentTerm: string;
  monthlyEmi: string;
  creditCardOutstanding: string;
  activeLoanAccounts: string;
}

export interface CalcResult {
  isApproved: boolean;
  maxEligibleAmount: number;
  requestedCapital: number;
  requiredEmi: number;
  availableEmiCapacity: number;
  foir: number;
  foirLimit: number;
  annualInterestRate: number;
  rateSource: string;
  effectiveTenure: number;
  tenureCapped: boolean;
  tenureCappedReason: string | null;
  cibilScore: number;
  creditBand: string;
  totalRepayment: number;
  totalInterestPayable: number;
  approvalReason: string;
}

interface LoanContextType {
  data: LoanData;
  updateData: (updates: Partial<LoanData>) => void;
  calcResult: CalcResult | null;
  setCalcResult: (result: CalcResult) => void;
}

const defaultData: LoanData = {
  fullName: "",
  age: "",
  employmentStatus: "Salaried",
  monthlyIncome: "",
  requestedCapital: "",
  loanPurpose: "Home",
  repaymentTerm: "12",
  monthlyEmi: "",
  creditCardOutstanding: "",
  activeLoanAccounts: "0",
};

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export function LoanProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LoanData>(defaultData);
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);

  const updateData = (updates: Partial<LoanData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <LoanContext.Provider value={{ data, updateData, calcResult, setCalcResult }}>
      {children}
    </LoanContext.Provider>
  );
}

export function useLoan() {
  const context = useContext(LoanContext);
  if (context === undefined) {
    throw new Error("useLoan must be used within a LoanProvider");
  }
  return context;
}

export function formatINR(amount: number | string): string {
  if (!amount && amount !== 0) return "₹0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

// Legacy client-side calculation (used as fallback)
export function calculateEligibility(data: LoanData) {
  const income = parseFloat(data.monthlyIncome) || 0;
  const existingEmi = parseFloat(data.monthlyEmi) || 0;
  const termMonths = parseInt(data.repaymentTerm) || 12;
  const requested = parseFloat(data.requestedCapital) || 0;
  const maxEmiCapacity = income * 0.5;
  const availableEmiCapacity = Math.max(0, maxEmiCapacity - existingEmi);
  const annualInterestRate = 0.105;
  const monthlyRate = annualInterestRate / 12;
  const maxEligibleAmount =
    availableEmiCapacity *
    ((1 - Math.pow(1 + monthlyRate, -termMonths)) / monthlyRate);
  const isApproved = maxEligibleAmount >= requested && requested > 0;
  const requiredEmi =
    requested > 0
      ? (requested * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)
      : 0;
  return {
    isApproved,
    maxEligibleAmount,
    requiredEmi,
    availableEmiCapacity,
    score: isApproved
      ? Math.floor(75 + (income / 100000) * 5)
      : Math.floor(40 + (income / 100000) * 5),
  };
}
