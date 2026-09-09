import React from 'react'
import styles from '../Checkout/Checkout.module.css';
import { FaBroom, FaBuilding, FaHotel, FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa';
import { FaLocationDot } from 'react-icons/fa6';
import moment from 'moment';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import Image from 'next/image';
import { IoMdBed } from "react-icons/io";

export default function HotelDetail({ HotelData, type }) {
  const renderStars = (rating, maxStars = 6) => {
    // Round to nearest 0.5
    const roundedRating = Math.round(rating * 2) / 2;
    const fullStars = Math.floor(roundedRating);
    const hasHalfStar = roundedRating % 1 !== 0;

    const stars = [];

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className={styles.hotelStar} />);
    }

    // Half star
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className={styles.hotelStar} />);
    }

    return stars;
  }
  return (
    <div style={{ borderBottom: '1px solid #e8e8e8', marginTop: '0' }}>
      <div style={{ background: '#004c4c', color: '#ffffff', padding: '0.65rem 1.5rem', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, background: '#c49a2a', borderRadius: 4, flexShrink: 0 }}>
          <FaHotel size={12} />
        </span>
        HOTEL ACCOMMODATION
        <span style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.45), rgba(255,255,255,0))' }} />
        <span style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 4, padding: '0.15rem 0.6rem', fontSize: '0.7rem', letterSpacing: '0.08em' }}>{HotelData?.city}</span>
      </div>
      <div className="d-flex flex-column flex-md-row mt-3 gap-4 px-3 pb-3">
        {/* Image / Placeholder */}
        <div className={`${styles.hotelImageBox} rounded-4`}>
          {/* <FaBuilding className={styles.hotelImageIcon} /> */}
          <Image src={HotelData?.first_image} alt="Hotel Icon" width={200} height={200} className={styles.usectiontitleIcon} />
        </div>

        {/* Content */}
        <div className="flex-fill">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-start mb-2">
            <div>
              <h3 className="fs-5 fw-semibold mb-1">{HotelData?.name}</h3>
              <p className="text-muted small mb-0"><FaLocationDot color='green' /> {HotelData?.location?.address}</p>
            </div>

            {/* Rating */}
            <div className="d-flex gap-1">
              {renderStars(HotelData?.star_rating, 6)}
            </div>
          </div>
          {type !== 'receipt' && (
            <p className="text-muted small mb-3">
              {HotelData?.description}
            </p>
          )}

          <div className="d-flex align-items-center flex-wrap small">
            <span className="text-muted">Check-in:</span>
            <span className="fw-medium ms-1">{moment(HotelData?.check_in).format('DD-MM-YYYY')}</span>

            <span className="mx-2 text-muted">→</span>

            <span className="text-muted">Check-out:</span>
            <span className="fw-medium ms-1">{moment(HotelData?.check_out).format('DD-MM-YYYY')}</span>
          </div>
          {type === 'receipt' && (
            <div className="mt-3">
              {HotelData?.rooms.filter(room => room.price_added_to_package).map((room, index) => (
                <div className='' key={index}>
                  {room.rates.filter(rate => rate.price_added_to_package).map((rate, rateIndex) => (
                    <div className='' key={rateIndex}>
                      <h6><IoMdBed size={25}/> {room?.name} - ({rate?.board_name})</h6>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
