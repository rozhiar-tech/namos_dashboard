import { proxyToBackend } from "../../../../lib/backendProxy";

export async function PUT(request, { params }) {
  const { id } = await params;
  return proxyToBackend(`/admin/advertisements/${id}`, request);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  return proxyToBackend(`/admin/advertisements/${id}`, request);
}

