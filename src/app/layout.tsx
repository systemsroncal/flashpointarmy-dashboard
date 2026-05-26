import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Barlow } from "next/font/google";
import { MaintenanceBannerGate } from "@/components/MaintenanceBannerGate";
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
  title: "FlashPoint Army Command Center",
  description: "FlashPOINT F.P. Army dashboard",
  icons: {
    icon: [{ url: "/favicon-fp-army.png", type: "image/png" }],
    apple: [{ url: "/favicon-fp-army.png", type: "image/png" }],
  },
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
          <AppProviders>
            <MaintenanceBannerGate />
            {children}
          </AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
