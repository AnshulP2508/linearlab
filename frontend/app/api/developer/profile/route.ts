import { proxyJson } from "../../_lib/proxy";

export async function PATCH(request: Request) {
  return proxyJson("/developer-workspace/profile", {
    method: "PATCH",
    body: await request.text(),
  });
}
