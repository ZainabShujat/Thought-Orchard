import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notebook · Thought Orchard" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
