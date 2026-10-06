import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { gateForRequest } from "@/lib/security/gates";

/**
 * Edge-safe session gate. Auth.js v5 encrypts its JWT session cookie (JWE)
 * with an HKDF-derived key, so we read it via Auth.js's own getToken instead
 * of decrypting by hand (raw AUTH_SECRET bytes do NOT decrypt it).
 */
async function rolesFromRequest(req: NextRequest): Promise<string[] | null> {
  if (!process.env.AUTH_SECRET) return null;
  try {
    const token =
      (await getToken({ req: req as any, secret: process.env.AUTH_SECRET, salt: "authjs.session-token" })) ??
      (await getToken({
        req: req as any,
        secret: process.env.AUTH_SECRET,
        cookieName: "__Secure-authjs.session-token",
        salt: "__Secure-authjs.session-token",
      }));
    if (!token) return null;
    const roles = (token as any).roles;
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
