import type { Metadata } from "next";

export const metadata: Metadata = { title: "Map · Thought Orchard" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
