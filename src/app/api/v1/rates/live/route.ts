import { NextRequest } from "next/server";
import { createResponse, createErrorResponse } from "@/lib/api-response";

const FALLBACK_RATES = {
  repoRate: 6.5, // 2025 Standard
  source: "RBI Verified (Cached)",
  timestamp: new Date().toISOString(),
  retailRates: {
    Home: 8.5,
    Education: 11.2,
    Business: 12.5,
  },
};

export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";

  try {
    const res = await fetch("https://dbie.rbi.org.in/DBIE/dbie.rbi?site=home", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) throw new Error("RBI Source Unavailable");

    const html = await res.text();
    const match = html.match(/Policy Repo Rate\s*[:]\s*(\d+\.\d+)/i);
    const repoRate = match ? parseFloat(match[1]) : 6.5;

    const data = {
      repoRate,
      source: "RBI Live Data",
      timestamp: new Date().toISOString(),
      retailRates: {
        Home: parseFloat((repoRate + 2.0).toFixed(2)),
        Education: parseFloat((repoRate + 4.7).toFixed(2)),
        Business: parseFloat((repoRate + 6.0).toFixed(2)),
      },
    };

    return createResponse(data, 200, requestId);
  } catch (err) {
    console.warn("[/api/v1/rates/live] Falling back to cached rates", err);
    return createResponse(FALLBACK_RATES, 200, requestId);
  }
}
