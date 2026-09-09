import React from "react";
import { FaAngleRight } from "react-icons/fa";
import SectionOne from "@/components/AboutUs/SectionOne";
import SectionTwo from "@/components/AboutUs/SectionTwo";
import SectionThree from "@/components/AboutUs/SectionThree";
import SectionFour from "@/components/AboutUs/SectionFour";
import FaqSection from "@/components/Home/HomeFaq/Faqsection";
import SectionFive from "@/components/AboutUs/SectionFive";
import SectionSix from "@/components/AboutUs/SectionSix";
import SectionSeven from "@/components/AboutUs/SectionSeven";

export const metadata = {
  title: "About UmrahTech | Trusted Hajj & Umrah Travel Agency UK",
  description:
    "UmrahTech is a UK based trusted Hajj and Umrah travel agency offering ATOL protected pilgrimage packages with expert guidance and reliable services.",
  keywords: [
    "UmrahTech",
    "About Us",
    "Hajj and Umrah Travel Agency UK",
    "ATOL Protected Travel",
    "Islamic Travel UK",
  ],
   alternates: {
    canonical: "https://alhijaztours.net/about-us",
  },
};
export default function page() {
  return (
    <div>
      {/* <script type="application/ld+json" id="organization-schema">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          name: "UmrahTech",
          url: "https://alhijaztours.net",
          keywords: [
            "UmrahTech",
            "Hajj & Umrah Travel Packages",
            "Pilgrimage Tour Operator",
            "UK Travel Agency",
            "Hotel Booking Services",
            "Flight Arrangements",
            "Airport Transfers",
            "Customer Support",
            "Customized Tours",
            "Spiritual Travel Services",
          ],
        })}
      </script> */}
      {/* <script type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": "Alhijaz tours",
            "image": "https://alhijaztours.net/_next/image?url=%2Fimages%2Flogo.png&w=256&q=75",
            "description": "Book trusted Hajj & Umrah Packages from the UK with ATOL protection. Affordable Umrah & Hajj packages with expert Islamic travel support.",
            "brand": {
              "@type": "Brand",
              "name": "Alhijaz tours"
            },
            "offers": {
              "@type": "AggregateOffer",
              "url": "https://alhijaztours.net/",
              "priceCurrency": "GBP",
              "lowPrice": "1000",
              "highPrice": "2500",
              "offerCount": "2"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5",
              "bestRating": "5",
              "worstRating": "0",
              "ratingCount": "1",
              "reviewCount": "1"
            },
            "review": {
              "@type": "Review",
              "name": "Tayyeba Ali",
              "reviewBody": "I went with Alhijaz Tours in August 2025, and my experience was good, smooth, and memorable. The trip was well-organized, and everything went perfectly from start to finish. The team was professional and attentive, ensuring that all our needs were met throughout the journey.",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5",
                "worstRating": "0"
              },
              "datePublished": "2025-12-01",
              "author": { "@type": "Person", "name": "Muhammad Waqas" }
            }

          }),
        }}
      /> */}
      <section className="page-title-section about-bg-page text-center d-flex align-items-center justify-content-center">
        <div className="page-title-overlay"></div>
        <div className="container">
          <h1 className="text-white fw-bold">About Us</h1>
        </div>
      </section>
      <SectionSeven/>
      {/* <SectionThree /> */}
      {/* <SectionTwo /> */}
      <SectionFour/>
      <SectionFive/>
      <SectionSix/>
      {/* <SectionOne /> */}
      <FaqSection/>
    </div>
  );
}
