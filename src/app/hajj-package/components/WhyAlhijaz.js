import React from "react";
import { FaCalendar, FaHeart, FaUser, FaRegFileAlt } from "react-icons/fa";
import { MdOutlineShield } from "react-icons/md";
import { SlBadge } from "react-icons/sl";
import { GrMapLocation } from "react-icons/gr";
import { LuHotel } from "react-icons/lu";
import { TbBus } from "react-icons/tb";
import { FiUsers } from "react-icons/fi";
import { FaRegStar } from "react-icons/fa";
import { PiAirplaneTilt } from "react-icons/pi";
import { FaLocationDot } from "react-icons/fa6";
import { FaHeadset } from "react-icons/fa";
import { FiHome } from "react-icons/fi";
import { GoBook } from "react-icons/go";
import styles from "../HajjPage.module.css";
function WhyAlhijaz() {
  return (
    <>
      <section>
        <div className="container">
          <div className={`${styles.hajjsectionm}`}>
            <h2 className={`fw-bold text-center mb-3 ${styles.prepHeading}`}>
              Why Choose UmrahTech for Hajj
            </h2>
            <p className="text-center text-muted mb-4">
              Your trusted partner in making your sacred journey memorable and
              spiritually fulfilling
            </p>
            <div className="row">
              <div className={`col-md-4 mt-2 ${styles.whycard}`}>
                <div
                  className={`${styles.cardbg} text-center  rounded-4 shadow-sm p-4 h-100`}
                >
                  <div className="d-flex justify-content-center align-items-center mb-3">
                    <div
                      className="rounded  d-flex justify-content-center align-items-center"
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: "#02245E",
                      }}
                    >
                      <SlBadge className="" color="#FAB615" size={30} />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3 mt-2">
                    Experienced Hajj Travel Specialists
                  </h5>
                  <p className="text-muted mb-0">
                    Years of expertise in organizing successful Hajj pilgrimages
                  </p>
                </div>
              </div>
              <div className="col-md-4 mt-2">
                <div
                  className={`${styles.cardbg} text-center  rounded-4 shadow-sm p-4 h-100`}
                >
                  <div className="d-flex justify-content-center align-items-center mb-3">
                    <div
                      className="rounded  d-flex justify-content-center align-items-center"
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: "#02245E",
                      }}
                    >
                      <MdOutlineShield className="" color="#FAB615" size={30} />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3 mt-2">
                    Trusted and Licensed Services
                  </h5>
                  <p className="text-muted mb-0">
                    Fully licensed and accredited travel services you can rely
                    on
                  </p>
                </div>
              </div>
              <div className="col-md-4 mt-2">
                <div
                  className={`${styles.cardbg} text-center  rounded-4 shadow-sm p-4 h-100`}
                >
                  <div className="d-flex justify-content-center align-items-center mb-3">
                    <div
                      className="rounded  d-flex justify-content-center align-items-center"
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: "#02245E",
                      }}
                    >
                      <GrMapLocation className="" color="#FAB615" size={30} />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3 mt-2">Premium Locations</h5>
                  <p className="text-muted mb-0">
                    Carefully selected hotels near the holy sites for your
                    convenience
                  </p>
                </div>
              </div>
              <div className="col-md-4 mt-2">
                <div
                  className={`${styles.cardbg} text-center  rounded-4 shadow-sm p-4 h-100`}
                >
                  <div className="d-flex justify-content-center align-items-center mb-3">
                    <div
                      className="rounded  d-flex justify-content-center align-items-center"
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: "#02245E",
                      }}
                    >
                      <FaHeadset className="" color="#FAB615" size={30} />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3 mt-2">Dedicated Support</h5>
                  <p className="text-muted mb-0">
                    Continuous assistance before and during your entire journey
                  </p>
                </div>
              </div>
              <div className="col-md-4 mt-2">
                <div
                  className={`${styles.cardbg} text-center  rounded-4 shadow-sm p-4 h-100`}
                >
                  <div className="d-flex justify-content-center align-items-center mb-3">
                    <div
                      className="rounded  d-flex justify-content-center align-items-center"
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: "#02245E",
                      }}
                    >
                      <FiUsers className="" color="#FAB615" size={30} />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3 mt-2">Guided Groups</h5>
                  <p className="text-muted mb-0">
                    Well-organized groups for a smooth and enriching pilgrimage
                  </p>
                </div>
              </div>
              <div className="col-md-4 mt-2">
                <div
                  className={`${styles.cardbg} text-center  rounded-4 shadow-sm p-4 h-100`}
                >
                  <div className="d-flex justify-content-center align-items-center mb-3">
                    <div
                      className="rounded  d-flex justify-content-center align-items-center"
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: "#02245E",
                      }}
                    >
                      <FaRegStar className="" color="#FAB615" size={30} />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3 mt-2">Exceptional Service</h5>
                  <p className="text-muted mb-0">
                    Outstanding customer care and attention to detail throughout
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default WhyAlhijaz;
