import React from "react";
import Image from "next/image";
import styles from "../HajjPage.module.css";
import {
  FaGraduationCap,
  FaSuitcase,
  FaHeart,
  FaMapMarkerAlt,
} from "react-icons/fa";
function Prehajj() {
  return (
    <>
      <section className={styles.prepSection}>
        <div className="container">
          <div className="row align-items-center">
            {/* LEFT CONTENT */}
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h2 className={styles.prepHeading}>
                Pre-Hajj Preparation <br /> & Guidance
              </h2>

              <p className={styles.prepText}>
                Preparing for Hajj requires both spiritual and practical
                planning. Our team provides helpful guidance before departure to
                ensure pilgrims feel confident and prepared for the sacred
                journey ahead.
              </p>

              {/* LIST ITEMS */}

              <div className={styles.prepItem}>
                <div className={styles.iconCircle}>
                  <FaGraduationCap />
                </div>
                <div>
                  <h6>Pre-Hajj Seminars</h6>
                  <p>
                    Comprehensive educational sessions on Hajj rituals and
                    requirements
                  </p>
                </div>
              </div>

              <div className={styles.prepItem}>
                <div className={styles.iconCircle}>
                  <FaSuitcase />
                </div>
                <div>
                  <h6>Travel Preparation Advice</h6>
                  <p>
                    Expert guidance on packing, documentation, and travel
                    essentials
                  </p>
                </div>
              </div>

              <div className={styles.prepItem}>
                <div className={styles.iconCircle}>
                  <FaHeart />
                </div>
                <div>
                  <h6>Health and Safety Tips</h6>
                  <p>
                    Important health guidelines and safety measures for pilgrims
                  </p>
                </div>
              </div>

              <div className={styles.prepItem}>
                <div className={styles.iconCircle}>
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <h6>Step-by-Step Ritual Guidance</h6>
                  <p>Detailed walkthrough of each stage of the Hajj journey</p>
                </div>
              </div>
            </div>

            {/* RIGHT IMAGE */}
            <div className="col-lg-6 text-center">
              <div>
                <Image
                  src="/images/hajj/quranimg.jpg"
                  alt="Quran"
                  width={520}
                  height={420}
                  className="img-fluid rounded-4"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Prehajj;
