import { headers } from "next/headers";

export async function serverApiGet<T>(path: string): Promise<T> {
  const headerList = await headers();
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = forwardedHost ?? headerList.get("host") ?? "localhost:3000";
  const forwardedProto = headerList.get("x-forwarded-proto");
  const cookie = headerList.get("cookie");
  const protocol = forwardedProto ?? (host.includes("localhost") ? "http" : "https");
  const url = path.startsWith("http") ? path : `${protocol}://${host}${path}`;

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "x-internal-api": "1",
      ...(cookie ? { cookie } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`SignalArc API request failed: ${response.status} ${path}`);
  }

  return response.json() as Promise<T>;
}
