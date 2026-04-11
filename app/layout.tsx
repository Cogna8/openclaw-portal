import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
