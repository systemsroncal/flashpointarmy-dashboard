import type { Metadata } from "next";
import { APP_DISPLAY_NAME, APP_SHORT_NAME, DEFAULT_SHARE_META_IMAGE } from "@/lib/site/app-branding";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Barlow, Konkhmer_Sleokchher } from "next/font/google";
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

const konkhmerSleokchher = Konkhmer_Sleokchher({
  weight: "400",
  subsets: ["latin", "khmer"],
  display: "swap",
  variable: "--font-konkhmer-sleokchher",
});

export const metadata: Metadata = {
  title: {
    default: APP_SHORT_NAME,
    template: `%s | ${APP_SHORT_NAME}`,
  },
  description: APP_DISPLAY_NAME,
  openGraph: {
    siteName: APP_DISPLAY_NAME,
    images: [{ url: DEFAULT_SHARE_META_IMAGE }],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_SHARE_META_IMAGE],
  },
  icons: {
    icon: [{ url: "/favicon-fp-army.png", type: "image/png" }],
    apple: [{ url: "/favicon-fp-army.png", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlow.className} ${konkhmerSleokchher.variable}`}>
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
