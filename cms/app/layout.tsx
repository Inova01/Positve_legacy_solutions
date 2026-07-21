import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: {
      default: "PLS Content Manager",
      template: "%s | PLS Content Manager",
    },
    description:
      "Secure blog publishing and document management for Positive Legacy Solutions.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      title: "PLS Content Manager",
      description: "Publish with clarity.",
      images: [{ url: "/og.png", width: 1672, height: 941 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "PLS Content Manager",
      description: "Publish with clarity.",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}
