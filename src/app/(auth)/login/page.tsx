"use client";
import * as React from "react";
import { signIn, getProviders, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessCheck, ShimmerLine } from "@/components/motion/micro";
import { GridBackdrop } from "@/components/aceternity/effects";

function revertAfterHold(wrap: HTMLElement | null, input: HTMLElement | null) {
  if (!wrap || !input) return;
  const cs = getComputedStyle(document.documentElement);
  const hold = parseFloat(cs.getPropertyValue("--revert-hold")) || 3000;
  setTimeout(() => {
    wrap.classList.remove("is-error");
    input.classList.remove("is-error");
  }, hold);
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.7 3.5 2.7.2.1c2.2-2 3.6-5 3.6-9.3z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.7.1-3.6 2.8v.7C2.9 21.5 7 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.7-3.6-2.8-.1.1C.5 7.9 0 9.9 0 12s.5 4.1 1.4 5.9l3.8-3.5z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7 0 2.9 2.5 1.4 6.1l3.8 3.5c1-2.8 3.7-4.9 6.8-4.9z" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
    </svg>
  );
}

const MARKS: Record<string, { label: string; Mark: () => JSX.Element }> = {
  google: { label: "Continue with Google", Mark: GoogleMark },
  "microsoft-entra-id": { label: "Continue with Microsoft", Mark: MicrosoftMark },
};

export default function LoginPage() {
  return (
    <React.Suspense>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const [username, setUsername] = React.useState("admin");
  const [password, setPassword] = React.useState("Password123!");
  const [failed, setFailed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [oauth, setOauth] = React.useState<{ id: string; name: string }[]>([]);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//") && rawCallback !== "/login"
      ? rawCallback
      : "/workspace/incident";

  React.useEffect(() => {
    getProviders().then((p) => {
      if (!p) return;
      setOauth(Object.values(p).filter((x) => x.id !== "credentials").map((x) => ({ id: x.id, name: x.name })));
    });
  }, []);

  // Already signed in → leave the gate.
  React.useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, router, callbackUrl]);

  const submit = async () => {
    setBusy(true);
    setFailed(false);
    const res = await signIn("credentials", { username, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      // Error-state shake: orthogonal .is-error + replayed .is-shaking.
      const wrap = wrapRef.current;
      const box = boxRef.current;
      wrap?.classList.add("is-error");
      box?.classList.add("is-error");
      box?.classList.remove("is-shaking");
      void box?.offsetWidth;
      box?.classList.add("is-shaking");
      setFailed(true);
      revertAfterHold(wrap, box);
    } else {
      setDone(true);
      setTimeout(() => router.push(callbackUrl), 650);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <GridBackdrop />
      <div className="t-modal is-open w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-lg font-semibold">Console sign-in</h1>
            <p className="text-xs text-muted-foreground">Seeded: admin · itil.fulfiller · abel.tuter</p>
          </div>
        </div>

        {oauth.length > 0 && (
          <div className="mb-4 space-y-2">
            {oauth.map((p) => {
              const meta = MARKS[p.id] || { label: `Continue with ${p.name}`, Mark: ShieldCheck as any };
              const Mark = meta.Mark;
              return (
                <Button
                  key={p.id}
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn(p.id, { callbackUrl })}
                >
                  <Mark /> {meta.label}
                </Button>
              );
            })}
            <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div ref={wrapRef} className="t-input-wrap space-y-3">
            <div ref={boxRef} className="t-input space-y-3 rounded-lg border border-transparent p-0.5">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                aria-label="Username"
                autoComplete="username"
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                aria-label="Password"
                autoComplete="current-password"
              />
            </div>
            <p className="t-error-msg text-xs text-rose-400">
              {failed ? "Credentials rejected — check the username and password." : ""}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button type="submit" variant="signal" className="flex-1" disabled={busy || done}>
              {busy ? <ShimmerLine text="Verifying…" /> : done ? "Welcome" : "Sign in"}
            </Button>
            <SuccessCheck show={done} />
          </div>
        </form>
        <p className="mt-3 font-ticket text-[11px] text-muted-foreground">password for seeds: Password123!</p>
      </div>
    </main>
  );
}
