import styles from "../ContactUs.module.css";
import { FaExternalLinkAlt } from "react-icons/fa";

export default function Map() {
  return (
    <div className={styles.mapSection}>
      <h3 className={styles.mapHeading}>Find Us</h3>
      <div className={styles.map}>
        <a
          href="https://www.google.com/maps/place/693a+Stratford+Rd,+Springfield,+Birmingham+B11+4DX/@52.4469259,-1.8602044,162m/data=!3m1!1e3!4m6!3m5!1s0x4870bbeeb8d8a42f:0x236b6f6fb188450d!8m2!3d52.4467704!4d-1.8605181!16s%2Fg%2F11mkj18ckh?entry=ttu"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.openMapsLink}
        >
          Open in Maps <FaExternalLinkAlt />
        </a>
        <iframe
          style={{ width: "100%", height: "100%" }}
          src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=693a%20Stratford%20Road%20Birmingham%20B11%204DX,%20UK+(Al%20Hijaz%20Tours)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
          frameBorder="0"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
}