import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meme AI — Go Viral with Your Face",
  description: "Turn any trending meme into your own viral marketing content.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
