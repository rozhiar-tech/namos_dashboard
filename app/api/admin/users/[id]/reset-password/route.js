import { proxyToBackend } from "../../../../../lib/backendProxy";

export async function POST(request, { params }) {
  const { id } = await params;
  return proxyToBackend(`/admin/users/${id}/reset-password`, request);
}
