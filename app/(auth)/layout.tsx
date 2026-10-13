import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUser } from "@/server/auth/session";
import { PixelIcon } from "@/components/ui/PixelIcon";

export const dynamic = "force-dynamic";

/** Sign-in and account recovery pages. Already signed in? Go to the orchard. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getServerUser()) redirect("/orchard");
  return (
    <main className="px-sky-bands safe-top safe-bottom safe-x flex min-h-dvh flex-col items-center justify-center gap-6 py-8">
      <Link href="/" className="px-wood px-focus flex items-center gap-3 px-5 py-3">
        <PixelIcon name="tree" scale={4} />
        <span className="text-2xl">Thought Orchard</span>
      </Link>
      <div className="px-parchment w-full max-w-md p-6">{children}</div>
      <Link href="/support" className="px-focus text-base underline">
        Support
      </Link>
    </main>
  );
}
