import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeSync from "@/components/theme/ThemeSync";
import { PRODUCTION_SITE_ORIGIN } from "@/lib/seo/site";
import "./globals.css";
import "./theme-compat.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeBootstrapScript = `
(function () {
  try {
    var stored = localStorage.getItem("divlab-theme");
    var preference = stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "dark";
    var resolved = preference === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preference;
    var root = document.documentElement;
    root.dataset.theme = resolved;
    root.dataset.themePreference = preference;
    root.style.colorScheme = resolved;
  } catch (_) {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.dataset.themePreference = "dark";
    document.documentElement.style.colorScheme = "dark";
  }
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(PRODUCTION_SITE_ORIGIN),
  title: {
    default: "DivLab | Börsnyheter, utbildning och ekonomisk frihet",
    template: "%s | DivLab",
  },
  description:
    "DivLab är den svenska plattformen för börsnyheter, utbildning, Frihetsmaskinen och community kring långsiktigt sparande.",
  openGraph: {
    siteName: "DivLab",
    locale: "sv_SE",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeSync />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
