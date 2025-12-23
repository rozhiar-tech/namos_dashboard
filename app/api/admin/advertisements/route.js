import { proxyToBackend } from "../../../lib/backendProxy";

export async function GET(request) {
  return proxyToBackend("/admin/advertisements", request);
}

export async function POST(request) {
  return proxyToBackend("/admin/advertisements", request);
}

