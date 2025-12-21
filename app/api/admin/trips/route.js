import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "25");

    // TODO: Replace with actual data from your backend
    const trips = [];

    return NextResponse.json({ trips: trips.slice(0, limit) });
  } catch (error) {
    console.error("Trips GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

