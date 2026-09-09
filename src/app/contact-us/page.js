import React from "react";
import Detail from "./components/Detail";
import Map from "./components/Map";
import Form from "./components/Form";
import { FaAngleRight } from "react-icons/fa";
import CTASection from "./components/Ctasection";
export const metadata = {
  title: "Contact UmrahTech UK | Book Your Hajj & Umrah Package Today",
  description:
    "Contact UmrahTech for Hajj and Umrah packages from the UK. Speak to our travel experts for booking, visa guidance and travel assistance.",
  keywords: [
    "Contact UmrahTech",
    "Umrah Travel Agency Contact",
    "Hajj Package UK Contact",
    "Islamic Travel UK",
  ],
   alternates: {
    canonical: "https://alhijaztours.net/contact-us",
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
            "UmrahTech Contact",
            "Customer Support",
            "Travel Booking Assistance",
            "Hajj & Umrah Inquiries",
            "Contact Phone",
            "Email Address",
            "Travel Office Address",
            "Support Team",
            "Personalized Travel Help",
            "24/7 Support",
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
      <section className="page-title-section contact-bg-page text-center d-flex align-items-center justify-content-center">
        <div className="page-title-overlay"></div>
        <div className="container">
          <h1 className="text-white fw-bold">Contact Us</h1>
        </div>
      </section>
      <div className="container contact-page mb-5 mt-5">
        <div className="row">
          <div className="col-lg-6 mt-3">
            <Form />
          </div>
          <div className="col-lg-6 mt-3">
            <Detail />
          </div>
        </div>
        <div className="row mt-5">
          <div className="col-12">
            <Map />
          </div>
        </div>
      </div>
      <CTASection/>
    </div>
  );
}