import { proxyJson } from "../../../../_lib/proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyJson(`/pocs/${id}/documentation/generate`, {
    method: "POST",
    body: await request.text(),
  });
}
