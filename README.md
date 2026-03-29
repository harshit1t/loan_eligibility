# 🏦 Senior Fintech Loan Eligibility Platform

This project demonstrates **Senior-level System Design** and **Quantitative Finance** application in a modern Next.js 15 (App Router) environment.

## 🚀 Advanced Backend Infrastructure (v1)

We have implemented a production-ready API infrastructure in `/api/v1/` that focuses on **Reliability**, **Observability**, and **Security**:

1.  **API Versioning**: All core logic resides under `/api/v1/`, ensuring zero-downtime migrations in a real production environment.
2.  **Request Tracing (Observability)**:
    - Implemented via Next.js Middleware.
    - Every request/response is tagged with a unique `X-Request-Id`.
    - Enables "Log Correlation" — trace a single user request across multiple serverless functions.
3.  **Idempotency (Reliability)**:
    - Critical endpoints (like `/api/v1/loan/calculate`) support the `Idempotency-Key` header.
    - Prevents accidental double-submissions (crucial for financial transactions).
4.  **Standardized Response Envelope**:
    - Every API returns a consistent structure: `{ success: boolean, data: T, error?: string, requestId: string, timestamp: string }`.
    - Simplifies frontend error handling and provides built-in debugging metadata.
5.  **Advanced Health Monitoring**:
    - Accessible at `/api/v1/health`.
    - Probes external dependencies (RBI rate sources) and reports system latency and uptime.

## 📊 Quantitative Features

- **Monte Carlo Stress Test**: Simulates 1,000 income paths using **Geometric Brownian Motion (GBM)** to predict FOIR breach probability.
- **Multi-Lender Comparison**: Real-time comparison across 6 major Indian lenders based on **Total Cost of Credit** (not just base rates).
- **Stateless Shareable Results**: Uses **HMAC-SHA256** signed tokens to share results securely without a database.
- **Server-Side PDF Reporting**: Generates official eligibility documents on the server for compliance and archival.

## 🛠️ Technical Stack
- **Framework**: Next.js 15 (App Router), TypeScript
- **Styling**: Tailwind CSS v4 (Material 3 Inspiration)
- **Math & Logic**: Zod (Validation), pdfkit (Reporting), HMAC (Security), Box-Muller (Gaussian Noise)
