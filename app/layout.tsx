import { Navbar } from "@/components/layout/navbar";
import { clerkAppearance } from "@/components/providers/clerk-appearance";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
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
  title: {
    default: "MindVault AI",
    template: "%s | MindVault AI",
  },
  description:
    "Transform your documents into an intelligent AI assistant. Chat, search, and talk with your personal knowledge using voice-powered AI.",
  keywords: [
    "AI knowledge assistant",
    "RAG",
    "document AI",
    "voice AI",
    "personal knowledge management",
  ],
  authors: [
    {
      name: "MindVault AI",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-screen flex-col font-sans">
        <ClerkProvider afterSignOutUrl="/" appearance={clerkAppearance}>
          <ThemeProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
