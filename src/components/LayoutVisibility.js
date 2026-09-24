"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer/Footer";
import IslamicHeader from "./Header/IslamicHeader";

export default function LayoutVisibility({ children }) {
  const pathname = usePathname() || "";

  // Hide chrome on voucher & invoice pages (must match SSR + client)
  const hideLayout =
    pathname.includes("/voucher/") ||
    pathname.includes("/invoice/") ||
    pathname.endsWith("/voucher") ||
    pathname.endsWith("/invoice");

  return (
    <>
      {!hideLayout && <IslamicHeader />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}
