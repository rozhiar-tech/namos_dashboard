import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSessions = searchParams.get("includeSessions");

    // TODO: Replace with actual data from your backend
    const drivers = [];

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("Drivers GET error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // TODO: Replace with actual creation logic
    const newDriver = {
      id: Date.now(),
      ...body,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(newDriver, { status: 201 });
  } catch (error) {
    console.error("Drivers POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

