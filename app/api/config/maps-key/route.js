import { NextResponse } from "next/server";

/**
 * Serves the Google Maps API key from server-side env only.
 * Using a non-NEXT_PUBLIC_ variable keeps the key out of the client bundle,
 * so Netlify's secrets scanner won't find it in build output.
 * Set GOOGLE_MAPS_API_KEY in Netlify (not NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
 */
export async function GET() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 503 }
    );
  }
  return NextResponse.json({ key });
}
