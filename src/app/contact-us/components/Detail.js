import React from 'react'
import styles from "../ContactUs.module.css";
import { BsPinMapFill , BsEnvelopeOpen , BsTelephoneFill , BsClockHistory, BsFacebook , BsTwitterX, BsInstagram, BsYoutube, BsLinkedin, BsTiktok } from 'react-icons/bs';
export default function Detail() {
  return (
    <div className={styles.contactdetail}>
      <div className={styles.infodiv}>
        <div className={`${styles.infoheader} mb-4`}>
          <h3 className='fw-bolds'>Get In Touch</h3>
          <p>
            Tell us a little about the journey you have in mind. Our travel experts will be in touch personally to help plan your Hajj or Umrah trip.
          </p>
        </div>

        <div className={styles.contactinfocard}>
          <div className={styles.infocard}>
            <div className={styles.iconcontainer}>
              <BsPinMapFill/>
            </div>
            <div className="card-content">
              <h4>Office Address</h4>
              <p>693a Stratford Road Birmingham B11 4DX, UK</p>
            </div>
          </div>

          <div className={styles.infocard}>
            <div className={styles.iconcontainer}>
              <BsTelephoneFill/>
            </div>
            <div className="card-content">
              <h4>Phone</h4>
              <a href="tel:01217772522" className="text-decoration-none">0121 777 2522</a>
            </div>
          </div>

          <div className={styles.infocard}>
            <div className={styles.iconcontainer}>
              <BsEnvelopeOpen/>
            </div>
            <div className="card-content">
              <h4>Email</h4>
              <a href="mailto:info@umrahTech.net" className="text-decoration-none">info@umrahTech.net</a>
            </div>
          </div>

          <div className={styles.infocard}>
            <div className={styles.iconcontainer}>
              <BsClockHistory/>
            </div>
            <div className="card-content">
              <h4>Working Hours</h4>
              <p>Monday-Friday: 9AM - 6PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}