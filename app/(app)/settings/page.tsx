"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/app/AppHeader";
import { useProfile } from "@/components/app/ProfileProvider";
import { PreferenceFields } from "@/components/auth/OnboardingForm";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { authClient, authErrorMessage } from "@/lib/authClient";
import type { Preferences } from "@/types/profile";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `section-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="px-parchment mb-4 p-4 sm:p-6">
      <h2 id={id} className="mb-4 text-xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Status({ message, error }: { message: string | null; error?: boolean }) {
  if (!message) return null;
  return (
    <p role={error ? "alert" : "status"} className={`mt-3 text-base ${error ? "text-[var(--px-danger)]" : ""}`}>
      {message}
    </p>
  );
}

/** Settings (spec 22.2): name, how the orchard looks and moves, and the account. */
export default function SettingsPage() {
  const { profile, updateProfile } = useProfile();

  const [name, setName] = useState(profile.displayName);
  const [nameStatus, setNameStatus] = useState<{ message: string; error?: boolean } | null>(null);

  const [prefs, setPrefs] = useState<Preferences>(profile.preferences);
  const [prefsStatus, setPrefsStatus] = useState<{ message: string; error?: boolean } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<{ message: string; error?: boolean } | null>(null);

  const [sessionsStatus, setSessionsStatus] = useState<{ message: string; error?: boolean } | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameStatus({ message: "Choose a name to show.", error: true });
      return;
    }
    setBusy("name");
    try {
      await updateProfile({ displayName: name.trim() });
      setNameStatus({ message: "Saved." });
    } catch (err) {
      setNameStatus({ message: err instanceof Error ? err.message : "That couldn't be saved.", error: true });
    }
    setBusy(null);
  };

  const savePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("prefs");
    try {
      await updateProfile({ preferences: prefs });
      setPrefsStatus({ message: "Saved." });
    } catch (err) {
      setPrefsStatus({ message: err instanceof Error ? err.message : "That couldn't be saved.", error: true });
    }
    setBusy(null);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 10) {
      setPwStatus({ message: "Use at least 10 characters for the new password.", error: true });
      return;
    }
    setBusy("password");
    const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setBusy(null);
    if (error) {
      setPwStatus({ message: authErrorMessage(error.status === 401 || error.status === 400 ? { ...error, code: "INVALID_PASSWORD" } : error), error: true });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setPwStatus({ message: "Password changed. Other devices were signed out." });
  };

  const signOutOthers = async () => {
    setBusy("sessions");
    const { error } = await authClient.revokeOtherSessions();
    setBusy(null);
    setSessionsStatus(error ? { message: authErrorMessage(error), error: true } : { message: "Signed out everywhere else." });
  };

  const signOut = async () => {
    setBusy("signout");
    await authClient.signOut();
    window.location.assign("/");
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteStatus("Enter your password to confirm.");
      return;
    }
    setBusy("delete");
    const { error } = await authClient.deleteUser({ password: deletePassword });
    if (error) {
      setBusy(null);
      setDeleteStatus(authErrorMessage(error.status === 400 || error.status === 401 ? { ...error, code: "INVALID_PASSWORD" } : error));
      return;
    }
    window.location.assign("/login?deleted=1");
  };

  return (
    <PageShell title="Settings">
      <Section title="Your name">
        <form onSubmit={saveName}>
          <label htmlFor="displayName" className="mb-1 block text-base">
            What the orchard calls you
          </label>
          <input id="displayName" className="px-input mb-3" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="px-btn px-btn--primary" disabled={busy === "name"}>
            {busy === "name" ? "Saving…" : "Save name"}
          </button>
          <Status message={nameStatus?.message ?? null} error={nameStatus?.error} />
        </form>
      </Section>

      <Section title="Look and motion">
        <form onSubmit={savePrefs}>
          <PreferenceFields prefs={prefs} onChange={setPrefs} />
          <button type="submit" className="px-btn px-btn--primary" disabled={busy === "prefs"}>
            {busy === "prefs" ? "Saving…" : "Save preferences"}
          </button>
          <Status message={prefsStatus?.message ?? null} error={prefsStatus?.error} />
        </form>
      </Section>

      <Section title="Account">
        <p className="mb-4 text-base">
          Signed in as <strong>{profile.email}</strong>
        </p>

        <form onSubmit={changePassword} className="mb-6">
          <h3 className="mb-2 text-lg">Change password</h3>
          <label htmlFor="currentPassword" className="mb-1 block text-base">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            className="px-input mb-3"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <label htmlFor="newPassword" className="mb-1 block text-base">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className="px-input mb-1"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-describedby="newPassword-hint"
          />
          <p id="newPassword-hint" className="mb-3 text-sm text-[var(--px-ink-soft)]">
            At least 10 characters.
          </p>
          <button type="submit" className="px-btn px-btn--primary" disabled={busy === "password"}>
            {busy === "password" ? "Changing…" : "Change password"}
          </button>
          <Status message={pwStatus?.message ?? null} error={pwStatus?.error} />
        </form>

        <div className="mb-6 flex flex-wrap gap-3">
          <button type="button" className="px-btn px-btn--ghost" onClick={() => void signOutOthers()} disabled={busy === "sessions"}>
            Sign out of other devices
          </button>
          <button type="button" className="px-btn" onClick={() => void signOut()} disabled={busy === "signout"}>
            <PixelIcon name="back" scale={2} />
            Log out
          </button>
        </div>
        <Status message={sessionsStatus?.message ?? null} error={sessionsStatus?.error} />

        <div className="border-t-4 border-dashed border-[var(--px-parchment-shade)] pt-4">
          <h3 className="mb-2 text-lg">Delete account</h3>
          {!deleting ? (
            <>
              <p className="mb-3 text-base leading-relaxed">
                Permanently deletes your account, your orchard and every thought and watering in it.
              </p>
              <button type="button" className="px-btn px-btn--ghost" onClick={() => setDeleting(true)}>
                <PixelIcon name="remove" scale={2} />
                Delete my account…
              </button>
            </>
          ) : (
            <form onSubmit={deleteAccount}>
              <p className="mb-3 text-base leading-relaxed">
                This can&apos;t be undone. Everything in your orchard will be gone. Enter your password to confirm.
              </p>
              <label htmlFor="deletePassword" className="mb-1 block text-base">
                Password
              </label>
              <input
                id="deletePassword"
                type="password"
                autoComplete="current-password"
                className="px-input mb-3"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              <div className="flex flex-wrap gap-3">
                <button type="button" className="px-btn px-btn--ghost" onClick={() => setDeleting(false)} disabled={busy === "delete"}>
                  Keep my account
                </button>
                <button type="submit" className="px-btn px-btn--danger" disabled={busy === "delete"}>
                  {busy === "delete" ? "Deleting…" : "Delete everything permanently"}
                </button>
              </div>
              <Status message={deleteStatus} error />
            </form>
          )}
        </div>
      </Section>

      <Section title="Help">
        <Link href="/support" className="px-btn px-btn--ghost">
          <PixelIcon name="heart" scale={2} />
          Support and helplines
        </Link>
      </Section>
    </PageShell>
  );
}
