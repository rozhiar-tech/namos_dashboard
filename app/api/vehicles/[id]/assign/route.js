import { proxyToBackend } from "../../../../lib/backendProxy";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  const { id } = await params;
  return proxyToBackend(`/vehicles/${id}/assign`, request);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const driverId = request.nextUrl.searchParams.get("driverId");

  if (!driverId) {
    return NextResponse.json(
      { message: "driverId query parameter is required." },
      { status: 400 }
    );
  }

  return proxyToBackend(`/vehicles/${id}/assign/${driverId}`, request);
}
