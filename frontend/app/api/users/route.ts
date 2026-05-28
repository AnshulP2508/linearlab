import { proxyJson } from "../_lib/proxy";

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  return proxyJson(`/users${search}`);
}

export async function POST(request: Request) {
  return proxyJson("/users", {
    method: "POST",
    body: await request.text(),
  });
}
