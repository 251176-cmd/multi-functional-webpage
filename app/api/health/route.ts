import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * 
 * Simple health check endpoint to verify that the server is running.
 * Returns the status, current timestamp, server uptime, and database status.
 * 
 * @returns {Promise<NextResponse<HealthResponse>>} JSON response with health information
 */
export async function GET(): Promise<NextResponse> {
 
  return NextResponse.json({
    status: 'UP',
  }, { status: 200 });
}

