import { proxyJson } from "../../_lib/proxy";

export async function GET() {
  return proxyJson("/user-portal/pocs");
}
