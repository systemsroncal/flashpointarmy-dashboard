import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Barlow } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";
import "plyr/dist/plyr.css";

const barlow = Barlow({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "FlashPOINT · DreamsTrack",
  description: "FlashPOINT F.P. Army dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlow.className}`}>
      <body>
        <AppRouterCacheProvider options={{ key: "css" }}>
          <AppProviders>{children}</AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
