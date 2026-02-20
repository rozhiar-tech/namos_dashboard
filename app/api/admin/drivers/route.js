import { NextResponse } from "next/server";
import { proxyToBackend } from "../../../lib/backendProxy";

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

function buildDriverLabel(driver) {
  return (
    driver?.fullName ??
    driver?.name ??
    driver?.phone ??
    (driver?.id ? `Driver #${driver.id}` : "Driver")
  );
}

export async function GET(request) {
  const query = request.nextUrl.searchParams.toString();
  const directPath = `/admin/drivers${query ? `?${query}` : ""}`;

  // First try the direct backend endpoint if present.
  const { response: directResponse, body: directBody } = await fetchBackendJson(
    directPath,
    request
  );

  if (directResponse.status !== 404) {
    return NextResponse.json(directBody, { status: directResponse.status });
  }

  // Fallback for deployments where GET /admin/drivers is not implemented.
  try {
    const [
      { response: driversRes, body: driversBody },
      { response: ownerDriversRes, body: ownerDriversBody },
      { response: ownersRes, body: ownersBody },
      { response: vehiclesRes, body: vehiclesBody },
    ] = await Promise.all([
      fetchBackendJson("/admin/users?role=driver&page=1&limit=500", request),
      fetchBackendJson(
        "/admin/users?role=owner_driver&page=1&limit=500",
        request
      ),
      fetchBackendJson("/admin/owners", request),
      fetchBackendJson("/vehicles/mine", request),
    ]);

    if (
      !driversRes.ok ||
      !ownerDriversRes.ok ||
      !ownersRes.ok ||
      !vehiclesRes.ok
    ) {
      return NextResponse.json(directBody, { status: 404 });
    }

    const allUsers = [
      ...(Array.isArray(driversBody?.users) ? driversBody.users : []),
      ...(Array.isArray(ownerDriversBody?.users) ? ownerDriversBody.users : []),
    ];

    const dedupedUsers = new Map();
    for (const user of allUsers) {
      if (user?.id != null) {
        dedupedUsers.set(user.id, user);
      }
    }

    const ownersMap = new Map(
      (Array.isArray(ownersBody?.owners) ? ownersBody.owners : []).map(
        (owner) => [owner.id, owner]
      )
    );

    const driversMap = new Map();
    for (const user of dedupedUsers.values()) {
      driversMap.set(user.id, {
        id: user.id,
        name: buildDriverLabel(user),
        phone: user.phone ?? "—",
        ownerName: "—",
        vehicleId: null,
        vehicleLabel: null,
        status: "offline",
        sessionStartedAt: null,
        earningsToday: 0,
      });
    }

    const vehicles = Array.isArray(vehiclesBody?.vehicles)
      ? vehiclesBody.vehicles
      : [];

    for (const vehicle of vehicles) {
      const ownerName =
        vehicle?.ownerName ??
        vehicle?.owner?.fullName ??
        ownersMap.get(vehicle?.ownerId)?.fullName ??
        "—";
      const vehicleId = vehicle?.id ?? null;
      const computedVehicleLabel = `${vehicle?.make ?? ""} ${
        vehicle?.model ?? ""
      }`.trim();
      const vehicleLabel =
        vehicle?.label ||
        computedVehicleLabel ||
        vehicle?.plateNumber ||
        vehicle?.plate_number ||
        "Vehicle";

      const assignments = Array.isArray(vehicle?.assignments)
        ? vehicle.assignments
        : [];
      for (const assignment of assignments) {
        const assignedDriverId =
          assignment?.driverId ?? assignment?.driver?.id ?? null;
        if (!assignedDriverId || !driversMap.has(assignedDriverId)) continue;
        const draft = driversMap.get(assignedDriverId);
        driversMap.set(assignedDriverId, {
          ...draft,
          ownerName,
          vehicleId: draft.vehicleId ?? vehicleId,
          vehicleLabel: draft.vehicleLabel ?? vehicleLabel,
        });
      }

      const activeSession = vehicle?.activeSession ?? null;
      const activeDriverId =
        activeSession?.driverId ??
        activeSession?.driver?.id ??
        activeSession?.driver_id ??
        null;
      if (activeDriverId && driversMap.has(activeDriverId)) {
        const draft = driversMap.get(activeDriverId);
        driversMap.set(activeDriverId, {
          ...draft,
          ownerName,
          vehicleId: vehicleId ?? draft.vehicleId,
          vehicleLabel: vehicleLabel ?? draft.vehicleLabel,
          status: "online",
          sessionStartedAt:
            activeSession?.startedAt ??
            activeSession?.createdAt ??
            activeSession?.started_at ??
            draft.sessionStartedAt,
        });
      }

      const driverStats = Array.isArray(vehicle?.driverStats)
        ? vehicle.driverStats
        : [];
      for (const stat of driverStats) {
        const statDriverId = stat?.driverId ?? stat?.driver?.id ?? null;
        if (!statDriverId || !driversMap.has(statDriverId)) continue;
        const totalFare = Number(stat?.totalFare) || 0;
        const draft = driversMap.get(statDriverId);
        driversMap.set(statDriverId, {
          ...draft,
          earningsToday: draft.earningsToday + Math.round(totalFare * 100),
        });
      }
    }

    const drivers = Array.from(driversMap.values()).sort((a, b) => {
      if (a.status === b.status) return a.id - b.id;
      return a.status === "online" ? -1 : 1;
    });

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("[api/admin/drivers] fallback failed:", error);
    return NextResponse.json(directBody, { status: 404 });
  }
}

export async function POST(request) {
  return proxyToBackend("/admin/drivers", request);
}
