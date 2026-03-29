import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { LoadingScreen } from "@/components/loading-screen";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Trading Terminal",
  description: "Bloomberg-lite trading terminal for Gold, Silver & Oil",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-tv-bg font-sans antialiased">
        <LoadingScreen />
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
