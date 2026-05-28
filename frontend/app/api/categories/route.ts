import { proxyJson } from "../_lib/proxy";

export async function GET() {
  return proxyJson("/categories");
}

export async function POST(request: Request) {
  return proxyJson("/categories", {
    method: "POST",
    body: await request.text(),
  });
}
