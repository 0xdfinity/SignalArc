import { NextRequest, NextResponse } from "next/server";

type RateWindow = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateWindow>();
const WINDOW_MS = 60_000;
const READ_LIMIT = 120;
const WRITE_LIMIT = 30;

function clientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const methodClass = request.method === "GET" || request.method === "HEAD" ? "read" : "write";
  const routeClass = request.nextUrl.pathname.split("/").slice(0, 4).join("/");

  return `${ip}:${methodClass}:${routeClass}`;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://openrouter.ai https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.groq.com https://api.deepseek.com https://dashscope-intl.aliyuncs.com https://api.hyperliquid.xyz https://gamma-api.polymarket.com https://tokens.uniswap.org https://rpc.testnet.arc.network https://rpc.testnet.arc-node.thecanteenapp.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
}

function rateLimit(request: NextRequest) {
  if (request.headers.get("x-internal-api") === "1") {
    return null;
  }

  const now = Date.now();
  const key = clientKey(request);
  const isRead = request.method === "GET" || request.method === "HEAD";
  const max = isRead ? READ_LIMIT : WRITE_LIMIT;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  current.count += 1;

  if (current.count <= max) {
    return null;
  }

  const response = new NextResponse(null, { status: 429, statusText: "Too Many Requests" });
  response.headers.set("Retry-After", Math.ceil((current.resetAt - now) / 1000).toString());
  response.headers.set("X-RateLimit-Limit", max.toString());
  response.headers.set("X-RateLimit-Remaining", "0");
  response.headers.set("X-RateLimit-Reset", new Date(current.resetAt).toISOString());
  applySecurityHeaders(response);

  return response;
}

export function proxy(request: NextRequest) {
  if (request.headers.has("x-middleware-subrequest")) {
    const blocked = new NextResponse(null, { status: 400, statusText: "Bad Request" });
    applySecurityHeaders(blocked);
    return blocked;
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL ?? "*");
      response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      applySecurityHeaders(response);
      return response;
    }

    const limited = rateLimit(request);

    if (limited) {
      return limited;
    }
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"],
};
