import dynamic from 'next/dynamic';
const Index = dynamic(() => import('@/components/Home/Index'));
export default async function Home() {
  return (
    <div>
      {/* <script type="application/ld+json" id="organization-schema">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          name: "UmrahTech",
          url: "https://alhijaztours.net",
          keywords: [
            "Makkah",
            "Madinah",
            "Masjid al-Haram",
            "Masjid an-Nabawi",
            "Jeddah (King Abdulaziz International Airport)",
            "Ministry of Hajj and Umrah (Saudi Arabia)",
            "ATOL Protection UK",
          ],
        })}
      </script> */}
      {/* <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Alhijaz tours",
            "url": "https://alhijaztours.net/",
            "logo": "https://alhijaztours.net/_next/image?url=%2Fimages%2Flogo.png&w=256&q=75",
            contactPoint: {
              "@type": "ContactPoint",
              "telephone": "0121 777 2522",
              "contactType": "sales",
              "areaServed": "GB",
              "availableLanguage": "en",
            },
            "sameAs": [
              "https://www.instagram.com/alhijaz.tours/",
              "https://alhijaztours.net/",
              "https://www.facebook.com/alhijaztoursbirmingham",
              "https://twitter.com/alhijaztours2",
              "https://www.sitejabber.com/",
              "https://www.callupcontact.com/b/businessprofile/Alhijaz_Tours/9934347",
              "https://www.brownbook.net/business/54697410/alhijaz-tours",
              "https://getyoufoud.co.uk/listings/al-hijaz-tours/birmingham/travel-agency",
              "https://www.producthunt.com/products/al-hijaz-tours?launch=al-hijaz-tours",
              "https://www.saashub.com/hajj-and-umrah-packages-alternatives"
            ]
          }),
        }}
      /> */}
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
      {/* <script type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [{
              "@type": "Question",
              "name": "Are children to be given a separate visa for Hajj or Umrah?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, each child should have their own visa. Every child must have an authentic passport and a visa application in accordance with Saudi regulations."
              }
            }, {
              "@type": "Question",
              "name": "What Ziyarat are there in your packages?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our Ziyarat typically includes tours of major Islamic and historical sites in Makkah and Madinah. This can be Jabal al-Noor, Jabal al-Thawr, Mina, Muzdalifah, and Arafat in Makkah. Madinah Ziyarat commonly encompasses Masjid Quba, Masjid Qiblatain, Jannat al-Baqi, and Uhud, but the places can vary according to the packages."
              }
            }, {
              "@type": "Question",
              "name": "What are the things to do before going to Umrah?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You must take your passport and your visa papers, visit the orientation programs, learn the rituals of Umrah, pack the right clothes, and take the necessary vaccinations before travelling."
              }
            }, {
              "@type": "Question",
              "name": "Do you include accommodations in the packages?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Our hotels are in strategic locations, close to the Haram in Makkah and Madinah, and are either comfortable or premium, depending on the package that you have chosen."
              }
            }, {
              "@type": "Question",
              "name": "What is the booking procedure for my Hajj or Umrah package?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Booking is easy; make a call to UmrahTech on our site, by phone, or at the office. Your pilgrimage planning will be easy, as our advisors will be directing you through the whole process."
              }
            }]
          }),
        }}
      /> */}
      <Index/>
    </div>
  );
}
