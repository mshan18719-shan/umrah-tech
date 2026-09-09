import React from "react";
// import styles from "@/components/Legal/LegalPage.module.css";
import styles from "./privacyAndCondition.module.css";

export const metadata = {
  title: "Privacy Policy | UmrahTech UK Travel Agency",
  description:
    "UmrahTech respects your privacy. Learn how we collect, use and protect your personal information when booking Hajj and Umrah packages.",
  keywords: [
    "UmrahTech privacy policy",
    "travel data protection UK",
    "Islamic travel privacy",
    "customer information security",
  ],
  alternates: {
    canonical: "https://umrahTech.net/privacy-policy",
  },
};

export default function page() {
  return (
    <div>
      <section className="page-title-section legal-bg-page text-center d-flex align-items-center justify-content-center">
        <div className="page-title-overlay"></div>
        <div className="container position-relative">
          <h1 className="text-white fw-bold mb-0">Privacy and Security Policy</h1>
        </div>
      </section>

      <div className={styles.page}>
        <div className={`container ${styles.inner}`}>
          <p className={styles.intro}>
            Your privacy matters to us. At UmrahTech, we value your trust and
            take the protection of your personal information very seriously. This
            document explains the data we collect, how we use it, and the steps we
            take to safeguard your information.
          </p>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Why We Collect or Process Your Personal Data?
            </h2>
            <div className={styles.card}>
              We cannot help you plan or book the perfect travel tours and
              services without your information. The main purpose of collecting
              personal details is to provide the requested tours or services,
              ensure you receive the best service, or for other purposes for which
              you have given your consent, except where otherwise required by law.
              Your data also helps us improve our services.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              When Do We Collect or Process Your Personal Data?
            </h2>
            <div className={styles.card}>
              We mainly collect information when you provide it directly, such as
              during registration, completing forms, sending emails, or requesting
              travel services. We also collect data from your device, like IP
              address, browser type, and language settings, to ensure a consistent
              user experience. Additionally, we use website analytics and cookies
              to enhance our services and provide the best possible experience.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              What Kinds of Information We Collect?
            </h2>
            <div className={styles.card}>
              We collect the following personal details:
              <ul>
                <li>
                  Reservation Details: Name, email, phone number, passport, and
                  visa information.
                </li>
                <li>
                  Preferences: Nationality, interests, and special requests for
                  meals, accommodation, etc.
                </li>
                <li>Unique Identifiers: Username, account number.</li>
                <li>
                  Billing Information: Credit card details and billing address.
                </li>
              </ul>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>How Do We Use Your Information?</h2>
            <div className={styles.card}>
              <ul>
                <li>
                  Tailor-Made Trips: To design trips that match your preferences
                  and needs.
                </li>
                <li>
                  Website Improvement: To enhance website offerings based on your
                  feedback.
                </li>
                <li>
                  Customer Service: To respond effectively to service requests.
                </li>
                <li>
                  Transaction Processing: Your information is never sold,
                  exchanged, or transferred without consent.
                </li>
                <li>
                  Legal Requirements: In certain cases, we may share data with
                  governmental or other authorities if required by law.
                </li>
              </ul>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              How Do We Protect Your Information?
            </h2>
            <div className={styles.card}>
              Your personal data will never be shared with third parties without
              consent, unless legally required. We have strict procedures in place
              to prevent unauthorized access, misuse, or loss of your data. Only
              authorized personnel and required service providers have access to
              personal information during the course of their work.
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Third-Party Responsibility and Your Responsibility
            </h2>
            <div className={styles.card}>
              Our website may contain links to other sites such as Facebook,
              YouTube, etc. When visiting these sites, your data is governed by
              their privacy policies. UmrahTech is not responsible for data
              protection on these sites.
              <div className={styles.cardNote}>
                With your permission, we may share travel stories, images, and
                reviews on our website or social platforms. Once you submit this
                information, you agree it may be publicly viewed. If you share
                information about other people in your group, it is your
                responsibility to ensure they are aware and have accepted our
                privacy policy.
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>How to Contact Us?</h2>
            <div className={styles.card}>
              Your privacy is crucial to us. If you have any questions or concerns
              about our privacy practices, please contact us at:{" "}
              <a href="mailto:info@umrahTech.com">info@umrahTech.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
