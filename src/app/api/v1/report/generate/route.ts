import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ReportSchema = z.object({
  fullName: z.string().min(1),
  loanPurpose: z.string(),
  requestedCapital: z.number(),
  annualRate: z.number(),
  effectiveTenure: z.number(),
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
    const parsed = ReportSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });

    const d = parsed.data;
    const generatedAt = new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });

    const PDFDocument = (await import("pdfkit")).default;

    return new Promise<NextResponse>((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="LoanCheck-v1-Report-${d.fullName.replace(/\s+/g, "-")}.pdf"`,
          },
        }));
      });
      doc.on("error", reject);

      doc.fontSize(22).font("Helvetica-Bold").text("LoanCheck v1 — Official Eligibility Report", { align: "center" });
      doc.moveDown(0.5).fontSize(9).font("Helvetica").fillColor("#888").text(`Generated: ${generatedAt}`, { align: "center" });
      doc.moveDown(1).moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e0e0e0").stroke().moveDown(1);

      doc.fontSize(14).font("Helvetica-Bold").fillColor(d.isApproved ? "#2e7d32" : "#ba1a1a").text(d.isApproved ? "✓ APPROVED" : "✗ REJECTED", { align: "center" });
      doc.moveDown(0.5).fontSize(10).font("Helvetica").fillColor("#444").text(d.approvalReason, { align: "center" });
      
      doc.moveDown(2).fontSize(12).font("Helvetica-Bold").fillColor("#000").text("Summary Details:");
      doc.fontSize(10).font("Helvetica").text(`Applicant: ${d.fullName}`);
      doc.text(`Requested: ${formatINR(d.requestedCapital)}`);
      doc.text(`EMI: ${formatINR(d.requiredEmi)} / month`);
      doc.text(`CIBIL: ${d.cibilScore} (${d.creditBand})`);

      doc.end();
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Report generation failed" }, { status: 500 });
  }
}
