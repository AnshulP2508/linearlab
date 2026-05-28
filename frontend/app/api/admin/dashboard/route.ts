import { proxyJson } from "../../_lib/proxy";

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return proxyJson(`/admin/dashboard${search}`);
}
