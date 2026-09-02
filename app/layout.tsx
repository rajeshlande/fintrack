import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { APP_NAME, getVersionLabel } from "@/lib/version";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: `${APP_NAME} | Indian Personal Finance`,
  description: "Track your income, UPI expenses, and budgets securely.",
  applicationName: APP_NAME,
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: `${APP_NAME} ${getVersionLabel()}`,
  },
};

export const viewport: Viewport = {
  themeColor: "#eef1f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geist.className} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
