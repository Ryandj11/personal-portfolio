import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ryan Johnson",
  description: "Ryan Johnson's Portfolio",
  manifest: "/redketchup (1)/site.webmanifest",
  icons: {
    icon: [
      { url: "/redketchup (1)/favicon.ico" },
      {
        url: "/redketchup (1)/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/redketchup (1)/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/redketchup (1)/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/redketchup (1)/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/redketchup (1)/apple-touch-icon.png",
    shortcut: "/redketchup (1)/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
