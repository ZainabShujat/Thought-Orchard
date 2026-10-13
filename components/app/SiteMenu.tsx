"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { linksFor } from "@/features/site/siteLinks";

/**
 * The ⋯ button in the top bar: opens a list of every page (About, How to use,
 * All pages, Support, and the orchard pages when signed in).
 */
export function SiteMenu({ signedIn, align = "right" }: { signedIn: boolean; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        className="px-btn px-btn--ghost px-2 py-1"
        aria-label="Menu: all pages"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        <PixelIcon name="more" scale={2} />
      </button>
      {open && <MenuPanel signedIn={signedIn} pathname={pathname} align={align} onClose={() => setOpen(false)} />}
    </div>
  );
}

function MenuPanel({
  signedIn,
  pathname,
  align,
  onClose,
}: {
  signedIn: boolean;
  pathname: string;
  align: "left" | "right";
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="All pages"
      className={`px-parchment px-rise absolute top-full z-50 mt-2 flex max-h-[75dvh] w-64 max-w-[calc(100vw-2rem)] flex-col gap-1 overflow-y-auto p-3 ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      <ul className="flex flex-col gap-1">
        {linksFor(signedIn).map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`px-btn w-full justify-start! px-2 py-1 text-base ${
                pathname === link.href ? "px-btn--primary" : "px-btn--ghost"
              }`}
              onClick={onClose}
            >
              <PixelIcon name={link.icon} scale={2} />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <button type="button" className="px-btn px-btn--ghost mt-1 justify-center px-2 py-1 text-sm" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
