"use client";
import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function LoginPage() {
  const [username, setUsername] = React.useState("admin");
  const [password, setPassword] = React.useState("Password123!");
  const [failed, setFailed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

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
      setTimeout(() => router.push("/workspace/incident"), 650);
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
