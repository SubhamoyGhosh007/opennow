import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecrypt } from "jose";
import { gateForRequest } from "@/lib/security/gates";

/**
 * Edge-safe session gate. Auth.js v5 encrypts its JWT session cookie (JWE),
 * so we decrypt it directly with AUTH_SECRET instead of importing the
 * Node-side auth module (postgres/bcrypt) into the Edge runtime.
 */
async function rolesFromRequest(req: NextRequest): Promise<string[] | null> {
  const cookie =
    req.cookies.get("__Secure-authjs.session-token") ?? req.cookies.get("authjs.session-token");
  if (!cookie?.value || !process.env.AUTH_SECRET) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtDecrypt(cookie.value, secret);
    const roles = (payload as any).roles;
    return Array.isArray(roles) ? roles : null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Landing is the public front door — live data sections degrade to sign-in prompts.
  if (pathname === "/") return NextResponse.next();

  const roles = await rolesFromRequest(req);

  // The gate itself must stay public: guests see it, signed-in users pass through.
  if (pathname === "/login") {
    if (!roles) return NextResponse.next();
    const to = req.nextUrl.searchParams.get("callbackUrl");
    const safe = to && to.startsWith("/") && !to.startsWith("//") && to !== "/login";
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
