import { proxyToBackend } from "../../../../lib/backendProxy";

export async function PATCH(request, { params }) {
  const { id } = await params;
  return proxyToBackend(`/admin/users/${id}`, request);
}
