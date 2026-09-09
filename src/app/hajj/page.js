import React from "react";
import styles from "./HajjPage.module.css";
import Form from "./components/Form";
import UnderstandingHajj from "./components/UnderstandingHajj";
import PrepareJourney from "./components/PrepareJourney";
import moment from "moment";

export const metadata = {
  title: "Hajj Packages 2027 UK | ATOL Protected Hajj Packages | UmrahTech",
  description:
    "Book Hajj Packages 2027 from the UK with flights, hotels near Haram and professional guidance. ATOL protected and trusted pilgrimage services.",
  keywords: [
    "Hajj Packages UK",
    "Hajj 2027 UK",
    "ATOL Hajj Packages",
    "Hajj Travel Agency UK",
    "Pilgrimage Packages",
  ],
  alternates: {
    canonical: "https://alhijaztours.net/hajj",
  },
};
export default function page() {
  return (
    <>
      {/* <script type="application/ld+json" id="organization-schema">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          name: "UmrahTech",
          url: "https://alhijaztours.net",
          keywords: [
            "Hajj Packages 2027 UK",
            "ATOL Protected Hajj Packages",
            "Makkah and Madinah Hajj Travel",
            "Hajj Pilgrimage from UK",
            "Saudi Arabia Hajj Packages",
            "Masjid al-Haram Accommodation",
            "Licensed Hajj Travel Agency UK",
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
            "description": "Book Hajj Packages UK with UmrahTech. We offer affordable and cheap Hajj deals with flights, visa, hotels near Haram, and complete guidance for a smooth spiritual journey.",
            "brand": {
              "@type": "Brand",
              "name": "Alhijaz tours"
            },
            "offers": {
              "@type": "AggregateOffer",
              "url": "https://alhijaztours.net/hajj",
              "priceCurrency": "GBP",
              "lowPrice": "5000",
              "highPrice": "15000",
              "offerCount": "1"
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
              "name": "Mehrun",
              "reviewBody": "Salaam, We booked our Hajj with Al Hijaz. The whole experience, from the booking process to the logistics and packages, was smooth and efficient. The organisation of transport was done really well. We were guided all the way, and brother Zahid kept in touch with us to keep us updated on any changes to timings, etc. I highly recommend Al Hijaz for all Umrah and Hajj packages as they really go above and beyond. May Allah SWT bless all at Al Hijaz with Barakah. Ameen. JazakAllah Khair again",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5",
                "worstRating": "0"
              },
              "datePublished": "2025-08-07",
              "author": { "@type": "Person", "name": "Muhammad Waqas" }
            }
          })
        }}
      /> */}

      <div className={`min-vh-100  ${styles.hajj}`}>
        {/* Hero */}
        <section className={`py-5 text-center ${styles.hero}`}>
          <div className={styles.overLay}></div>
          <div className={`container ${styles.box}`}>
            <h2 className="display-5 fw-bold text-white mb-4">
              The Sacred Journey of Hajj {moment().add(1, 'year').format('YYYY')}
            </h2>
            <p className="lead text-white mb-3">
              "And proclaim to mankind the Hajj pilgrimage. They will come to you
              on foot and on every lean camel; they will come from every distant
              pass."
            </p>
            <div className="text-warning">- Quran 22:27</div>
          </div>
        </section>
        {/* Interest Form */}
        <section id="prepare" className="py-5">
          <div className={styles.svgbg}>
            <div className="container">
              <UnderstandingHajj />
            </div>
          </div>
          <div className="container mt-5">
            <h3 className="h3 fw-bold text-center mb-4">Express Your Interest</h3>
            <p className="text-center text-muted mb-4">
              Ready to embark on this sacred journey? Let us help you prepare for
              Hajj {moment().add(1, 'year').format('YYYY')}.
            </p>

            <div className="card shadow-sm mx-auto" style={{ maxWidth: "50em" }}>
              <div className="card-body">
                <h5 className="card-title">Hajj {moment().add(1, 'year').format('YYYY')} Registration</h5>
                <p className="card-text text-muted">
                  Fill out this form and our team will contact you with details.
                </p>
                <Form />
              </div>
            </div>
            <PrepareJourney />
          </div>
        </section>
      </div>
    </>

  );
}
