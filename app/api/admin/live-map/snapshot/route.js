import { proxyToBackend } from "../../../../lib/backendProxy";

export async function GET(request) {
  return proxyToBackend("/admin/live-map/snapshot", request);
}
