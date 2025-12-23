import { proxyToBackend } from "../../../../lib/backendProxy";

export async function POST(request) {
  return proxyToBackend("/admin/trips/create-guest", request);
}

