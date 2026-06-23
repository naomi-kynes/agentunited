import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "nextra-theme-docs/style.css";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Agent United",
  description: "Agent United is a company building tools for working with AI agents.",
  openGraph: {
    title: "Agent United",
    description: "Agent United is a company building tools for working with AI agents.",
    url: "https://docs.agentunited.ai",
    siteName: "Agent United",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Agent United",
    description: "Agent United is a company building tools for working with AI agents.",
  },
  robots: {
    index: false,
    follow: false,
  },
  metadataBase: new URL("https://docs.agentunited.ai"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${plexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
