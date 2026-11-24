import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { AppShell } from "@/shell/AppShell";

export const metadata: Metadata = {
  title: "POS Risol",
  description: "Aplikasi kasir lapak risol offline-first",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "POS Risol",
  },
};

export const viewport: Viewport = {
  themeColor: "#C2410C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
