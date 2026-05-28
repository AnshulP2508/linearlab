import { proxyJson } from "../_lib/proxy";

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  return proxyJson(`/feedback${search}`);
}

export async function POST(request: Request) {
  return proxyJson("/user-portal/feedback", {
    method: "POST",
    body: await request.text(),
  });
}
