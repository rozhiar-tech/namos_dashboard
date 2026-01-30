import { NextResponse } from "next/server";

/**
 * Serves the Google Maps API key from server-side env.
 * Prefer GOOGLE_MAPS_API_KEY (keeps key out of client bundle for Netlify).
 * Falls back to NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for local/dev.
 */
export async function GET() {
  const key =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 503 }
    );
  }
  return NextResponse.json({ key });
}
