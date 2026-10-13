import { PixelIcon } from "@/components/ui/PixelIcon";

export default function Loading() {
  return (
    <div className="px-sky-bands flex min-h-dvh flex-col items-center justify-center gap-4" role="status">
      <span className="px-bob">
        <PixelIcon name="sprout" scale={6} />
      </span>
      <p className="text-lg">Loading…</p>
    </div>
  );
}
