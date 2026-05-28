import { proxyJson } from "../../_lib/proxy";

export async function POST(request: Request) {
  return proxyJson("/feedback", {
    method: "POST",
    body: await request.text(),
  });
}
