import type { Metadata } from "next";

export const metadata: Metadata = { title: "Your orchard · Thought Orchard" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
