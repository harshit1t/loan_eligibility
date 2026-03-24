import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ApplicantSchema = z.object({
  monthlyIncome: z.number().min(10000),
  employmentStatus: z.enum(["Salaried", "Freelance", "Business"]),
  monthlyEmi: z.number().min(0).default(0),
  age: z.number().int().min(18).max(65),
});

const JointLoanSchema = z.object({
  primaryApplicant: ApplicantSchema,
  coApplicant: ApplicantSchema,
  requestedCapital: z.number().min(10000).max(100_000_000),
  loanPurpose: z.enum(["Home", "Education", "Business"]),
  repaymentTerm: z.number().int().min(12).max(360),
  annualRate: z.number().min(1).max(30).default(8.9),
});

// FOIR limits per RBI/NBFC guidelines
const FOIR_LIMITS: Record<string, number> = {
  Salaried: 0.50,
  Freelance: 0.45,
  Business: 0.40,
};

function computeEligibility(
  monthlyIncome: number,
  employmentStatus: string,
  existingEmi: number,
  annualRate: number,
  tenureMonths: number,
  age: number
) {
  const foirLimit = FOIR_LIMITS[employmentStatus];
  const r = annualRate / 100 / 12;
  const maxTenure = Math.min(tenureMonths, (60 - age) * 12);
  const effectiveTenure = Math.max(12, maxTenure);

  const availableEmi = Math.max(0, monthlyIncome * foirLimit - existingEmi);
  const maxLoan =
    availableEmi > 0 ? availableEmi * ((1 - Math.pow(1 + r, -effectiveTenure)) / r) : 0;

  return {
    foirLimit: foirLimit * 100,
    availableEmi: Math.round(availableEmi),
    maxLoan: Math.round(maxLoan),
    effectiveTenure,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const coerced = {
      ...body,
      requestedCapital: Number(body.requestedCapital),
      annualRate: Number(body.annualRate ?? 8.9),
      repaymentTerm: Number(body.repaymentTerm),
      primaryApplicant: {
        ...body.primaryApplicant,
        monthlyIncome: Number(body.primaryApplicant?.monthlyIncome),
        monthlyEmi: Number(body.primaryApplicant?.monthlyEmi ?? 0),
        age: Number(body.primaryApplicant?.age),
      },
      coApplicant: {
        ...body.coApplicant,
        monthlyIncome: Number(body.coApplicant?.monthlyIncome),
        monthlyEmi: Number(body.coApplicant?.monthlyEmi ?? 0),
        age: Number(body.coApplicant?.age),
      },
    };

    const parsed = JointLoanSchema.safeParse(coerced);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { primaryApplicant: pa, coApplicant: ca, requestedCapital, repaymentTerm, annualRate } = parsed.data;

    // Standalone eligibilities
    const paEligibility = computeEligibility(pa.monthlyIncome, pa.employmentStatus, pa.monthlyEmi, annualRate, repaymentTerm, pa.age);
    const caEligibility = computeEligibility(ca.monthlyIncome, ca.employmentStatus, ca.monthlyEmi, annualRate, repaymentTerm, ca.age);

    // Joint eligibility — banks use the lower FOIR limit of the two and combined income
    // Tenure is capped by the younger applicant (more years to retirement)
    const jointFoirLimit = Math.min(FOIR_LIMITS[pa.employmentStatus], FOIR_LIMITS[ca.employmentStatus]);
    const combinedIncome = pa.monthlyIncome + ca.monthlyIncome;
    const totalExistingEmi = pa.monthlyEmi + ca.monthlyEmi;
    const r = annualRate / 100 / 12;

    // Tenure based on younger applicant (more eligible years)
    const youngerAge = Math.min(pa.age, ca.age);
    const jointMaxTenure = Math.min(repaymentTerm, (60 - youngerAge) * 12);
    const jointEffectiveTenure = Math.max(12, jointMaxTenure);

    const jointAvailableEmi = Math.max(0, combinedIncome * jointFoirLimit - totalExistingEmi);
    const jointMaxLoan = jointAvailableEmi > 0
      ? Math.round(jointAvailableEmi * ((1 - Math.pow(1 + r, -jointEffectiveTenure)) / r))
      : 0;

    const isJointApproved = jointMaxLoan >= requestedCapital;
    const isPAAloneApproved = paEligibility.maxLoan >= requestedCapital;
    const additionalEligibility = jointMaxLoan - paEligibility.maxLoan;

    // Required EMI for requested capital
    const requiredEmi = requestedCapital > 0
      ? Math.round((requestedCapital * r * Math.pow(1 + r, repaymentTerm)) / (Math.pow(1 + r, repaymentTerm) - 1))
      : 0;

    // Ownership recommendation: typically in ratio of income contribution
    const paIncomeRatio = pa.monthlyIncome / combinedIncome;
    const recommendedPAShare = Math.round(requestedCapital * paIncomeRatio);
    const recommendedCAShare = requestedCapital - recommendedPAShare;

    return NextResponse.json({
      success: true,
      data: {
        primaryApplicant: {
          ...paEligibility,
          monthlyIncome: pa.monthlyIncome,
          employmentStatus: pa.employmentStatus,
          isApprovedAlone: isPAAloneApproved,
        },
        coApplicant: {
          ...caEligibility,
          monthlyIncome: ca.monthlyIncome,
          employmentStatus: ca.employmentStatus,
          isApprovedAlone: caEligibility.maxLoan >= requestedCapital,
        },
        joint: {
          combinedMonthlyIncome: combinedIncome,
          totalExistingEmi,
          foirLimit: jointFoirLimit * 100,
          availableEmi: Math.round(jointAvailableEmi),
          maxLoan: jointMaxLoan,
          effectiveTenure: jointEffectiveTenure,
          isApproved: isJointApproved,
          additionalEligibilityVsPrimary: Math.round(additionalEligibility),
        },
        requestedCapital,
        requiredEmi,
        annualRate,
        ownershipRecommendation: {
          primaryApplicantShare: recommendedPAShare,
          coApplicantShare: recommendedCAShare,
          primaryApplicantPercent: Math.round(paIncomeRatio * 100),
          coApplicantPercent: Math.round((1 - paIncomeRatio) * 100),
          note: "Income-proportional ownership maximises home loan tax benefit claims for both applicants under Section 24(b).",
        },
        verdict: isJointApproved
          ? `Joint application approved. Adding co-applicant increases eligibility by ₹${Math.round(additionalEligibility).toLocaleString("en-IN")} over primary applicant alone.`
          : isPAAloneApproved
          ? "Primary applicant qualifies alone. Co-applicant addition not required but can reduce EMI burden."
          : `Neither applicant qualifies alone, but joint eligibility of ₹${jointMaxLoan.toLocaleString("en-IN")} is ${isJointApproved ? "sufficient" : "still below"} the requested amount.`,
      },
    });
  } catch (err) {
    console.error("[/api/loan/joint-calculate]", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
