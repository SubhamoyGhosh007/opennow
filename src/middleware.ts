import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { gateForRequest } from "@/lib/security/gates";

const CANDIDATE_SECRETS = Array.from(
  new Set(
    [
      process.env.AUTH_SECRET,
      process.env.NEXTAUTH_SECRET,
      "build-time-placeholder-secret-000000000000",
      "opennow-dev-secret-change-me-please-32chars",
    ].filter(Boolean) as string[]
  )
);

/**
 * Robust session role extractor for NextAuth v5 across both local
 * dev and production behind reverse proxies (Cloudflare, Nginx, etc.).
 *
 * Checks all permutations of cookie names and security salts using
 * NextAuth's official JWT decoder, with multi-secret fallback.
 */
async function rolesFromRequest(req: NextRequest): Promise<string[] | null> {
  const isHttps =
    req.url.startsWith("https://") ||
    req.headers.get("x-forwarded-proto") === "https";

  const probes: Array<{
    cookieName?: string;
    salt?: string;
    secureCookie?: boolean;
  }> = [
    // Standard Auth.js v5 names with auto secure detection
    { secureCookie: isHttps },
    { secureCookie: !isHttps },
    // Explicit Auth.js v5 cookie and salt variants
    {
      cookieName: "__Secure-authjs.session-token",
      salt: "__Secure-authjs.session-token",
      secureCookie: true,
    },
    {
      cookieName: "authjs.session-token",
      salt: "authjs.session-token",
      secureCookie: false,
    },
    {
      cookieName: "__Secure-authjs.session-token",
      salt: "authjs.session-token",
      secureCookie: true,
    },
    {
      cookieName: "authjs.session-token",
      salt: "__Secure-authjs.session-token",
      secureCookie: false,
    },
    // NextAuth v4 backwards compatibility variants
    {
      cookieName: "__Secure-next-auth.session-token",
      salt: "__Secure-next-auth.session-token",
      secureCookie: true,
    },
    {
      cookieName: "next-auth.session-token",
      salt: "next-auth.session-token",
      secureCookie: false,
    },
    {
      cookieName: "__Secure-next-auth.session-token",
      salt: "next-auth.session-token",
      secureCookie: true,
    },
    {
      cookieName: "next-auth.session-token",
      salt: "__Secure-next-auth.session-token",
      secureCookie: false,
    },
  ];

  for (const cfg of probes) {
    try {
      const token = await getToken({
        req,
        secret: CANDIDATE_SECRETS,
        ...cfg,
      } as any);
      if (token) {
        const roles = (token as any).roles;
        return Array.isArray(roles) ? roles : [];
      }
    } catch {
      // Continue to next probe
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

  // Legal pages are public by design (registrars and OAuth reviewers fetch them unauthenticated).
  if (pathname === "/privacy" || pathname === "/terms") return NextResponse.next();

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
