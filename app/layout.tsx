import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gamesroomz Prime Conversion Portal",
  description: "Assess, plan and review legacy game conversions for Gamesroomz Prime.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The dark entry comes first so it wins when it matches; the light colour is the fallback.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#121A22" },
    { color: "#EDF2F7" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
