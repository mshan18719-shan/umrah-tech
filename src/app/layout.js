import "bootstrap/dist/css/bootstrap.min.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "yet-another-react-lightbox/styles.css";
import BootstrapClient from "@/components/BootstrapClient";
import ScrollTop from "@/components/ScrollTop/ScrollTop";
import "./globals.css";
import "./mediaquery.css";
import "swiper/css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import LayoutVisibility from "@/components/LayoutVisibility";
import { MantineProvider } from "@mantine/core";
import { CurrencyProvider } from "@/util/currency";
import { PackageCategoriesProvider } from "@/contexts/PackageCategoriesContext";
import { Notifications } from "@mantine/notifications";
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";
import VipCookieConsent from "@/components/CookieConsent";

export const metadata = {
  metadataBase: new URL("https://umrahtech.net"),
  title: "Umrah Tech",
  description:
    "Book ATOL-protected Umrah Packages 2026 from the UK with flights, 5★–3★ hotels & transport included. Trusted Hajj & Umrah travel experts.",
  keywords: [
    "Pilgrimage to Makkah",
    "Umrah visa process UK",
    "Flights to Jeddah",
    "Hotels near Haram",
    "Islamic Travel Agency UK",
    "Affordable Umrah packages from UK",
    "Luxury Umrah packages UK",
    "Islamic travel services",
    "Umrah packages with hotels",
    "Family Umrah packages UK",
    "Group Hajj packages UK ",
    "Trusted Hajj Umrah agents UK ",
    "Islamic pilgrimage travel UK",
    "Religious journey to Madinah",
  ],
  icons: {
    icon: "/images/navlogo.png",
  },
   alternates: {
    canonical: "https://alhijaztours.net",
  },
  // verification: {
  //   google: "google77d305b7f6f43da9",
  // },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* <link rel="preconnect" href="https://www.googletagmanager.com" /> */}
        {/* <link rel="dns-prefetch" href="https://www.googletagmanager.com" /> */}
        {/* <meta name="google-site-verification" content="LrPi-9aOkjsL7aVkJs-j4E9ChWyOya5A_bFRMlXZZeU" />
        <meta name="author" content="UmrahTech" /> */}
        
        {/* GTM / GA4 Head Script */}
        {/* <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-L0YZJET5XE"
          strategy="lazyOnload"
        /> */}

        {/* <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-L0YZJET5XE');
          `}
        </Script> */}
      </head>
      <body id="scrool">
        <SpeedInsights />
        <Analytics />
        <VipCookieConsent/>
        <CurrencyProvider>
          <PackageCategoriesProvider>
          <BootstrapClient />
          <MantineProvider>
            <NextTopLoader height={3} crawl={true} showSpinner={false} />
            <Notifications position="top-right" />
            <LayoutVisibility>{children}</LayoutVisibility>
          </MantineProvider>
          </PackageCategoriesProvider>
        </CurrencyProvider>
        <ScrollTop />
      </body>
    </html>
  );
}
