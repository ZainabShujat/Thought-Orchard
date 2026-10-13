import type { PixelIconName } from "@/components/ui/pixelIcons";

/**
 * Every page a person can visit, in one list: the ⋯ site menu and the
 * Navigation page both read from here, so they never disagree.
 */
export type Audience = "everyone" | "signedIn" | "signedOut";

export interface SiteLink {
  href: string;
  label: string;
  description: string;
  icon: PixelIconName;
  audience: Audience;
  group: "orchard" | "guide" | "account";
}

export const SITE_LINKS: SiteLink[] = [
  { href: "/", label: "Home", description: "The entrance to the forest.", icon: "path", audience: "everyone", group: "guide" },
  {
    href: "/orchard",
    label: "Orchard",
    description: "Walk among your trees, plant a new thought, or tend one.",
    icon: "tree",
    audience: "signedIn",
    group: "orchard",
  },
  {
    href: "/notebook",
    label: "Notebook",
    description: "Every thought you've planted as a list you can search.",
    icon: "journal",
    audience: "signedIn",
    group: "orchard",
  },
  {
    href: "/map",
    label: "Map",
    description: "Your orchard from above. Tap a tree to walk to it.",
    icon: "map",
    audience: "signedIn",
    group: "orchard",
  },
  {
    href: "/about",
    label: "About",
    description: "What Thought Orchard is, and what it isn't.",
    icon: "sprout",
    audience: "everyone",
    group: "guide",
  },
  {
    href: "/how-to-use",
    label: "How to use",
    description: "Planting, caring, growing, and finding your way around.",
    icon: "compass",
    audience: "everyone",
    group: "guide",
  },
  {
    href: "/navigation",
    label: "All pages",
    description: "This list of everywhere you can go.",
    icon: "more",
    audience: "everyone",
    group: "guide",
  },
  {
    href: "/support",
    label: "Support",
    description: "Helplines, if a thought feels heavy to hold alone.",
    icon: "heart",
    audience: "everyone",
    group: "guide",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Your name, reading and motion preferences, password, and account.",
    icon: "gear",
    audience: "signedIn",
    group: "account",
  },
  { href: "/login", label: "Log in", description: "Return to your orchard.", icon: "back", audience: "signedOut", group: "account" },
  {
    href: "/register",
    label: "Sign up",
    description: "Make an account and plant your first thought.",
    icon: "plant",
    audience: "signedOut",
    group: "account",
  },
];

export function linksFor(signedIn: boolean): SiteLink[] {
  return SITE_LINKS.filter((l) => l.audience === "everyone" || l.audience === (signedIn ? "signedIn" : "signedOut"));
}

export const GROUP_TITLES: Record<SiteLink["group"], string> = {
  orchard: "Your orchard",
  guide: "Guides and help",
  account: "Account",
};
