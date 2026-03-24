import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Family Tree",
  description: "Modern family tree visualization",
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    title: "FamilyTree",
    capable: true,
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Family Tree",
    description: "Modern family tree visualization",
    url: "https://familytree-management.netlify.app", // Adjust if needed
    siteName: "FamilyTree",
    images: [
      {
        url: "/images/main-page.png",
        width: 1200,
        height: 630,
        alt: "Family Tree Graph Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Family Tree",
    description: "Modern family tree visualization",
    images: ["/images/main-page.png"],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} antialiased bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 min-h-screen selection:bg-indigo-500/20 selection:text-indigo-500`}>
        {children}
      </body>
    </html>
  );
}
