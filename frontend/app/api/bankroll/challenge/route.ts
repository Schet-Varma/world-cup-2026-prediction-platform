import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE}/bankroll/challenge`, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: "Backend bankroll endpoint failed" }, { status: response.status });
    }
    const payload = await response.json();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Backend bankroll endpoint unavailable" }, { status: 503 });
  }
}
