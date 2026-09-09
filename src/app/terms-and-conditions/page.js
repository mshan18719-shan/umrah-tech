import React from "react";
// import styles from "@/components/Legal/LegalPage.module.css";
import styles from "../privacy-policy/privacyAndCondition.module.css";

export const metadata = {
  title: "Terms and Conditions | UmrahTech UK Hajj & Umrah Travel",
  description:
    "Read the terms and conditions of UmrahTech for Hajj and Umrah bookings from the UK. Understand our travel policies, payments and booking rules.",
  keywords: [
    "UmrahTech terms",
    "Hajj Umrah booking policy UK",
    "travel terms and conditions",
    "Islamic travel booking rules",
  ],
  alternates: {
    canonical: "https://alhijaztours.net/terms-and-conditions",
  },
};

export default function page() {
  return (
    <div>
      <section className="page-title-section legal-bg-page text-center d-flex align-items-center justify-content-center">
        <div className="page-title-overlay"></div>
        <div className="container position-relative">
          <h1 className="text-white fw-bold mb-0">Terms and Conditions</h1>
        </div>
      </section>

      <div className={styles.page}>
        <div className={`container ${styles.inner}`}>
          <p className={styles.intro}>
            At UmrahTech, we are committed to providing pilgrims with a safe,
            comfortable, and spiritually enriching journey. Our Hajj and Umrah
            packages are designed to simplify every step of your pilgrimage. These
            Terms and Conditions outline your rights, responsibilities, and our
            services to ensure a smooth and transparent experience.
          </p>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Booking and Confirmation</h2>
            <div className={styles.card}>
              When you book with UmrahTech, your booking is confirmed once payment
              is received and acknowledgment is sent via email. We ask that all
              details you provide, including personal information, passport
              details, and travel preferences, are accurate and complete. Package
              availability is subject to change until confirmation is finalized.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Payment Policy</h2>
            <div className={styles.card}>
              To secure your pilgrimage package, a deposit is required at the time
              of booking. Full payment must be completed before the travel date, as
              per the invoice and package requirements. Payments can be made via
              bank transfer, online portals, or other approved methods. Timely
              payments are crucial to ensure your travel arrangements and visa
              processing.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Cancellation and Refunds</h2>
            <div className={styles.card}>
              We understand that travel plans can change. Cancellations must be
              communicated in writing. Refunds depend on the package type, timing,
              and airline or visa regulations. Some service fees or processing
              charges may apply. For Hajj and Umrah packages, early cancellations
              allow for higher refund percentages, while late cancellations may
              incur higher deductions. If you cancel your booking, any charges
              applied by third-party payment gateways will be the responsibility of
              the customer.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Changes to Packages</h2>
            <div className={styles.card}>
              UmrahTech reserves the right to make changes to itineraries, hotels,
              flights, or ground services if operational circumstances require it.
              We will communicate any major changes promptly and work with you to
              minimize inconvenience. Minor adjustments may occur due to local
              regulations or service providers.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Responsibilities and Liability</h2>
            <div className={styles.card}>
              Pilgrims are responsible for ensuring passports, visas, vaccinations,
              and personal belongings are complete and accurate. UmrahTech is not
              liable for delays, cancellations, or other circumstances outside our
              control, including airline changes, government regulations, or
              unforeseen events. We strongly recommend travel insurance to cover
              unexpected incidents.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Travel Documents and Visa</h2>
            <div className={styles.card}>
              Every pilgrim must carry a valid passport and visa. Our team assists
              with visa processing, but approval is subject to Saudi government
              regulations. Any errors or delays in documentation that affect travel
              are the responsibility of the pilgrim.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Code of Conduct</h2>
            <div className={styles.card}>
              To ensure a peaceful and respectful environment for all pilgrims, we
              request that everyone follows local laws, respects cultural norms,
              and observes proper behavior during travel and within holy sites.
              Disruptive behavior may lead to removal from services without refund.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Ziyarat and Religious Guidance</h2>
            <div className={styles.card}>
              Some of our packages include guided Ziyarat to important Islamic
              sites in Makkah and Madinah. Pilgrims are encouraged to follow
              guidance from our experienced staff for a fulfilling and organized
              spiritual experience.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Privacy and Data Protection</h2>
            <div className={styles.card}>
              We respect your privacy. Personal information collected during
              booking is securely stored and used only to arrange your pilgrimage.
              Data will not be shared with third parties without your consent,
              except where required by law.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Governing Law</h2>
            <div className={styles.card}>
              These Terms and Conditions are governed by the laws of the United
              Kingdom. Any disputes arising from your booking or travel
              arrangements will be resolved under UK jurisdiction.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Your Journey, Our Commitment</h2>
            <div className={styles.card}>
              At UmrahTech, we are working to make your Hajj or Umrah experience
              meaningful and unforgettable. By following these Terms and
              Conditions, both pilgrims and our team can ensure a safe, organized,
              and spiritually rewarding journey.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
