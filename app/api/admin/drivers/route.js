import { proxyToBackend } from "../../../lib/backendProxy";

export async function GET(request) {
  return proxyToBackend("/admin/drivers", request);
}

export async function POST(request) {
  return proxyToBackend("/admin/drivers", request);
}

