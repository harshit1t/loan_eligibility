import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

// In a real app this comes from process.env.SHARE_HMAC_SECRET
const HMAC_SECRET = "loancheck-share-secret-2025";
const TOKEN_TTL_DAYS = 7;

const ShareSchema = z.object({
  fullName: z.string().min(1).max(100),
  loanPurpose: z.string(),
  requestedCapital: z.number().min(1),
  annualRate: z.number(),
  effectiveTenure: z.number().int().min(1),
  requiredEmi: z.number().min(0),
  maxEligibleAmount: z.number().min(0),
  isApproved: z.boolean(),
  cibilScore: z.number(),
  creditBand: z.string(),
  foir: z.number(),
  foirLimit: z.number(),
  totalInterestPayable: z.number(),
});

type SharePayload = z.infer<typeof ShareSchema> & { iat: number; exp: number };

function signToken(data: object): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = crypto.createHmac("sha256", HMAC_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): SharePayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac("sha256", HMAC_SECRET).update(payload).digest("base64url");

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(sig, "base64url"), Buffer.from(expected, "base64url"))) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SharePayload;
    if (Date.now() > data.exp) return null; // expired
    return data;
  } catch {
    return null;
  }
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

    const parsed = ShareSchema.safeParse(coerced);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const now = Date.now();
    const payload: SharePayload = {
      ...parsed.data,
      iat: now,
      exp: now + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    };

    const token = signToken(payload);
    const shareUrl = `${req.nextUrl.origin}/results/${token}`;

    return NextResponse.json({
      success: true,
      data: {
        token,
        shareUrl,
        expiresAt: new Date(payload.exp).toISOString(),
        expiresInDays: TOKEN_TTL_DAYS,
      },
    });
  } catch (err) {
    console.error("[/api/share/generate]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// Also export the verifier for use in the results page server component
export { verifyToken };
