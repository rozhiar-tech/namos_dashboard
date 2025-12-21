import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // TODO: Replace with actual data from your backend
    const vehicles = [];

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error("Vehicles mine GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

