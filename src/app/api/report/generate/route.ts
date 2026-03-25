export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ReportSchema = z.object({
  fullName: z.string().min(1),
  loanPurpose: z.string(),
  requestedCapital: z.number().min(1),
  annualRate: z.number(),
  effectiveTenure: z.number().int().min(1),
  requiredEmi: z.number(),
  maxEligibleAmount: z.number(),
  isApproved: z.boolean(),
  cibilScore: z.number(),
  creditBand: z.string(),
  foir: z.number(),
  foirLimit: z.number(),
  totalInterestPayable: z.number(),
  approvalReason: z.string(),
});

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const coerced = {
      ...body,
      requestedCapital: Number(body.requestedCapital),
      annualRate: Number(body.annualRate),
      effectiveTenure: Number(body.effectiveTenure),
      requiredEmi: Number(body.requiredEmi),
      maxEligibleAmount: Number(body.maxEligibleAmount),
      cibilScore: Number(body.cibilScore),
      foir: Number(body.foir),
      foirLimit: Number(body.foirLimit),
      totalInterestPayable: Number(body.totalInterestPayable),
    };

    const parsed = ReportSchema.safeParse(coerced);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const generatedAt = new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });

    // Dynamic require needed for ESM/CJS interop in Next.js
    const PDFDocument = (await import("pdfkit")).default;

    return new Promise<NextResponse>((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("error", reject);
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(
          new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="LoanCheck-Report-${d.fullName.replace(/\s+/g, "-")}.pdf"`,
              "Content-Length": String(pdfBuffer.length),
            },
          })
        );
      });

      // Header
      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("LoanCheck — Loan Eligibility Report", { align: "center" });

      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#888")
        .text(`Generated: ${generatedAt}`, { align: "center" });

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e0e0e0").stroke();
      doc.moveDown(1);

      // Status banner
      const statusColor = d.isApproved ? "#2e7d32" : "#ba1a1a";
      const statusLabel = d.isApproved ? "✓  APPROVED" : "✗  REQUIRES ADJUSTMENT";
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor(statusColor)
        .text(statusLabel, { align: "center" });

      doc.moveDown(0.5);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#555")
        .text(d.approvalReason, { align: "center", width: 445 });

      doc.moveDown(1.5);
      doc.fillColor("#000");

      // Section helper
      const section = (title: string) => {
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica-Bold").fillColor("#1a237e").text(title);
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#c5cae9").stroke();
        doc.moveDown(0.5);
        doc.fillColor("#000").font("Helvetica").fontSize(9);
      };

      const row = (label: string, value: string) => {
        doc.text(`${label}:`, { continued: true, indent: 10 });
        doc.font("Helvetica-Bold").text(`  ${value}`, { align: "right" });
        doc.font("Helvetica");
        doc.moveDown(0.3);
      };

      // Applicant
      section("Applicant Details");
      row("Name", d.fullName);
      row("Loan Purpose", d.loanPurpose);
      row("Report Date", generatedAt);

      // Loan Terms
      section("Loan Terms");
      row("Requested Amount", formatINR(d.requestedCapital));
      row("Maximum Eligible Amount", formatINR(d.maxEligibleAmount));
      row("Interest Rate (APR)", `${d.annualRate}%`);
      row("Tenure", `${d.effectiveTenure} months`);
      row("Monthly EMI", `${formatINR(d.requiredEmi)} / month`);
      row("Total Interest Payable", formatINR(d.totalInterestPayable));
      row("Total Repayment", formatINR(d.requestedCapital + d.totalInterestPayable));

      // Credit Assessment
      section("Credit Assessment");
      row("Simulated CIBIL Score", `${d.cibilScore} / 900`);
      row("Credit Band", d.creditBand);
      row("FOIR", `${d.foir}% (Limit: ${d.foirLimit}%)`);

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e0e0e0").stroke();
      doc.moveDown(0.5);
      doc
        .fontSize(7)
        .font("Helvetica")
        .fillColor("#aaa")
        .text(
          "This report is for demonstration purposes only and does not constitute a formal loan offer or financial advice. CIBIL scores shown are simulated estimates. Rates are subject to change per RBI guidelines.",
          { align: "center" }
        );

      doc.end();
    });
  } catch (err) {
    console.error("[/api/report/generate]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
