import FaqsList from "@/components/Faqs/FaqsList";
export const metadata = {
  title: "Hajj & Umrah FAQs | Travel Guide & Booking Questions | UmrahTech",
  description:
    "Find answers to common Hajj and Umrah travel questions including booking process, visa requirements, flights and accommodation.",
  keywords: [
    "Hajj Umrah FAQs",
    "Umrah Travel Guide UK",
    "Pilgrimage FAQs",
    "Islamic Travel Questions",
  ],
  alternates: {
    canonical: "https://alhijaztours.net/faqs",
  },
};
export default function page() {
  return <FaqsList />;
}
