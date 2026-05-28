import { proxyJson } from "../../_lib/proxy";

export async function GET() {
  return proxyJson("/admin/activity-logs");
}
