import Link from "next/link";
import { PixelIcon } from "@/components/ui/PixelIcon";

export default function NotFound() {
  return (
    <main className="px-sky-bands safe-x flex min-h-dvh items-center justify-center p-6">
      <div className="px-parchment max-w-sm p-6 text-center">
        <div className="mb-3 flex justify-center">
          <PixelIcon name="path" scale={5} />
        </div>
        <h1 className="mb-2 text-2xl">This path doesn&apos;t lead anywhere</h1>
        <p className="mb-4 text-base">The page you were looking for isn&apos;t here.</p>
        <Link href="/" className="px-btn px-btn--primary">
          Back to the entrance
        </Link>
      </div>
    </main>
  );
}
