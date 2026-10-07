import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { gateForRequest } from "@/lib/security/gates";

/**
 * Edge-safe session gate. Instead of decrypting the Auth.js JWT by hand
 * (cookie names, salts and key derivation must match exactly or every
 * logged-in user bounces to login), we ask the app's own session endpoint —
 * the identical code path the client `useSession` hook uses, so the two can
 * never disagree about who is signed in.
 */
async function rolesFromRequest(req: NextRequest): Promise<string[] | null> {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;
  try {
    // Same-container loopback: no proxy, no DNS, no extra hops.
    const port = process.env.PORT || "3000";
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/session`, {
      headers: { cookie },
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
    const safe = to && to.startsWith("/") && !to.startsWith("//") && to !== "/login" && to !== "/register";
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
