import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://openclaw.cogna8.ai"),
  title: "OpenClaw Portal - Cogna8",
  description: "Self-service portal for OpenClaw agent governance",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "OpenClaw Portal - Cogna8",
    description: "Self-service portal for OpenClaw agent governance",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw Portal - Cogna8",
    description: "Self-service portal for OpenClaw agent governance",
    images: ["/og-image.png"],
  },
  other: {
    "msapplication-TileColor": "#C65A20",
    "theme-color": "#C65A20",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{
        ["--font-sans" as any]: "var(--font-geist-sans)",
        ["--font-mono" as any]: "var(--font-geist-mono)",
      }}
    >
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
