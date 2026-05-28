import { proxyJson } from "../../../_lib/proxy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyJson(`/user-portal/pocs/${id}`);
}
