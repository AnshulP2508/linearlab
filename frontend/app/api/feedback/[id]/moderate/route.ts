import { proxyJson } from "../../../_lib/proxy";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyJson(`/feedback/${id}/moderate`, {
    method: "PATCH",
    body: await request.text(),
  });
}
