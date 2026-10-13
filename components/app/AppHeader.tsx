"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PixelIcon } from "@/components/ui/PixelIcon";
import type { PixelIconName } from "@/components/ui/pixelIcons";

const LINKS: { href: string; label: string; icon: PixelIconName }[] = [
  { href: "/orchard", label: "Orchard", icon: "tree" },
  { href: "/notebook", label: "Notebook", icon: "journal" },
  { href: "/map", label: "Map", icon: "map" },
  { href: "/settings", label: "Settings", icon: "gear" },
];

/** Shared navigation for the signed-in pages other than the 3D orchard. */
export function AppHeader({ title }: { title: string }) {
  const pathname = usePathname();
  return (
    <header className="safe-top safe-x sticky top-0 z-30 pb-3">
      <div className="px-wood flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <h1 className="flex items-center gap-2 text-lg leading-tight">
          <PixelIcon name="tree" scale={3} />
          {title}
        </h1>
        <nav aria-label="Main">
          <ul className="flex flex-wrap gap-1">
            {LINKS.map((link) => {
              const current = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={`px-btn px-2 py-1 text-sm ${current ? "px-btn--primary" : "px-btn--ghost"}`}
                  >
                    <PixelIcon name={link.icon} scale={2} />
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

/** The parchment page body used by Notebook, Map and Settings. */
export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-sky-bands min-h-dvh">
      <AppHeader title={title} />
      <main id="main" className="safe-x mx-auto w-full max-w-3xl">
        {children}
      </main>
      <footer className="safe-bottom py-4 text-center">
        <Link href="/support" className="px-focus text-base underline">
          Support
        </Link>
      </footer>
    </div>
  );
}
