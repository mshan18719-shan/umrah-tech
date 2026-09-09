'use client'
import { Playfair } from 'next/font/google';
import { PiCompassBold } from "react-icons/pi";
import {
    FaMapMarkerAlt,
    FaRegCalendarAlt,
    FaPlane,
    FaHotel,
    FaCar,
    FaCompass,
    FaArrowRight,
    FaCheckCircle,
} from "react-icons/fa";
import styles from './BuildOwnPackage.module.css';

const playfair = Playfair({
    subsets: ['latin'],
    weight: ['600', '700'],
});

const steps = [
    {
        icon: <FaMapMarkerAlt />,
        title: "Choose Cities",
        desc: "Makkah First or Madinah First",
    },
    {
        icon: <FaRegCalendarAlt />,
        title: "Select Dates",
        desc: "Pick your departure & return",
    },
    {
        icon: <FaPlane />,
        title: "Add Flights",
        desc: "Direct & connecting options",
    },
    {
        icon: <FaHotel />,
        title: "Pick Hotels",
        desc: "3-star to 5-star in Haram vicinity",
    },
    {
        icon: <FaCar />,
        title: "Transfers",
        desc: "Airport & inter-city transfers",
    },
    {
        icon: <FaCompass />,
        title: "Experiences",
        desc: "Ziyarat tours & guided visits",
    },
];

const checklist = [
    "No hidden fees",
    "Haram-proximity filters",
    "Expert review included",
    "Cancel anytime",
];

const UMRAH_GETAWAY_TAB = 'umrah-get-away';

function scrollToHomeSearch() {
    const searchSection = document.getElementById('home-search');
    if (!searchSection) return;

    const headerOffset = 110;
    const top =
        searchSection.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
}

export default function BuildYourOwnPackage() {
    const handleStartBuilding = () => {
        localStorage.setItem('selectedSearchTab', UMRAH_GETAWAY_TAB);
        window.dispatchEvent(
            new CustomEvent('home-search-tab', { detail: UMRAH_GETAWAY_TAB })
        );
        scrollToHomeSearch();
    };

    return (
        <section className={`${styles.section} section-gap`}>
            <div className="container">

                {/* ── Header ── */}
                <div className="text-center mx-auto" style={{ maxWidth: "640px" }}>
                    <span className={styles.tag}>
                        <PiCompassBold /> Personalise Your Journey
                    </span>
                    <h2 className={`${styles.title} ${playfair.className}`}>
                        Build Your Own Umrah Package
                    </h2>
                    <p className={styles.subtitle}>
                        Create a fully tailored pilgrimage — choose your departure, hotels, extras, and more. Your schedule, your way.
                    </p>
                </div>

                {/* ── Steps ── */}
                <div className="row justify-content-center g-4 mt-3">
                    {steps.map((step, index) => (
                        <div key={index} className="col-6 col-sm-4 col-lg-2">
                            <div className={styles.step}>
                                <div className={styles.stepIconWrap}>
                                    <span className={styles.stepIcon}>{step.icon}</span>
                                    <span className={styles.stepNumber}>{index + 1}</span>
                                </div>
                                <h6 className={styles.stepTitle}>{step.title}</h6>
                                <p className={styles.stepDesc}>{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── CTA Banner ── */}
                <div className={`${styles.ctaBanner} d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between mt-5`}>
                    <div className={styles.ctaText}>
                        <h3 className={`${styles.ctaTitle} ${playfair.className}`}>
                            Ready to design your perfect Umrah?
                        </h3>
                        <p className={styles.ctaSubtitle}>
                            Mix and match flights, hotels, and experiences. Our experts review every custom build before you pay a penny.
                        </p>
                        <div className={`${styles.ctaChecklist} d-flex flex-wrap`}>
                            {checklist.map((item, index) => (
                                <span key={index} className={styles.ctaChecklistItem}>
                                    <FaCheckCircle /> {item}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className={styles.ctaActionWrap}>
                        <button
                            type="button"
                            className={styles.ctaBtn}
                            onClick={handleStartBuilding}
                        >
                            Start Building My Umrah <FaArrowRight style={{ fontSize: "0.8rem" }} />
                        </button>
                    </div>
                </div>

            </div>
        </section>
    );
}