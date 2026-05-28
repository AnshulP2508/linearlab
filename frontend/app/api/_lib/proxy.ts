import { NextResponse } from "next/server";
import { backendRequest } from "./backend";

export async function proxyJson(
  path: string,
  init?: RequestInit,
) {
  try {
    const { response, body } = await backendRequest(path, init);
    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected proxy error",
      },
      { status: 500 },
    );
  }
}
