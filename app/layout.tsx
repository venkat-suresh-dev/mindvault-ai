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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
