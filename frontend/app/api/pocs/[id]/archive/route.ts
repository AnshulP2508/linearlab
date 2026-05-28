import { proxyJson } from "../../../_lib/proxy";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyJson(`/pocs/${id}/archive`, { method: "POST" });
}
