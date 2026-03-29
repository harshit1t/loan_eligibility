import { NextRequest } from "next/server";
import { createResponse, createErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? "unknown";
  const start = Date.now();

  try {
    // Probing External Source (RBI Rate simulation)
    const rbiStatus = await fetch("https://dbie.rbi.org.in/DBIE/dbie.rbi?site=home", { 
      method: "HEAD", 
      signal: AbortSignal.timeout(2000) 
    })
    .then(r => r.ok ? "UP" : "DEGRADED")
    .catch(() => "DOWN");

    const uptime = process.uptime();
    const latency = Date.now() - start;

    return createResponse({
      status: "PASS",
      version: "1.0.0",
      uptime: `${Math.floor(uptime)}s`,
      latency: `${latency}ms`,
      dependencies: {
        rbi_source: rbiStatus,
        database: "STATELESS", // No DB used in this project
      },
      environment: process.env.NODE_ENV,
    }, 200, requestId);

  } catch (err) {
    console.error("[/api/v1/health]", err);
    return createErrorResponse("Health check failed", 500, requestId);
  }
}
