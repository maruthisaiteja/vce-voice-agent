import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Desk · College Front Office",
  description: "Verified college answers, natural voice conversations and staff handoffs.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
