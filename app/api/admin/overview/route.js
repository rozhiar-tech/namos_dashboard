import { NextResponse } from "next/server";

const getBackendUrl = () => {
  const backendUrl =
    process.env.BACKEND_API_URL || "http://95.111.224.58:3001/api";

  if (!backendUrl.endsWith("/api")) {
    return backendUrl.endsWith("/") ? `${backendUrl}api` : `${backendUrl}/api`;
  }

  return backendUrl;
};

function buildBackendHeaders(request) {
  const headers = {
    Accept: "application/json",
  };
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.Authorization = authHeader;
  }
  return headers;
}

async function fetchBackendJson(path, request) {
  const base = getBackendUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    method: "GET",
    headers: buildBackendHeaders(request),
    cache: "no-store",
  });

  let body = null;
  try {
    body = await response.json();
  } catch (_) {
    body = null;
  }

  return { response, body };
}

export async function GET(request) {
  try {
    const [
      { response: statsRes, body: statsBody },
      { response: monitoringRes, body: monitoringBody },
      { response: pendingRes, body: pendingBody },
      { response: ownersRes, body: ownersBody },
    ] = await Promise.all([
      fetchBackendJson("/admin/stats", request),
      fetchBackendJson("/monitoring/stats", request),
      fetchBackendJson("/monitoring/pending", request),
      fetchBackendJson("/admin/owners", request),
    ]);

    // If both core sources fail, return the first failing status/body.
    if (!statsRes.ok && !monitoringRes.ok) {
      return NextResponse.json(statsBody ?? { message: "Failed to load overview" }, {
        status: statsRes.status || 502,
      });
    }

    const activeDrivers =
      Number(statsBody?.totalDrivers) ||
      Number(monitoringBody?.totalDrivers) ||
      0;
    const onlineDrivers =
      Number(monitoringBody?.realtime?.availableDrivers) ||
      Number(monitoringBody?.availableDrivers) ||
      0;
    const openTrips =
      Number(monitoringBody?.realtime?.activeTrips) ||
      Number(monitoringBody?.activeTrips) ||
      0;
    const scheduledTrips = Number(pendingBody?.upcomingScheduled?.count) || 0;

    const owners = Array.isArray(ownersBody?.owners) ? ownersBody.owners : [];
    const vehicles = owners.reduce(
      (count, owner) =>
        count + (Array.isArray(owner?.vehicles) ? owner.vehicles.length : 0),
      0
    );

    const revenueSek =
      Number(monitoringBody?.last24Hours?.revenue) ||
      Number(monitoringBody?.revenueToday) ||
      0;

    return NextResponse.json({
      activeDrivers,
      onlineDrivers,
      vehicles,
      openTrips,
      scheduledTrips,
      // Dashboard expects cents for display formatting.
      todaysRevenue: Math.round(revenueSek * 100),
    });
  } catch (error) {
    console.error("[api/admin/overview] aggregation error:", error);
    return NextResponse.json(
      { message: "Failed to load overview", error: error?.message },
      { status: 502 }
    );
  }
}
