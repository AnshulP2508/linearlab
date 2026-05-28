import { proxyJson } from "../../_lib/proxy";

export async function GET() {
  return proxyJson("/admin/settings");
}

export async function PATCH(request: Request) {
  return proxyJson("/admin/settings", {
    method: "PATCH",
    body: await request.text(),
  });
}
