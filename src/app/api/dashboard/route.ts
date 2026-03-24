import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DashboardSchema = z.object({
  principal: z.number().min(1),
  annualRate: z.number().min(0.1).max(30),
  tenureMonths: z.number().int().min(1).max(360),
  disbursementDate: z.string().optional(),
  borrowerName: z.string().optional(),
  loanPurpose: z.string().optional(),
});

export type EmiStatus = "PAID" | "UPCOMING" | "PENDING" | "OVERDUE";

export interface EmiEntry {
  month: number;
  dueDate: string;
  emi: number;
  principal: number;
  interest: number;
  outstandingBalance: number;
  status: EmiStatus;
  paidDate?: string;
}

function buildAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  disbursementDate: Date
): EmiEntry[] {
  const r = annualRate / 100 / 12;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  const schedule: EmiEntry[] = [];
  let balance = principal;

  for (let month = 1; month <= tenureMonths; month++) {
    const dueDate = new Date(disbursementDate);
    dueDate.setMonth(disbursementDate.getMonth() + month);

    const interestComponent = balance * r;
    const principalComponent = emi - interestComponent;
    balance = Math.max(0, balance - principalComponent);

    // First 2 months are paid, 3rd is upcoming, rest are pending
    let status: EmiStatus = "PENDING";
    if (month === 1 || month === 2) status = "PAID";
    if (month === 3) status = "UPCOMING";

    schedule.push({
      month,
      dueDate: dueDate.toISOString().split("T")[0],
      emi: Math.round(emi),
      principal: Math.round(principalComponent),
      interest: Math.round(interestComponent),
      outstandingBalance: Math.round(balance),
      status,
      ...(status === "PAID" ? { paidDate: new Date(dueDate.getTime() - 86400000 * 2).toISOString().split("T")[0] } : {}),
    });
  }

  return schedule;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const coerced = {
      ...body,
      principal: Number(body.principal),
      annualRate: Number(body.annualRate),
      tenureMonths: Number(body.tenureMonths),
    };

    const parsed = DashboardSchema.safeParse(coerced);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { principal, annualRate, tenureMonths, disbursementDate, borrowerName, loanPurpose } = parsed.data;

    // Simulate disbursement 2 months ago so 2 EMIs show as paid
    const disbDate = disbursementDate
      ? new Date(disbursementDate)
      : new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000);

    const schedule = buildAmortizationSchedule(principal, annualRate, tenureMonths, disbDate);

    const paid = schedule.filter((e) => e.status === "PAID");
    const paidInstallments = paid.length;
    const totalPrincipalPaid = paid.reduce((sum, e) => sum + e.principal, 0);
    const totalInterestPaid = paid.reduce((sum, e) => sum + e.interest, 0);
    const outstanding = schedule[paidInstallments]?.outstandingBalance ?? 0;
    const nextEmi = schedule.find((e) => e.status === "UPCOMING") ?? null;

    // Prepayment impact: effect of paying ₹10,000 extra today
    const r = annualRate / 100 / 12;
    const emi = schedule[0]?.emi ?? 0;
    const newBalance = Math.max(0, outstanding - 10000);
    const newTenure = newBalance > 0 ? Math.ceil(Math.log(emi / (emi - newBalance * r)) / Math.log(1 + r)) : 0;
    const monthsSaved = Math.max(0, (tenureMonths - paidInstallments) - newTenure);
    const interestSaved = Math.round(Math.max(0, monthsSaved * (outstanding * r)));

    // Deterministic loan account number from principal
    const loanAccountNumber = `TSE${String(Math.abs(Math.floor(Math.sin(principal) * 1e8))).slice(0, 8)}`;

    return NextResponse.json({
      success: true,
      data: {
        loanAccountNumber,
        borrowerName: borrowerName ?? "Applicant",
        loanPurpose: loanPurpose ?? "Personal",
        principal,
        annualRate,
        tenureMonths,
        disbursementDate: disbDate.toISOString().split("T")[0],
        schedule,
        summary: {
          paidInstallments,
          remainingInstallments: tenureMonths - paidInstallments,
          totalPrincipalPaid,
          totalInterestPaid,
          outstandingPrincipal: outstanding,
          completionPercent: Math.round((paidInstallments / tenureMonths) * 100),
          nextEmi,
        },
        prepaymentImpact: {
          extraPayment: 10000,
          monthsSaved,
          interestSaved,
        },
      },
    });
  } catch (err) {
    console.error("[/api/dashboard]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
