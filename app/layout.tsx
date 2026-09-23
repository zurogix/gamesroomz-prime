import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gamesroomz Prime Conversion Portal",
  description: "Assess, plan and review legacy game conversions for Gamesroomz Prime.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
