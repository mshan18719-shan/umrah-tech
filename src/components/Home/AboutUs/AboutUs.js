'use client';

import moment from 'moment';
import { Playfair_Display } from 'next/font/google';
import styles from './aboutUs.module.css';
import Link from 'next/link';
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const hajjYear = moment().add(1, 'year').format('YYYY');

export default function AboutUs() {
  return (
    <section className={styles.section}>
      <div className={`${styles.container} container`}>
        <header className={styles.header}>
          <h2 className={`${styles.title} ${playfair.className}`}>
            <span className={styles.titleLine}>UmrahTech</span>
            <span className={styles.titleAccent}>Your Trusted Hajj & Umrah Travel Partner</span>
          </h2>
        </header>

        <div className={styles.contentCard}>
          {/* <span className={styles.badge}>UmrahTech</span> */}

          <div className={styles.body}>
            <p>
              Performing Umrah is more than booking flights and hotels; it is a deeply spiritual experience that stays with you for a lifetime. At UmrahTech, we understand the significance of this sacred journey and are committed to helping pilgrims travel with complete peace of mind, comfort, and confidence.
            </p>
            <p>
              As one of the UK&apos;s <Link href="/">best Umrah travel agency</Link>, we provide carefully planned pilgrimage packages designed around your individual requirements. Whether you are travelling alone, with family, as a couple, or in a large group, our experienced team works closely with you to create a journey that aligns with your preferences, budget, and travel expectations.
            </p>
            <p>
              From visa assistance and flight arrangements to premium accommodation and ground transportation, every aspect of your pilgrimage is managed with professionalism and care through our hajj and umrah services. Our mission is simple: to allow you to focus entirely on your worship while we take care of the logistics.
            </p>
            <h3 className={styles.servicesHeading}>An Award of Trust: ATOL Protection You Can Rely On</h3>
            <p>
              When you book with UmrahTech, your journey is backed by a UK government regulated financial protection scheme designed to keep your travel arrangements secure from the moment of booking. This ensures your payments are safeguarded, and your pilgrimage plans are handled through a fully compliant and responsible travel provider.
            </p>
            <p>
              This protection gives you complete confidence throughout your booking process, knowing your arrangements are managed with accountability and care. In the unlikely event of airline or travel disruption, your booking remains financially protected, and you receive the necessary support under the ATOL framework.
            </p>
            <h3 className={styles.servicesHeading}>Why This Matters for You</h3>
            <ul className={styles.servicesList}>
              <li>Full financial protection under UK ATOL regulations</li>
              <li>Booking security with a trusted and regulated provider</li>
              <li>Protection in case of airline or travel disruption</li>
              <li>Greater confidence when planning your pilgrimage</li>
            </ul>
            <p>
              With UmrahTech, you can book ATOL-protected packages with complete peace of mind, knowing your journey is secure, well-managed, and supported at every stage.
            </p>
            <h3 className={styles.servicesHeading}>Why Thousands of Pilgrims Choose UmrahTech</h3>
            <p>
              Choosing the right travel partner for Umrah or Hajj is one of the most important decisions you will make. At UmrahTech, we have built our reputation on transparency, reliability, and exceptional customer service as trusted travel experts.
            </p>
            <h3 className={styles.servicesHeading}>Can Create Your Own Customised <Link href="/umrah-packages">Umrah Packages</Link> </h3>
            <p>
              Every pilgrim has different travel preferences, priorities, and budgets. While we offer a range of ready-made, affordable and luxury Umrah packages UK, many travellers prefer greater flexibility when planning their journey.
            </p>
            <p>
              Our Umrah Getaway option personalise your Umrah tour from UK based on your preferences, giving you more control over how you travel, where you stay, and the services included throughout your pilgrimage.
            </p>
            <h3 className={styles.servicesHeading}>Accommodation Options</h3>
            <p>Choose accommodation that matches your preferred level of comfort and budget.</p>
            <ul className={styles.servicesList}>
              <li>Economy, 3-star, 4-star, and 5-star hotel options</li>
              <li>Accommodation close to Masjid al-Haram or Masjid an-Nabawi</li>
              <li>Standard, deluxe, and luxury accommodation categories</li>
              <li>Single, double, triple, quad, and family room options</li>
            </ul>
            <h3 className={styles.servicesHeading}>Flights Options</h3>
            <p>Select flight arrangements that suit your schedule and travel preferences.</p>
            <ul className={styles.servicesList}>
              <li>Economy Class flights</li>
              <li>Business Class flights</li>
              <li>Preferred airlines</li>
              <li>Flexible travel dates</li>
              <li>Departure from various UK airports</li>
              <li>Direct or connecting flight options are available</li>
            </ul>
            <h3 className={styles.servicesHeading}>Transfers and Ground Transportation</h3>
            <p>Choose transportation options based on your comfort requirements.</p>
            <ul className={styles.servicesList}>
              <li>Standard transfer services</li>
              <li>Private transfers</li>
              <li>Luxury VIP transportation</li>
              <li>Airport transfers</li>
              <li>Intercity travel between Makkah and Madinah</li>
              <li>Group transportation arrangements</li>
            </ul>
            <h3 className={styles.servicesHeading}>Additional Services</h3>
            <p>
              You can also enhance your journey with optional services, including visa assistance, Ziyarah tours, guided visits to significant Islamic landmarks, and other travel support services.
            </p>
            <p>
              With flexible options across accommodation, flights, transportation, and additional services, you can create a journey that fits your requirements rather than adapting to a fixed travel package.
            </p>
            <h3 className={styles.servicesHeading}>Get Your Hajj Package Customised</h3>
            <p>
              In addition to Umrah, we also offer flexibility across selected elements of our <Link href="/hajj-package">Hajj packages</Link>. Whether you are traveling alone, with your spouse, family members, or in a group, our team can assist you in tailoring your Hajj package arrangements to meet your specific travel needs and preferences.
            </p>
            <h3 className={styles.servicesHeading}>Optional Qurbani Arrangements</h3>
            <p>
              For pilgrims who wish to include Qurbani as part of their Hajj preparations, arrangements can be made upon request. Our team can assist with the necessary arrangements, helping simplify an important aspect of the Hajj pilgrimage.
            </p>
            <h3 className={styles.servicesHeading}>Can Get Expert Guidance from Start to Finish</h3>
            <p>
              For many pilgrims, especially first-time travellers, planning an Umrah journey can feel overwhelming. Our experienced team guides you through every stage of the process, ensuring a smooth and stress-free experience.
            </p>
            <p>
              From the moment you enquire until your safe return home, our specialists remain available to answer questions, provide updates, and offer support whenever needed.
            </p>
            <p>
              If you want updates on Hajj and Umrah, you can <Link href="/blogs">explore our latest insights</Link>.
            </p>
            <h3 className={styles.servicesHeading}>From Enquiry to Pilgrimage: Our 4-Step Process</h3>
            <h3 className={styles.servicesHeading}>Step 1: Speak to Our Travel Specialists</h3>

            <p>
              Speak with one of our experienced travel specialists to discuss your Umrah or Hajj requirements, including travel dates, budget, accommodation preferences, and any special requests.
            </p>
            <h3 className={styles.servicesHeading}>Step 2: We Build Your Personalised Umrah Packages</h3>

            <p>
              We design a personalised itinerary based on your needs, including your choice of flights, hotel category, transfer options, and additional services where required.
            </p>
            <h3 className={styles.servicesHeading}>Step 3: Handle All Bookings and Documentation</h3>

            <p>
              Once you confirm your package, our team handles all arrangements, including flights, hotel bookings, visa assistance, and complete travel documentation.
            </p>
            <h3 className={styles.servicesHeading}>Step 4: You Travel with Complete Peace of Mind</h3>

            <p>
              Travel with peace of mind knowing all arrangements are confirmed and organised, allowing you to focus fully on your pilgrimage and worship.
            </p>
            <h3 className={styles.servicesHeading}>Our Commitment to Every Pilgrim We Serve</h3>
            <p>
              For over 20 years, we have been serving pilgrims with dedication, care, and trust. At UmrahTech, we take pride in supporting thousands of Umrah and Hajj travellers, ensuring every journey is handled with attention, respect, and reliability.
            </p>
            <p>
              From the moment you contact us until you safely return home, we remain by your side. Our support continues throughout your entire pilgrimage, not just at the time of booking.
            </p>
            <p>
              Our team is available 24/7 to assist you whenever needed, giving you confidence that help is always within reach during your journey. Our dedicated Umrah travel experts ensure that every detail of your arrangements is taken care of with genuine care and professionalism.
            </p>
            <p>
              We focus on delivering the right balance of quality, comfort, and value within your budget. Our goal is not just to provide travel but to ensure a smooth, well-supported pilgrimage experience from start to finish.
            </p>
            <p>
              With UmrahTech, you are never alone on your journey.
            </p>
            <h3 className={styles.servicesHeading}>Book Your Umrah or Hajj Journey Today</h3>
            <p>
              Your sacred journey deserves expert planning and exceptional care. Reach out to UmrahTech today to discover our tailored Hajj and Umrah packages, and see why countless pilgrims rely on us for one of the most significant journeys of their lives.
            </p>
            <p>
              <Link href="/contact-us">Speak with our travel experts</Link> today and let us help you create a pilgrimage experience tailored entirely to your needs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
