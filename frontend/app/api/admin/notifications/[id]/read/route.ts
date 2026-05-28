import { proxyJson } from "../../../../_lib/proxy";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyJson(`/admin/notifications/${id}/read`, {
    method: "PATCH",
  });
}
