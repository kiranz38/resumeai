import type { Metadata } from "next";
import Script from "next/script";
import { Caveat, Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-SCPE35TW20";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://resumemate.ai"),
  title: {
    default: "ResumeMate AI — Tailor Your Resume to Any Job Description",
    template: "%s | ResumeMate AI",
  },
  description:
    "Upload your resume + paste a job description. Get your Match Score, see what's blocking callbacks, and fix it in minutes. Free instant analysis — no signup required.",
  keywords: [
    "ResumeMate AI", "resume optimizer", "resume score", "resume match score",
    "tailor resume to job description", "ATS resume checker", "resume keywords",
    "cover letter generator", "resume builder AI", "job application optimizer",
    "resume analysis", "CV optimizer", "resume tailoring tool",
  ],
  authors: [{ name: "ResumeMate AI" }],
  alternates: {
    canonical: "https://resumemate.ai",
  },
  openGraph: {
    title: "ResumeMate AI — Tailor Your Resume to Any Job Description",
    description:
      "Get your Match Score, see what's blocking callbacks, and fix it in minutes. Free instant analysis — no signup required.",
    type: "website",
    url: "https://resumemate.ai",
    siteName: "ResumeMate AI",
    locale: "en_US",
    images: [
      {
        url: "https://resumemate.ai/api/og",
        width: 1200,
        height: 630,
        alt: "ResumeMate AI — Match Score 47 → 84",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeMate AI — Tailor Your Resume to Any Job Description",
    description: "Get your Match Score, see what's blocking callbacks, and fix it in minutes.",
    images: ["https://resumemate.ai/api/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-icon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "ResumeMate AI",
              url: "https://resumemate.ai",
              description: "Upload your resume + paste a job description. Get your Match Score, see what's blocking callbacks, and fix it in minutes.",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: [
                { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free Quick Scan" },
                { "@type": "Offer", price: "5", priceCurrency: "USD", name: "Pro" },
                { "@type": "Offer", price: "10", priceCurrency: "USD", name: "Career Pass" },
              ],
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "320",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${caveat.variable} ${inter.variable} antialiased flex min-h-screen flex-col overflow-x-hidden font-sans`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
