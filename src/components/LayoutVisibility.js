"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer/Footer";
import IslamicHeader from "./Header/IslamicHeader";

export default function LayoutVisibility({ children }) {
  const pathname = usePathname();
  // get last part of url
  const lastSegment = pathname?.split("/")

  // hide layout on voucher & invoice pages
  const hideLayout = lastSegment && (lastSegment.includes("voucher") || lastSegment.includes("invoice"));

  return (
    <>
      {!hideLayout && <IslamicHeader />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}
