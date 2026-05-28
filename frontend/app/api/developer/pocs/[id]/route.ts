import { proxyJson } from "../../../_lib/proxy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyJson(`/developer-workspace/pocs/${id}`);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyJson(`/developer-workspace/pocs/${id}`, {
    method: "PATCH",
    body: await request.text(),
  });
}
