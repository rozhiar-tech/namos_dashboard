import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeVehicles = searchParams.get("includeVehicles");

    // TODO: Replace with actual data from your backend
    const owners = [];

    if (includeVehicles === "1") {
      return NextResponse.json({ owners });
    }

    return NextResponse.json({ owners });
  } catch (error) {
    console.error("Owners GET error:", error);
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
    const newOwner = {
      id: Date.now(),
      ...body,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(newOwner, { status: 201 });
  } catch (error) {
    console.error("Owners POST error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

