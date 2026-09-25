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

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
      <body>{children}</body>
    </html>
  );
}
