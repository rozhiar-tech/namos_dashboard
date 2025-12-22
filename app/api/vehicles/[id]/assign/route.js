import { proxyToBackend } from "../../../../lib/backendProxy";

export async function POST(request, { params }) {
  const { id } = await params;
  return proxyToBackend(`/vehicles/${id}/assign`, request);
}

