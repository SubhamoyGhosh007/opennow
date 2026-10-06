"use client";
import * as React from "react";
import { signIn, getProviders, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SuccessCheck, ShimmerLine } from "@/components/motion/micro";
import {
  AuthSplit,
  AuthLogo,
  AuthField,
  AuthInput,
  PasswordInput,
  MailIcon,
  OrgIcon,
  OrDivider,
} from "@/components/auth/auth-split";

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

export default function RegisterPage() {
  return (
    <React.Suspense>
      <RegisterForm />
    </React.Suspense>
  );
}

function RegisterForm() {
  const [organization, setOrganization] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [oauth, setOauth] = React.useState<{ id: string; name: string }[]>([]);
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
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, router, callbackUrl]);

  const submit = async () => {
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid work email.");
      return;
    }
    if (password.length < 8) {
      setError("Password needs at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match — re-enter them.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim(), organization: organization.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Could not create the account.");
        setBusy(false);
        return;
      }
      const login = await signIn("credentials", {
        username: j.result.user_name,
        password,
        redirect: false,
      });
      setBusy(false);
      if (login?.error) {
        setError("Account created — please sign in with your new credentials.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push(callbackUrl), 650);
    } catch {
      setBusy(false);
      setError("Network error — try again.");
    }
  };

  return (
    <AuthSplit>
      <AuthLogo />
      <h1 className="font-display mt-6 text-[32px] font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-[15px] text-[var(--ls-muted)]">Start your journey with OpenNow</p>

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
        <AuthField label="Organization">
          <AuthInput
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Acme Inc."
            autoComplete="organization"
            icon={<OrgIcon />}
          />
        </AuthField>
        <AuthField label="Your name">
          <AuthInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            autoComplete="name"
            icon={<OrgIcon />}
          />
        </AuthField>
        <AuthField label="Work email">
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            icon={<MailIcon />}
          />
        </AuthField>
        <AuthField label="Password">
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a secure password"
            autoComplete="new-password"
          />
        </AuthField>
        <AuthField label="Confirm Password" error={error}>
          <PasswordInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            autoComplete="new-password"
          />
        </AuthField>

        <button type="submit" disabled={busy || done} className="ls-btn h-12 w-full justify-center disabled:opacity-60">
          {busy ? (
            <ShimmerLine text="Creating…" />
          ) : done ? (
            "Welcome aboard"
          ) : (
            <>Create account <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
        <span className="flex justify-center">
          <SuccessCheck show={done} />
        </span>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ls-muted)]">
        Already have an account?{" "}
        <a href="/login" className="font-semibold text-[var(--ls-ink)] underline-offset-4 hover:underline">
          Sign in
        </a>
      </p>
      <p className="mt-4 text-center text-xs leading-relaxed text-[var(--ls-muted)]">
        By continuing, you agree to our Terms and Privacy Policy
      </p>
    </AuthSplit>
  );
}
