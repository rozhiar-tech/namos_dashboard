import { proxyToBackend } from "../../lib/backendProxy";

export async function GET(request) {
  return proxyToBackend("/vehicles", request);
}

export async function POST(request) {
  return proxyToBackend("/vehicles", request);
}

