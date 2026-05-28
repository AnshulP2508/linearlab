import { proxyJson } from "../_lib/proxy";

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  return proxyJson(`/developers${search}`);
}
