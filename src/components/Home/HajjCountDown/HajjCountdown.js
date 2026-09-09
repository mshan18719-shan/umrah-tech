"use client";
import React from "react";
import styles from "./HajjCountdown.module.css";
import Image from "next/image";
import {FaTelegram, FaWhatsapp } from "react-icons/fa";
import moment from "moment";

export default function HajjCountdown() {
  
  return (
    <div className={styles.hajjCountdownWrapper}>
      <div className="container">
        <div className="row align-items-center">
          {/* LEFT IMAGE 1 */}
          <div className="col-lg-6 col-12 mb-3">
            <div className={styles.hajjimgWrapper}>
              <Image
                src="/images/home/hajj.png"
                quality={100}
                alt="Hajj"
                className="w-100 rounded-4 object-fit-cover"
                width={600}
                height={600}
              />
            </div>
          </div>

          {/* COUNTDOWN */}
          {/* <div className="col-lg-6 mb-3">
            <div className={styles.countdownTimerWrapper}>
              <h2 className="mb-3">Step Into Hajj {moment().add(1, 'year').format('YYYY')}</h2>
              <p className="text-muted text-justify">We are pleased to offer our well-planned Hajj packages and trusted Hajj or Umrah services for Hajj {moment().add(1, 'year').format('YYYY')} (1447 AH). UmrahTech partners with top Saudi companies to make sure that each pilgrim has a smooth, spiritually fulfilling, and unforgettable pilgrimage aligned with the Ministry of Hajj and Nusuk Portal guidelines.</p>
                <div className="text-center my-4">
                  <Image src='/images/home/nusk.png' alt="Nusuk Portal" className="h-auto" width={120} height={100} />
                  <Image src='/images/home/alhijaz2.png' alt="Nusuk Portal" className="h-auto" width={120} height={100} />
                  <Image src='/images/home/mcdc.png' alt="Nusuk Portal" className="h-auto" width={120} height={100} />
                  <Image src='/images/home/saudia.png' alt="Nusuk Portal" className="h-auto" width={120} height={100} />
                </div>
              <div className="d-flex flex-wrap justify-content-center gap-2 w-100 align-items-center">
                <a href="https://chat.whatsapp.com/KxHdDufeefjJxW3nXjDVnV?mode=ems_wa_t" target="_blank" rel="noopener noreferrer">
                  <button className="btn btn-warning px-3 "><FaWhatsapp /> JOIN HAJJ WHATSAPP GROUP</button>
                </a>
                <a href="https://t.me/+tF5MQ2KCCCU1Y2Zk" target="_blank" rel="noopener noreferrer">
                  <button className="btn btn-warning px-3"><FaTelegram /> JOIN HAJJ TELEGRAM CHANNEL</button>
                </a>
              </div>
            </div>
          </div> */}




            <div className="col-lg-6 mb-3">
            <div className={styles.countdownTimerWrapper}>
              <div className="row g-3 mb-4">
                <div className="col-md-12 col-12">
                  {/* <Image 
                    src="/images/home/arafat.webp" 
                    alt="Mina" 
                    className="object-fit-cover rounded-4 w-100"
                    width={630}
                    height={200}
                  /> */}
                   <p className="text-muted text-justify">We are pleased to offer our well-planned Hajj packages and trusted Hajj or Umrah services for Hajj {moment().add(1, 'year').format('YYYY')} (1447 AH). UmrahTech partners with top Saudi companies to make sure that each pilgrim has a smooth, spiritually fulfilling, and unforgettable pilgrimage aligned with the Ministry of Hajj and Nusuk Portal guidelines. Our packages are carefully designed to include comfortable accommodation, reliable transport, guided assistance, and dedicated on-ground support throughout your journey.</p>
                </div>
                <div className="col-md-6 col-12">
                  <Image 
                    src="/images/home/mina.webp" 
                    alt="Arafat" 
                    className="w-100  rounded-4"
                    width={300}
                    height={200}
                  />
                </div>
                <div className="col-md-6 col-12">
                  <Image 
                    src="/images/home/safamarwa.jpg" 
                    alt="Muzdalifah" 
                    className="w-100  rounded-4"
                    width={300}
                    height={200}
                  />
                </div>
              </div>
              <div className="d-block d-md-flex flex-wrap justify-content-center gap-2 w-100 align-items-center">
                <a href="https://chat.whatsapp.com/KxHdDufeefjJxW3nXjDVnV?mode=ems_wa_t" target="_blank" rel="noopener noreferrer">
                  <button className="btn btn-outline-success mb-2 mb-md-0 px-3 w-100 py-3"><FaWhatsapp /> JOIN HAJJ WHATSAPP GROUP</button>
                </a>
                <a href="https://t.me/+tF5MQ2KCCCU1Y2Zk" target="_blank" rel="noopener noreferrer">
                  <button className="btn btn-outline-success w-100 px-3 py-3"><FaTelegram /> JOIN HAJJ TELEGRAM CHANNEL</button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
