import type { Metadata, Viewport } from "next";
import { Pixelify_Sans } from "next/font/google";
import { FontPreferenceCache } from "@/components/app/FontPreferenceCache";
import "./globals.css";

// Self-hosted at build time, so the app works offline (spec 18.7).
const pixelFont = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thought Orchard",
  description: "A personal landscape where every thought becomes a tree.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#7a4a26",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variable must be on <html> so :root's --font-ui can resolve it.
    <html lang="en" data-font="pixel" className={pixelFont.variable} suppressHydrationWarning>
      <body>
        <FontPreferenceCache />
        {children}
      </body>
    </html>
  );
}
