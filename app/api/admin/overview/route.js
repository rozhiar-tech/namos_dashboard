import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // TODO: Replace with actual data from your backend
    return NextResponse.json({
      totalVehicles: 0,
      activeVehicles: 0,
      totalDrivers: 0,
      activeDrivers: 0,
      totalTrips: 0,
      activeTrips: 0,
      totalRevenue: 0,
      todayRevenue: 0,
    });
  } catch (error) {
    console.error("Overview error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

