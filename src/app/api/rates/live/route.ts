import { NextResponse } from "next/server";

// RBI-verified rates as of Feb 2025 MPC meeting (repo rate cut to 6.25%)
const FALLBACK_RATES = {
  repo_rate: 6.25,
  reverse_repo_rate: 3.35,
  crr: 4.0,
  slr: 18.0,
  bank_rate: 6.50,
  mclr_1yr_sbi: 8.90,
  effective_date: "2025-02-07",
  next_mpc_meeting: "2025-04-07",
};

async function fetchLiveRepoRate(): Promise<{ repo_rate: number; effective_date: string } | null> {
  try {
    const res = await fetch(
      "https://dbie.rbi.org.in/statmaster.rbi?method=getQuickDataForGlobalSearch&searchtext=repo+rate&languageId=1",
      {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LoanCalc/1.0)" },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/6\.\d{2}/);
    if (match) {
      return { repo_rate: parseFloat(match[0]), effective_date: new Date().toISOString().split("T")[0] };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const live = await fetchLiveRepoRate();

  const repoRate = live?.repo_rate ?? FALLBACK_RATES.repo_rate;
  const source = live ? "RBI DBIE (Live)" : "RBI Verified (Cached)";
  const effectiveDate = live?.effective_date ?? FALLBACK_RATES.effective_date;

  const rates = {
    repo_rate: repoRate,
    reverse_repo_rate: FALLBACK_RATES.reverse_repo_rate,
    crr: FALLBACK_RATES.crr,
    slr: FALLBACK_RATES.slr,
    bank_rate: parseFloat((repoRate + 0.25).toFixed(2)),
    mclr_1yr: parseFloat((repoRate + 2.65).toFixed(2)),

    // Purpose-specific retail rates (Repo + spread)
    home_loan_rate: parseFloat((repoRate + 2.65).toFixed(2)),
    personal_loan_rate: parseFloat((repoRate + 6.75).toFixed(2)),
    education_loan_rate: parseFloat((repoRate + 4.75).toFixed(2)),
    business_loan_rate: parseFloat((repoRate + 6.25).toFixed(2)),

    source,
    effective_date: effectiveDate,
    next_mpc_meeting: FALLBACK_RATES.next_mpc_meeting,
    fetched_at: new Date().toISOString(),
  };

  return NextResponse.json(
    { success: true, data: rates },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
