import { NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://srv2027628.hstgr.cloud/api/v1";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function rewriteSetCookie(value: string): string {
  return value
    .split(";")
    .filter((part) => !/^\s*Domain=/i.test(part))
    .map((part) => part.trim())
    .join("; ");
}

async function proxy(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const targetUrl = `${API_BASE_URL}/${path.map(encodeURIComponent).join("/")}`;
  const headers = new Headers();

  for (const name of ["accept", "content-type", "cookie", "x-csrf-token"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    responseHeaders.append("set-cookie", rewriteSetCookie(setCookie));
  }

  responseHeaders.set("cache-control", "no-store");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
