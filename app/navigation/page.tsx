import type { Metadata } from "next";
import Link from "next/link";
import { getServerUser } from "@/server/auth/session";
import { InfoPage } from "@/components/app/InfoPage";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { GROUP_TITLES, SiteLink, linksFor } from "@/features/site/siteLinks";

export const metadata: Metadata = { title: "All pages · Thought Orchard" };
export const dynamic = "force-dynamic";

/** Navigation: every page, grouped, with a line about each. Public. */
export default async function NavigationPage() {
  const user = await getServerUser().catch(() => null);
  const links = linksFor(Boolean(user));
  const groups = (["orchard", "guide", "account"] as const)
    .map((g) => ({ group: g, links: links.filter((l) => l.group === g) }))
    .filter((g) => g.links.length > 0);

  return (
    <InfoPage title="All pages" icon="more" signedIn={Boolean(user)}>
      {groups.map(({ group, links }) => (
        <section key={group} className="mb-6 last:mb-0">
          <h2 className="mb-2 text-xl">{GROUP_TITLES[group]}</h2>
          <ul className="flex flex-col gap-2">
            {links.map((link) => (
              <PageLink key={link.href} link={link} />
            ))}
          </ul>
        </section>
      ))}
      {!user && (
        <p className="mt-4 text-sm text-[var(--px-ink-soft)]">Log in to see your Orchard, Notebook, Map and Settings.</p>
      )}
    </InfoPage>
  );
}

function PageLink({ link }: { link: SiteLink }) {
  return (
    <li>
      <Link href={link.href} className="px-btn px-btn--ghost w-full justify-start! gap-3 px-3 py-2 text-left">
        <PixelIcon name={link.icon} scale={3} />
        <span className="flex flex-col">
          <span className="text-lg leading-tight">{link.label}</span>
          <span className="text-sm leading-snug text-[var(--px-ink-soft)]">{link.description}</span>
        </span>
      </Link>
    </li>
  );
}
