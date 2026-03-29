import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  requestId: string;
  timestamp: string;
}

export function createResponse<T>(
  data: T,
  status: number = 200,
  requestId: string = "unknown"
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function createErrorResponse(
  error: string,
  status: number = 400,
  requestId: string = "unknown",
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
