import React from "react";
import styles from "../HajjPage.module.css";
import Image from 'next/image';
import {
  FaClipboardList,
  FaFileAlt,
  FaCube,
  FaCheckCircle,
} from "react-icons/fa";

function Step() {
  return (
    <>
      <section className={`container my-4 ${styles.section}`}>
        <div className="row align-items-center">
          {/* Left Image */}
          <div className="col-lg-5 mb-4 mb-lg-0">
            <div className={styles.imageBox}>
              <Image
                src='/images/hajj/hajj2.png'
                alt="Hajj Guide"
                height={1000}
                width={1000}
                className="img-fluid"
              />
              <div className={styles.imageOverlay}>
                Planning your sacred journey with UmrahTech
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="col-lg-7">
            <h2 className={styles.heading}>
              Your Step-by-Step Hajj Guide
            </h2>

            <p className={styles.subText}>
              This guide explains everything you need to know about booking
              through UmrahTech and how we support you from start to
              finish.
            </p>

            <div className="row g-3">
              {/* Card 1 */}
              <div className="col-md-6">
                <div className={styles.card}>
                  <div>
                    {/* <span className={styles.stepBadge}>1</span> */}
                    <div className={styles.iconYellow}>
                      <FaClipboardList />
                    </div>
                  </div>
                  <div>
                    <h6>Register Your Interest</h6>
                    <p>
                      Submit your details to stay informed about upcoming Hajj
                      packages and availability.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="col-md-6">
                <div className={styles.card}>
                  <div>
                    {/* <span className={styles.stepBadge}>2</span> */}
                    <div className={styles.iconGreen}>
                      <FaFileAlt />
                    </div>
                  </div>
                  <div>
                    <h6>Prepare Your Documents</h6>
                    <p>
                      Ensure your passport, vaccination records, and other
                      travel documents are ready before booking.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="col-md-6">
                <div className={styles.card}>
                  <div>
                    {/* <span className={styles.stepBadge}>3</span> */}
                    <div className={styles.iconYellow}>
                      <FaCube />
                    </div>
                  </div>
                  <div>
                    <h6>Choose Your Hajj Package</h6>
                    <p>
                      Select from our carefully designed packages that include
                      flights, accommodation, meals, and guided support.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="col-md-6">
                <div className={styles.card}>
                  <div>
                    {/* <span className={styles.stepBadge}>4</span> */}
                    <div className={styles.iconGreen}>
                      <FaCheckCircle />
                    </div>
                  </div>
                  <div>
                    <h6>Secure Your Booking</h6>
                    <p>
                      Once packages are released, confirm your booking and begin
                      preparing for your spiritual journey.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.note}>
              Once you've reviewed these steps, make sure you register your
              interest to stay informed and ready when packages are released.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Step;
