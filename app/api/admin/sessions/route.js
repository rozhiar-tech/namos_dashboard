import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // TODO: Replace with actual data from your backend
    const sessions = [];

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Sessions GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

