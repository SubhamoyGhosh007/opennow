import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decode } from "next-auth/jwt";
import { gateForRequest } from "@/lib/security/gates";

const COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

function getCookieValue(req: NextRequest, name: string): string | null {
  const direct = req.cookies.get(name)?.value;
  if (direct) return direct;

  // Handle chunked cookies: name.0, name.1, ...
  let chunks = "";
  let i = 0;
  while (true) {
    const chunk = req.cookies.get(`${name}.${i}`)?.value;
    if (!chunk) break;
    chunks += chunk;
    i++;
  }
  return chunks || null;
}

/**
 * Robust session gate. First attempts zero-hop direct JWT decryption
 * (Edge-safe WebCrypto via next-auth/jwt). Falls back to session endpoint
 * with proper forwarded SSL headers for reverse proxies (e.g. Cloudflare, Nginx).
 */
async function rolesFromRequest(req: NextRequest): Promise<string[] | null> {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  // Strategy 1: Direct token decode from cookies (immune to proxy/port issues)
  if (secret) {
    for (const name of COOKIE_NAMES) {
      const token = getCookieValue(req, name);
      if (!token) continue;
      try {
        const decoded = await decode({
          token,
          secret,
          salt: name,
        });
        if (decoded && (decoded as any).roles) {
          const roles = (decoded as any).roles;
          return Array.isArray(roles) ? roles : [];
        }
      } catch {
        /* try next cookie variation */
      }
    }
  }

  // Strategy 2: Session endpoint fallback with forwarded headers
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;

  try {
    const port = process.env.PORT || "3000";
    const proto =
      req.headers.get("x-forwarded-proto") ||
      (req.url.startsWith("https") ? "https" : "http");
    const host =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      "127.0.0.1";

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/session`, {
      headers: {
        cookie,
        "x-forwarded-proto": proto,
        "x-forwarded-host": host,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const session = await res.json();
    if (!session?.user) return null;
    const roles = (session.user as any)?.roles;
    return Array.isArray(roles) ? roles : [];
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Landing is the public front door — live data sections degrade to sign-in prompts.
  if (pathname === "/") return NextResponse.next();

  const roles = await rolesFromRequest(req);

  // The gates themselves stay public: guests see them, signed-in users pass through.
  if (pathname === "/login" || pathname === "/register") {
    if (!roles) return NextResponse.next();
    const to = req.nextUrl.searchParams.get("callbackUrl");
    const safe =
      to &&
      to.startsWith("/") &&
      !to.startsWith("//") &&
      to !== "/login" &&
      to !== "/register";
    const url = req.nextUrl.clone();
    url.pathname = safe ? (to as string) : "/workspace/incident";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const decision = gateForRequest(pathname, roles);

  switch (decision.kind) {
    case "allow":
      return NextResponse.next();
    case "unauthorized":
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    case "redirect": {
      const url = req.nextUrl.clone();
      url.pathname = decision.to;
      return NextResponse.redirect(url);
    }
    case "login": {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
