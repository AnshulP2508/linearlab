import { proxyJson } from "../../_lib/proxy";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyJson(`/feedback/${id}`, { method: "DELETE" });
}
