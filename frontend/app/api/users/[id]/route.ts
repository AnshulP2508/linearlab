import { proxyJson } from "../../_lib/proxy";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyJson(`/users/${id}`, {
    method: "PATCH",
    body: await request.text(),
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyJson(`/users/${id}`, { method: "DELETE" });
}
