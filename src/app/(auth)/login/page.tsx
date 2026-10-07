"use client";
import * as React from "react";
import { signIn, getProviders, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthSplit,
  AuthLogo,
  AuthField,
  AuthInput,
  PasswordInput,
  MailIcon,
  OrDivider,
} from "@/components/auth/auth-split";
import { SuccessCheck, ShimmerLine } from "@/components/motion/micro";

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
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.7 3.5 2.7.2.1c2.2-2 3.6-5 3.6-9.3z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.7.1-3.6 2.8v.7C2.9 21.5 7 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.7-3.6-2.8-.1.1C.5 7.9 0 9.9 0 12s.5 4.1 1.4 5.9l3.8-3.5z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7 0 2.9 2.5 1.4 6.1l3.8 3.5c1-2.8 3.7-4.9 6.8-4.9z" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
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
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [failed, setFailed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [forgot, setForgot] = React.useState(false);
  const [oauth, setOauth] = React.useState<{ id: string; name: string }[]>([]);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//") && rawCallback !== "/login" && rawCallback !== "/register"
      ? rawCallback
      : "/workspace/incident";

  React.useEffect(() => {
    getProviders().then((p) => {
      if (!p) return;
      setOauth(Object.values(p).filter((x) => x.id !== "credentials").map((x) => ({ id: x.id, name: x.name })));
    });
  }, []);

  React.useEffect(() => {
    if (status === "authenticated") {
      window.location.href = callbackUrl;
    }
  }, [status, callbackUrl]);

  const fail = () => {
    const wrap = wrapRef.current;
    const box = boxRef.current;
    wrap?.classList.add("is-error");
    box?.classList.add("is-error");
    box?.classList.remove("is-shaking");
    void box?.offsetWidth;
    box?.classList.add("is-shaking");
    setFailed(true);
    revertAfterHold(wrap, box);
  };

  const submit = async () => {
    setBusy(true);
    setFailed(false);
    const res = await signIn("credentials", { username: email.trim(), password, redirect: false });
    setBusy(false);
    if (res?.error) {
      fail();
    } else {
      setDone(true);
      setTimeout(() => {
        window.location.href = callbackUrl;
      }, 500);
    }
  };

  return (
    <AuthSplit>
      <AuthLogo />
      <h1 className="font-display mt-6 text-[32px] font-bold tracking-tight">Glad to have you back!</h1>

      <div className="mt-6 space-y-2.5">
        {oauth.map((p) => {
          const meta = MARKS[p.id] || { label: `Continue with ${p.name}`, Mark: GoogleMark };
          const Mark = meta.Mark;
          return (
            <button
              key={p.id}
              onClick={() => signIn(p.id, { callbackUrl })}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--ls-line)] text-[15px] font-medium transition-colors hover:border-[var(--ls-ink)]"
            >
              <Mark /> {meta.label}
            </button>
          );
        })}
      </div>

      {oauth.length > 0 && (
        <div className="my-4">
          <OrDivider />
        </div>
      )}

      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div ref={wrapRef} className="t-input-wrap space-y-4">
          <div ref={boxRef} className="t-input space-y-4">
            <AuthField label="Email">
              <AuthInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                icon={<MailIcon />}
              />
            </AuthField>
            <AuthField label="Password">
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </AuthField>
          </div>
          <p className="t-error-msg text-xs font-medium text-red-700" role={failed ? "alert" : undefined}>
            {failed ? "Email or password did not match — try again." : ""}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setForgot((f) => !f)}
            className="text-[13px] font-medium text-[var(--ls-muted)] hover:text-[var(--ls-ink)]"
          >
            Forgot password?
          </button>
        </div>
        {forgot && (
          <p className="rounded-xl bg-[var(--ls-mist)] p-3 text-[13px] text-[var(--ls-muted)]">
            Password resets are handled by your workspace admin — or sign in with Google or Microsoft instead.
          </p>
        )}

        <button type="submit" disabled={busy || done} className="ls-btn h-12 w-full justify-center disabled:opacity-60">
          {busy ? <ShimmerLine text="Verifying…" /> : done ? "Welcome back" : "Sign in"}
        </button>
        <span className="flex justify-center">
          <SuccessCheck show={done} />
        </span>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ls-muted)]">
        Don&apos;t have an account?{" "}
        <a href="/register" className="font-semibold text-[var(--ls-ink)] underline-offset-4 hover:underline">
          Sign up
        </a>
      </p>
      <p className="mt-4 text-center text-xs leading-relaxed text-[var(--ls-muted)]">
        By signing in, you agree to the Terms of Use, Privacy Notice, and Cookie Notice.
      </p>
    </AuthSplit>
  );
}
