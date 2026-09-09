import React from "react";
import { FaCalendar, FaHeart, FaUser, FaRegFileAlt } from "react-icons/fa";
import { LuHotel } from "react-icons/lu";
import { TbBus } from "react-icons/tb";
import { FiUsers } from "react-icons/fi";
import { PiAirplaneTilt } from "react-icons/pi";
import { FaLocationDot } from "react-icons/fa6";
import { FaHeadset } from "react-icons/fa";
import { FiHome } from "react-icons/fi";
import { GoBook } from "react-icons/go";
import styles from "../HajjPage.module.css";
export default function UnderstandingHajj() {
  return (
    <div className={` ${styles.hajjsectionm}`}>
      <h2 className="fw-bold text-center mb-3 text-light">
        What's Included in Our Hajj Packages
      </h2>
      <p className="text-center  mb-4 text-light">
        Everything you need for a complete and comfortable Hajj experience
      </p>
      <div className="row">
        <div className="col-md-3 mt-2">
          <div
            className={`${styles.cardbg} text-center border border-secondary rounded-4 shadow-sm p-4 h-100`}
          >
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle  d-flex justify-content-center align-items-center"
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "#f7c948",
                }}
              >
                <PiAirplaneTilt  color="#02245E" size={30} />
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2 text-light">
              Flights from the UK
            </h5>
            <p className="text-light mb-0">
              Return flights with reputable airlines
            </p>
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <div
            className={`${styles.cardbg} text-center border border-secondary rounded-4 shadow-sm p-4 h-100`}
          >
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle  d-flex justify-content-center align-items-center"
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "#f7c948",
                }}
              >
                <FaRegFileAlt className="" color="#02245E" size={30} />
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2 text-light">
              Hajj Visa Processing
            </h5>
            <p className="text-light mb-0">
              Complete visa assistance and documentation
            </p>
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <div
            className={`${styles.cardbg} text-center  border border-secondary rounded-4 shadow-sm p-4 h-100`}
          >
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle  d-flex justify-content-center align-items-center"
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "#f7c948",
                }}
              >
                <LuHotel className="" color="#02245E" size={30} />
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2 text-light">Accommodation</h5>
            <p className="text-light mb-0">
              Quality hotels in Makkah and Madinah
            </p>
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <div
            className={`${styles.cardbg} text-center border border-secondary rounded-4 shadow-sm p-4 h-100`}
          >
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle  d-flex justify-content-center align-items-center"
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "#f7c948",
                }}
              >
                <TbBus className="" color="#02245E" size={30} />
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2 text-light">Internal Transport</h5>
            <p className="text-light mb-0">
              Comfortable transport between holy sites
            </p>
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <div
            className={`${styles.cardbg} text-center border border-secondary rounded-4 shadow-sm p-4 h-100`}
          >
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle  d-flex justify-content-center align-items-center"
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "#f7c948",
                }}
              >
                <FiUsers className="" color="#02245E" size={30} />
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2 text-light">
              Expert Group Guidance
            </h5>
            <p className="text-light mb-0">Led by experienced scholars</p>
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <div
            className={`${styles.cardbg} text-center border border-secondary rounded-4 shadow-sm p-4 h-100`}
          >
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle  d-flex justify-content-center align-items-center"
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "#f7c948",
                }}
              >
                <GoBook className="" color="#02245E" size={30} />
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2 text-light">Pre-Hajj Training</h5>
            <p className="text-light mb-0">
              Comprehensive preparation sessions
            </p>
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <div
            className={`${styles.cardbg} text-center border border-secondary rounded-4 shadow-sm p-4 h-100`}
          >
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle  d-flex justify-content-center align-items-center"
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "#f7c948",
                }}
              >
                <FaHeadset className="" color="#02245E" size={30} />
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2 text-light">24/7 Support</h5>
            <p className="text-light mb-0">
              Round-the-clock assistance throughout
            </p>
          </div>
        </div>
        <div className="col-md-3 mt-2">
          <div
            className={`${styles.cardbg} text-center border border-secondary rounded-4 shadow-sm p-4 h-100`}
          >
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle  d-flex justify-content-center align-items-center"
                style={{
                  width: "60px",
                  height: "60px",
                  backgroundColor: "#f7c948",
                }}
              >
                <FiHome className="" color="#02245E" size={30} />
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2 text-light">Easy Accommodation</h5>
            <p className="text-light mb-0">
              Hassle-free check-in and comfortable stays
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
