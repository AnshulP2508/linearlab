import { proxyJson } from "../_lib/proxy";
import { backendRequest } from "../_lib/backend";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  return proxyJson(`/pocs${search}`);
}

export async function POST(request: Request) {
  try {
    // Forward multipart/form-data as JSON, including file metadata and content.
    let body: unknown;
    const contentType = (request.headers.get("content-type") ?? "").toLowerCase();

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const obj: Record<string, unknown> = {};
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          const bytes = Buffer.from(await value.arrayBuffer());
          obj[key] = value.name;
          obj[`${key}MimeType`] = value.type || "application/octet-stream";
          obj[`${key}ContentBase64`] = bytes.toString("base64");
          obj[`${key}SizeBytes`] = String(value.size);
        } else if (key === "techStack") {
          // accumulated as repeated field
          const existing = obj[key];
          if (Array.isArray(existing)) {
            existing.push(value);
          } else if (existing !== undefined) {
            obj[key] = [existing, value];
          } else {
            obj[key] = [value];
          }
        } else {
          obj[key] = value;
        }
      }

      if (typeof obj.technologies === "string") {
        try {
          obj.technologies = JSON.parse(obj.technologies as string);
        } catch {
          obj.technologies = [obj.technologies as string];
        }
      }

      if (obj.techStack && obj.technologies === undefined) {
        obj.technologies = obj.techStack;
      }

      delete obj.techStack;

      body = JSON.stringify(obj);
    } else {
      body = await request.text();
    }

    const { response, body: responseBody } = await backendRequest("/pocs", {
      method: "POST",
      body: body as string,
    });
    return NextResponse.json(responseBody, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : "Unexpected proxy error",
      },
      { status: 500 },
    );
  }
}
