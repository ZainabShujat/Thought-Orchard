"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, authErrorMessage } from "@/lib/authClient";

/** Account forms: register, sign in, forgot and reset password (ADR-011). */

const MIN_PASSWORD = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({
  id,
  label,
  error,
  hint,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string; hint?: string }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-base">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="px-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-[var(--px-danger)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-[var(--px-ink-soft)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 border-4 border-[var(--px-danger)] bg-[var(--px-cream)] p-3 text-base">
      {message}
    </p>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Tell us what to call you.";
    if (!EMAIL_PATTERN.test(email.trim())) next.email = "Enter an email address like you@example.com.";
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== password) next.confirm = "The two passwords don't match.";
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    const { data, error } = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password });
    setBusy(false);
    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    if (data && !data.token) {
      // Email verification is required before the first sign-in.
      setCheckEmail(true);
      return;
    }
    router.push("/onboarding");
    router.refresh();
  };

  if (checkEmail) {
    return (
      <div role="status">
        <h1 className="mb-3 text-2xl">Check your email</h1>
        <p className="text-base leading-relaxed">We sent a link to {email}. Open it to confirm your account, then sign in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="mb-1 text-2xl">Plant your orchard</h1>
      <p className="mb-5 text-base text-[var(--px-ink-soft)]">A private place for your thoughts. Only you can see it.</p>
      <FormError message={formError} />
      <Field id="name" label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={60} />
      <Field id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        hint={`At least ${MIN_PASSWORD} characters.`}
      />
      <Field
        id="confirm"
        label="Password again"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />
      <button type="submit" className="px-btn px-btn--primary w-full" disabled={busy}>
        {busy ? "Creating your orchard…" : "Create account"}
      </button>
      <p className="mt-5 text-base">
        Already have one?{" "}
        <Link href="/login" className="px-focus underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const notice = params.get("expired")
    ? "Your session ended. Please sign in again."
    : params.get("reset")
      ? "Your password was changed. Sign in with the new one."
      : params.get("deleted")
        ? "Your account and everything in it were deleted."
        : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setFormError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setFormError(null);
    const { error } = await authClient.signIn.email({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    router.push("/orchard");
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="mb-5 text-2xl">Sign in</h1>
      {notice && (
        <p role="status" className="mb-4 bg-[var(--px-cream)] p-3 text-base">
          {notice}
        </p>
      )}
      <FormError message={formError} />
      <Field id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" className="px-btn px-btn--primary w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <div className="mt-5 flex flex-col gap-2 text-base">
        <Link href="/forgot-password" className="px-focus underline">
          Forgot your password?
        </Link>
        <span>
          New here?{" "}
          <Link href="/register" className="px-focus underline">
            Create an account
          </Link>
        </span>
      </div>
    </form>
  );
}

export function ForgotPasswordForm({ available }: { available: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!available) {
    return (
      <div>
        <h1 className="mb-3 text-2xl">Reset your password</h1>
        <p className="mb-4 text-base leading-relaxed">
          Password reset isn&apos;t available yet: this orchard hasn&apos;t been set up to send email.
        </p>
        <Link href="/login" className="px-btn px-btn--ghost">
          Back to sign in
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setFormError("Enter an email address like you@example.com.");
      return;
    }
    setBusy(true);
    setFormError(null);
    const { error } = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" });
    setBusy(false);
    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div role="status">
        <h1 className="mb-3 text-2xl">Check your email</h1>
        <p className="mb-4 text-base leading-relaxed">
          If an account uses {email}, we&apos;ve sent it a link to reset the password. The link works for an hour.
        </p>
        <Link href="/login" className="px-btn px-btn--ghost">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="mb-2 text-2xl">Reset your password</h1>
      <p className="mb-5 text-base text-[var(--px-ink-soft)]">We&apos;ll email you a link to choose a new one.</p>
      <FormError message={formError} />
      <Field id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit" className="px-btn px-btn--primary w-full" disabled={busy}>
        {busy ? "Sending…" : "Send reset link"}
      </button>
      <p className="mt-5 text-base">
        <Link href="/login" className="px-focus underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token || linkError) {
    return (
      <div>
        <h1 className="mb-3 text-2xl">This link doesn&apos;t work</h1>
        <p className="mb-4 text-base leading-relaxed">It may have expired or already been used. Ask for a new one.</p>
        <Link href="/forgot-password" className="px-btn px-btn--primary">
          Get a new link
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== password) next.confirm = "The two passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    setFormError(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (error) {
      setFormError(authErrorMessage(error));
      return;
    }
    router.push("/login?reset=1");
  };

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="mb-5 text-2xl">Choose a new password</h1>
      <FormError message={formError} />
      <Field
        id="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        hint={`At least ${MIN_PASSWORD} characters. You'll be signed out everywhere else.`}
      />
      <Field
        id="confirm"
        label="New password again"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />
      <button type="submit" className="px-btn px-btn--primary w-full" disabled={busy}>
        {busy ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
