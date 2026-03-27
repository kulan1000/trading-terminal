import type { Metadata } from "next";
import "./globals.css";
import { TerminalNav } from "@/components/terminal-nav";

export const metadata: Metadata = {
  title: "Trading Terminal",
  description: "Bloomberg-lite trading terminal for commodities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-terminal-bg antialiased">
        <TerminalNav />
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
