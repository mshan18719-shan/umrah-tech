import React from "react";
import styles from "../HajjPage.module.css";
import { FiUsers } from "react-icons/fi";
import { BsTelephone } from "react-icons/bs";
import { MdOutlineMailOutline } from "react-icons/md";
function LastSection() {
  return (
    <>
      <section className={`${styles.lastimage}`}>
        <div className={styles.lastoverlay}></div>
        <div className="container position-relative">
          <div className="row">
            <div className={`col text-center text-light ${styles.lastcontent}`}>
              <h1 className={`fw-bold text-center mb-3 text-light`}>
                Start Your Hajj Journey Today
              </h1>
              <p>
                Take the first step toward fulfilling one of the pillars of
                Islam. <br /> Register your interest today and be among the
                first to receive <br /> updates on upcoming Hajj packages.
              </p>

              <div className="gap-3 mt-4 d-flex justify-content-center">
                <button className={`btn btn-warning ${styles.btntextyello}`}>
                  Register for Hajj Updates
                </button>
                <button className={`btn btn-light ${styles.btntextwhite}`}>Contact Our Team</button>
              </div>

              <hr className="mt-5" />
              <div className="d-flex flex-column flex-md-row justify-content-center align-items-center gap-4">
                {/* Item 1 */}
                <div className="d-flex align-items-center gap-3">
                  <div className={styles.formicon}>
                    <BsTelephone color="#02245E" size={25} />
                  </div>

                  <div>
                    <p className="mb-0 fw-semibold text-light">Call Us</p>
                    <small className="text-light"><a href="tel:01217772522" className="text-light">0121 777 2522</a></small>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="d-flex align-items-center gap-3">
                  <div className={styles.formicon}>
                    <MdOutlineMailOutline color="#02245E" size={30} />
                  </div>

                  <div>
                    <p className="mb-0 fw-semibold text-light">Email Us</p>
                    <small className="text-light"><a href="mailto:info@umrahTech.net" className="text-light">info@umrahTech.net</a></small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default LastSection;
