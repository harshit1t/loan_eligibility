import { NextRequest } from "next/server";
import { z } from "zod";
import { createResponse, createErrorResponse } from "@/lib/api-response";

const DashboardSchema = z.object({
  principal: z.number().min(10000),
  annualRate: z.number().min(1).max(30),
  tenureMonths: z.number().int().min(12).max(360),
  borrowerName: z.string().optional().default("Applicant"),
  loanPurpose: z.string().optional().default("Home"),
});

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  try {
    const body = await req.json();
    const parsed = DashboardSchema.safeParse(body);
    if (!parsed.success) return createErrorResponse("Validation failed", 400, requestId, parsed.error.flatten().fieldErrors);

    const { principal, annualRate, tenureMonths, borrowerName, loanPurpose } = parsed.data;
    const r = annualRate / 100 / 12;
    const emi = Math.round((principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1));

    let balance = principal;
    let totalInterestPaid = 0;
    const schedule = [];
    const today = new Date();
    
    for (let m = 1; m <= tenureMonths; m++) {
      const interest = balance * r;
      const pComp = Math.min(emi - interest, balance);
      balance -= pComp;
      totalInterestPaid += interest;
      
      const dueDate = new Date(today);
      dueDate.setMonth(today.getMonth() + m);

      schedule.push({
        month: m,
        dueDate: dueDate.toISOString(),
        emi,
        principal: Math.round(pComp),
        interest: Math.round(interest),
        outstandingBalance: Math.round(balance),
        status: m === 1 ? "UPCOMING" : "PENDING",
      });
    }

    const data = {
      loanAccountNumber: `LN-${Math.random().toString(36).toUpperCase().substring(2, 10)}`,
      borrowerName,
      loanPurpose,
      principal,
      annualRate,
      tenureMonths,
      disbursementDate: today.toISOString(),
      schedule,
      summary: {
        paidInstallments: 0,
        remainingInstallments: tenureMonths,
        totalPrincipalPaid: 0,
        totalInterestPaid: 0,
        outstandingPrincipal: principal,
        completionPercent: 0,
        nextEmi: schedule[0],
      },
      prepaymentImpact: {
        extraPayment: Math.round(principal * 0.1),
        monthsSaved: Math.round(tenureMonths * 0.15),
        interestSaved: Math.round(principal * r * 12),
      }
    };

    return createResponse(data, 200, requestId);
  } catch (err) {
    console.error("[/api/v1/dashboard]", err);
    return createErrorResponse("Dashboard data generation failed", 500, requestId);
  }
}
