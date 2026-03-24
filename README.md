# Loan Eligibility Calculator

A full-stack loan eligibility web app built with **Next.js 15 (App Router)**, **TypeScript**, and **TailwindCSS**, targeting the Indian lending market.

## Features

- **5-step application wizard** — personal info, loan details, existing debt, review, and result
- **Live RBI rate integration** — loan interest rates derived from the RBI Repo Rate
- **FOIR-based eligibility** — Fixed Obligation to Income Ratio calculation per RBI/NBFC guidelines
- **Zod-validated API routes** — type-safe backend with proper error responses
- **CIBIL score simulation** — 350–900 range score with credit band classification
- **Age-based tenure cap** — loan must close before the borrower turns 60
- **Customer dashboard** — full amortization schedule, EMI status tracking, and prepayment impact analysis

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **Validation**: Zod
- **Fonts**: Manrope + Inter (Google Fonts)

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/rates/live` | Fetch current RBI Repo Rate and derived lending rates |
| POST | `/api/loan/calculate` | Run FOIR eligibility calculation with Zod validation |
| POST | `/api/dashboard` | Generate amortization schedule and prepayment analysis |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── rates/live/    # RBI rate fetch
│   │   ├── loan/calculate/ # FOIR eligibility engine
│   │   └── dashboard/     # Amortization schedule
│   ├── step-1/            # Personal info
│   ├── step-2/            # Loan details
│   ├── step-3/            # Existing debt
│   ├── step-4/            # Review summary
│   ├── step-5/            # Eligibility result
│   └── dashboard/         # Customer dashboard
├── context/
│   └── LoanContext.tsx    # Global state + utilities
└── app/globals.css        # Theme variables
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy directly on [Vercel](https://vercel.com). No database required — all calculations are stateless.

## Eligibility Formula

Eligibility is based on the **FOIR (Fixed Obligation to Income Ratio)** standard used by Indian banks and NBFCs:

```
FOIR Limit: Salaried 50% | Freelance 45% | Business 40%
Available EMI = (Income × FOIR Limit) - Existing EMIs
Max Loan = Available EMI × ((1 - (1 + r)^-n) / r)
```
