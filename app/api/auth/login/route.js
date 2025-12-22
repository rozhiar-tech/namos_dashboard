import { proxyToBackend } from "../../../lib/backendProxy.js";

export async function POST(request) {
  return proxyToBackend("/auth/login", request);
}

