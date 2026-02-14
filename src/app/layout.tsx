import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: {
    default: "ResumeMate AI — Hiring Manager Radar for your resume",
    template: "%s | ResumeMate AI",
  },
  description:
    "Upload your resume + paste a job description. Get your Radar Score, see what's blocking callbacks, and fix it in minutes. Privacy-first, no signup required.",
  keywords: ["ResumeMate AI", "Radar Score", "resume optimizer", "job application", "resume keywords", "cover letter generator", "hiring manager radar", "resume signal"],
  authors: [{ name: "ResumeMate AI" }],
  openGraph: {
    title: "ResumeMate AI — Hiring Manager Radar for your resume",
    description:
      "Get your Radar Score, see what's blocking callbacks, and fix it in minutes. Privacy-first, no signup required.",
    type: "website",
    url: "https://resumemate.ai",
    siteName: "ResumeMate AI",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeMate AI — Hiring Manager Radar for your resume",
    description: "Get your Radar Score, see what's blocking callbacks, and fix it in minutes.",
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
        className={`${caveat.variable} antialiased flex min-h-screen flex-col font-sans`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
