import React from "react";
import { FaCalendar, FaHeart, FaUser } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import styles from '../HajjPage.module.css'
export default function UnderstandingHajj() {
  return (
    <div className={`${styles.understanding} ${styles.hajjsectionm}`}>
      <h3 className="h3 fw-bold text-center mb-4">Understanding Hajj</h3>
      <p className="text-center text-muted mb-4">
        Hajj is one of the five pillars of Islam, a sacred pilgrimage that every
        Muslim must undertake at least once in their lifetime if they are
        physically and financially able.
      </p>
      <div className="row">
        <div className="col-md-3 mt-2">
          <div className="card text-center border-0 shadow-sm p-4 h-100">
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle bg-light d-flex justify-content-center align-items-center"
                style={{width: '60px', height: '60px'}}
              >
                <FaLocationDot className="text-primary" size={20}/>
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2">Ihram</h5>
            <p className="text-muted mb-0">Enter the sacred state of purity</p>
          </div>
        </div>
         <div className="col-md-3 mt-2">
          <div className="card text-center border-0 shadow-sm p-4 h-100">
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle bg-light d-flex justify-content-center align-items-center"
                style={{width: '60px', height: '60px'}}
              >
                <FaCalendar className="text-primary" size={20}/>
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2">Tawaf</h5>
            <p className="text-muted mb-0">Circumambulate the Holy Kaaba</p>
          </div>
        </div>
         <div className="col-md-3 mt-2">
          <div className="card text-center border-0 shadow-sm p-4 h-100">
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle bg-light d-flex justify-content-center align-items-center"
                style={{width: '60px', height: '60px'}}
              >
                <FaUser className="text-primary" size={20}/>
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2">Sa'i</h5>
            <p className="text-muted mb-0">Walk between Safa and Marwah hills</p>
          </div>
        </div>
         <div className="col-md-3 mt-2">
          <div className="card text-center border-0 shadow-sm p-4 h-100">
            <div className="d-flex justify-content-center align-items-center mb-3">
              <div
                className="rounded-circle bg-light d-flex justify-content-center align-items-center"
                style={{width: '60px', height: '60px'}}
              >
                <FaHeart className="text-primary" size={20}/>
              </div>
            </div>
            <h5 className="fw-bold mb-3 mt-2">Arafat</h5>
            <p className="text-muted mb-0">Stand in prayer at Mount Arafat</p>
          </div>
        </div>
      </div>
    </div>
  );
}
