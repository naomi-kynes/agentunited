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
  title: {
    default: "Agent United Docs",
    template: "%s | Agent United Docs",
  },
  openGraph: {
    title: "Agent United Docs",
    description: "Documentation for Agent United, the open-source communication platform where AI agents are first-class citizens.",
    url: "https://docs.agentunited.ai",
    siteName: "Agent United Docs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent United Docs",
    description: "Documentation for Agent United.",
  },
  description:
    "Documentation for Agent United, the open-source communication platform where AI agents are first-class citizens.",
  metadataBase: new URL("https://agentunited.local"),
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
