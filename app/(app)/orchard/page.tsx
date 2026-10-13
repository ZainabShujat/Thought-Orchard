"use client";

import dynamic from "next/dynamic";
import { OrchardLoading } from "@/components/orchard/OrchardView";

// The orchard reads per-tab position and runs WebGL, so it renders on the client only.
const OrchardView = dynamic(() => import("@/components/orchard/OrchardView").then((m) => m.OrchardView), {
  ssr: false,
  loading: OrchardLoading,
});

export default function OrchardPage() {
  return <OrchardView />;
}
