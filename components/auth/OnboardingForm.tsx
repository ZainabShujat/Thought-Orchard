"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Preferences, Profile } from "@/types/profile";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { cacheFontPreference } from "@/components/app/FontPreferenceCache";

/**
 * Onboarding (first sign-in): what to call you, how the orchard should look
 * and move, and a short, honest explanation of what this place is. Everything
 * is saved to the account profile; the orchard itself was created at sign-up.
 */
export function OnboardingForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.displayName);
  const [prefs, setPrefs] = useState<Preferences>(profile.preferences);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Preview the font choice immediately.
  useEffect(() => {
    document.documentElement.dataset.font = prefs.plainFont ? "plain" : "pixel";
  }, [prefs.plainFont]);

  const finish = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName: name.trim(), preferences: prefs, completeOnboarding: true }),
    });
    if (res.status === 401) {
      window.location.href = "/login?expired=1";
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "That couldn't be saved. Please try again.");
      setBusy(false);
      return;
    }
    cacheFontPreference(prefs.plainFont);
    router.push("/orchard");
    router.refresh();
  };

  const steps = ["Your name", "How it looks", "Your orchard"];

  return (
    <div>
      <ol className="mb-5 flex gap-2 text-sm" aria-label="Onboarding steps">
        {steps.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={`px-2 py-1 ${i === step ? "bg-[var(--px-honey)]" : "bg-[var(--px-cream)]"}`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              setError("Choose a name to show.");
              return;
            }
            setError(null);
            setStep(1);
          }}
        >
          <h1 className="mb-2 text-2xl">Welcome</h1>
          <p className="mb-4 text-base leading-relaxed">What should the orchard call you? Only you will see it.</p>
          <label htmlFor="displayName" className="mb-1 block text-base">
            Name
          </label>
          <input
            id="displayName"
            className="px-input mb-2"
            value={name}
            maxLength={60}
            autoComplete="nickname"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "name-error" : undefined}
          />
          {error && (
            <p id="name-error" role="alert" className="mb-2 text-sm text-[var(--px-danger)]">
              {error}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <button type="submit" className="px-btn px-btn--primary">
              Next
            </button>
          </div>
        </form>
      )}

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
          }}
        >
          <h1 className="mb-4 text-2xl">How it looks</h1>
          <PreferenceFields prefs={prefs} onChange={setPrefs} />
          <p className="mb-4 text-sm text-[var(--px-ink-soft)]">You can change these any time in Settings.</p>
          <div className="flex justify-between">
            <button type="button" className="px-btn px-btn--ghost" onClick={() => setStep(0)}>
              Back
            </button>
            <button type="submit" className="px-btn px-btn--primary">
              Next
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div>
          <h1 className="mb-3 flex items-center gap-2 text-2xl">
            <PixelIcon name="sprout" scale={3} /> Your orchard is ready
          </h1>
          <ul className="mb-5 space-y-2 text-base leading-relaxed">
            <li>· Every thought you plant becomes a tree in a place of its own.</li>
            <li>· Trees grow with time. Watering helps, but nothing wilts if you stay away.</li>
            <li>· It&apos;s private. There are no feeds, likes or followers.</li>
            <li>· The Notebook lists every thought if you&apos;d rather not walk.</li>
          </ul>
          {error && (
            <p role="alert" className="mb-3 text-sm text-[var(--px-danger)]">
              {error}
            </p>
          )}
          <div className="flex justify-between">
            <button type="button" className="px-btn px-btn--ghost" onClick={() => setStep(1)} disabled={busy}>
              Back
            </button>
            <button type="button" className="px-btn px-btn--primary" onClick={() => void finish()} disabled={busy}>
              {busy ? "Opening…" : "Enter the orchard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** The preference controls shared by onboarding and Settings. */
export function PreferenceFields({ prefs, onChange }: { prefs: Preferences; onChange: (p: Preferences) => void }) {
  return (
    <>
      <fieldset className="mb-4">
        <legend className="mb-1 text-base">Text</legend>
        <label className="flex items-center gap-2 text-base">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={prefs.plainFont}
            onChange={(e) => onChange({ ...prefs, plainFont: e.target.checked })}
          />
          Use a plain, easier-to-read font
        </label>
      </fieldset>
      <fieldset className="mb-4">
        <legend className="mb-1 text-base">Motion</legend>
        {(
          [
            ["system", "Follow my device"],
            ["reduce", "Reduce motion"],
            ["full", "Full motion"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-base">
            <input
              type="radio"
              name="motion"
              className="h-5 w-5"
              checked={prefs.motion === value}
              onChange={() => onChange({ ...prefs, motion: value })}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <fieldset className="mb-4">
        <legend className="mb-1 text-base">Open the orchard in</legend>
        {(
          [
            ["immersive", "Immersive view: walk among the trees"],
            ["explorer", "Explorer view: see the orchard from above"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-base">
            <input
              type="radio"
              name="startView"
              className="h-5 w-5"
              checked={prefs.startView === value}
              onChange={() => onChange({ ...prefs, startView: value })}
            />
            {label}
          </label>
        ))}
      </fieldset>
    </>
  );
}
