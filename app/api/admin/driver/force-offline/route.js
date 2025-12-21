import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    
    // TODO: Replace with actual force-offline logic
    return NextResponse.json({
      success: true,
      message: "Driver forced offline",
    });
  } catch (error) {
    console.error("Force offline error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

