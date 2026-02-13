import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
    default: "ResumeMate AI — Tailor your resume to any job instantly",
    template: "%s | ResumeMate AI",
  },
  description:
    "Upload your resume + paste a job description. Get ATS match scores, missing keywords, and a tailored rewrite pack. Privacy-first, no signup required.",
  keywords: ["ResumeMate AI", "ATS score", "resume optimizer", "job application", "resume keywords", "cover letter generator", "ATS-friendly resume"],
  authors: [{ name: "ResumeMate AI" }],
  openGraph: {
    title: "ResumeMate AI — Tailor your resume to any job instantly",
    description:
      "Get ATS match scores, missing keywords, and a tailored rewrite pack. Privacy-first, no signup required.",
    type: "website",
    url: "https://resumemate.ai",
    siteName: "ResumeMate AI",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeMate AI — Tailor your resume to any job instantly",
    description: "Get ATS match scores, missing keywords, and a tailored rewrite pack.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
