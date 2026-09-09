import React from "react";
import styles from "../HajjPage.module.css";
import { BsClock, BsHeart, BsPerson } from "react-icons/bs";
export default function PrepareJourney() {
  return (
    <section className={styles.hajjsectionm}>
      <h3 className="h3 fw-bold text-center mb-4">Prepare for Your Journey</h3>
      <p className="text-center text-muted mb-4">
        Essential steps to ensure your Hajj pilgrimage is spiritually fulfilling
        and practically smooth.
      </p>
      <div className="row justify-content-center">
        <div className="col-md-3 col-sm-6 mt-2">
          <div className="card text-start border-0 shadow-sm p-4 h-100">
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle bg-warning bg-opacity-10 d-flex justify-content-center align-items-center"
                style={{ width: "60px", height: "60px" }}
              >
                <BsHeart className="text-warning" size={25}/>
              </div>
            </div>
            <h5 className="fw-bold my-3">Spiritual Preparation</h5>
            <ul className="list-unstyled text-muted mb-0">
              <li className="mt-1">• Increase daily prayers and Quran recitation</li>
              <li className="mt-1">• Seek forgiveness from family and friends</li>
              <li className="mt-1">• Study the rituals and their meanings</li>
              <li className="mt-1">• Make sincere repentance (Tawbah)</li>
            </ul>
          </div>
        </div>
         <div className="col-md-3 col-sm-6  mt-2">
          <div className="card text-start border-0 shadow-sm p-4 h-100">
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle bg-success bg-opacity-10 d-flex justify-content-center align-items-center"
                style={{ width: "60px", height: "60px" }}
              >
                <BsClock className="text-primary" size={25}/>
              </div>
            </div>
            <h5 className="fw-bold my-3">Physical Preparation</h5>
            <ul className="list-unstyled text-muted mb-0">
              <li className="mt-1">• Get required vaccinations</li>
              <li className="mt-1">• Build physical stamina through walking</li>
              <li className="mt-1">• Consult your doctor for health clearance</li>
              <li className="mt-1">• Practice wearing Ihram clothing</li>
            </ul>
          </div>
        </div>
         <div className="col-md-3 col-sm-6  mt-2">
          <div className="card text-start border-0 shadow-sm p-4 h-100">
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle bg-success bg-opacity-10 d-flex justify-content-center align-items-center"
                style={{ width: "60px", height: "60px" }}
              >
                <BsPerson className="text-primary" size={25}/>
              </div>
            </div>
            <h5 className="fw-bold my-3">Practical Preparation</h5>
            <ul className="list-unstyled text-muted mb-0">
              <li className="mt-1">• Ensure passport validity (6+ months)</li>
              <li className="mt-1">• Arrange finances and settle debts</li>
              <li className="mt-1">• Pack appropriate clothing and essentials</li>
              <li className="mt-1">• Learn basic Arabic phrases</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
