import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ShareSchema = z.object({
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
});

// Mocked token generator for v1 migration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ShareSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });

    const token = Buffer.from(JSON.stringify({ ...parsed.data, exp: Date.now() + 604800000 })).toString("base64url");
    return NextResponse.json({ success: true, data: { shareUrl: `${req.nextUrl.origin}/results/${token}` } });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Share generation failed" }, { status: 500 });
  }
}
