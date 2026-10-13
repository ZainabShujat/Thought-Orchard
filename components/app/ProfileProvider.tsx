"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Preferences, Profile } from "@/types/profile";
import { DEFAULT_PREFERENCES } from "@/types/profile";
import { cacheFontPreference } from "@/components/app/FontPreferenceCache";

/**
 * The signed-in user's profile and preferences, loaded on the server and kept
 * in sync with MongoDB (the source of truth). The browser only caches the font
 * choice so public pages can match it before sign-in.
 */
interface ProfileContextValue {
  profile: Profile;
  updateProfile: (patch: { displayName?: string; preferences?: Partial<Preferences> }) => Promise<Profile>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ initial, children }: { initial: Profile; children: React.ReactNode }) {
  const [profile, setProfile] = useState(initial);

  useEffect(() => {
    document.documentElement.dataset.font = profile.preferences.plainFont ? "plain" : "pixel";
    cacheFontPreference(profile.preferences.plainFont);
  }, [profile.preferences.plainFont]);

  const updateProfile = useCallback(async (patch: { displayName?: string; preferences?: Partial<Preferences> }) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const body = await res.json().catch(() => null);
    if (res.status === 401) window.location.href = "/login?expired=1";
    if (!res.ok) throw new Error(body?.error?.message ?? "Your settings couldn't be saved.");
    setProfile(body.profile);
    return body.profile as Profile;
  }, []);

  return <ProfileContext.Provider value={{ profile, updateProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfile must be used inside ProfileProvider");
  return value;
}

/** Preferences when signed in; defaults on public pages. */
export function usePreferences(): Preferences {
  return useContext(ProfileContext)?.profile.preferences ?? DEFAULT_PREFERENCES;
}
