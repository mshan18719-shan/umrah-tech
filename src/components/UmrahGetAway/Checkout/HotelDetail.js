import React from 'react'
import styles from './Checkout.module.css';
import { FaHotel, FaStar, FaStarHalfAlt, FaUtensils } from 'react-icons/fa';
import { FaLocationDot } from 'react-icons/fa6';
import moment from 'moment';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import Image from 'next/image';
import { IoMdBed } from "react-icons/io";

const resolveRoomRate = (rooms, roomIndex, rateIndex, roomId, rateKey) => {
  if (!rooms?.length) return null;

  if (roomId) {
    const room = rooms.find((item) => item.id === roomId || item.code === roomId);
    if (room) {
      const rate =
        room.rates?.find((item) => item.rate_key === rateKey) ||
        room.rates?.[rateIndex ?? 0];

      return { roomName: room.name || room.type, boardName: rate?.board_name };
    }
  }

  const normalizedRoomIndex = Number(roomIndex);
  if (!Number.isNaN(normalizedRoomIndex) && rooms[normalizedRoomIndex]) {
    const room = rooms[normalizedRoomIndex];
    const normalizedRateIndex = Number(rateIndex ?? 0);
    const rate = room.rates?.[normalizedRateIndex];

    return { roomName: room.name || room.type, boardName: rate?.board_name };
  }

  for (const room of rooms) {
    const selectedRate = room.rates?.find(
      (rate) => rate.price_added_to_package || rate.selected_for_package
    );

    if (room.selected_for_package || room.price_added_to_package || selectedRate) {
      return {
        roomName: room.name || room.type,
        boardName: selectedRate?.board_name,
      };
    }
  }

  return null;
};

const getSelectedRoomDetails = (hotel) => {
  if (!hotel) return null;
  if (hotel.selected_room_name || hotel.selected_board_name) {
    return {
      roomName: hotel.selected_room_name,
      boardName: hotel.selected_board_name,
    };
  }

  const rooms = hotel.rooms || hotel.hotel_details?.rooms || [];
  const fromRooms = resolveRoomRate(
    rooms,
    hotel.selected_room_index,
    hotel.selected_rate_index,
    hotel.selected_room_id,
    hotel.selected_rate_key
  );

  if (fromRooms?.roomName) return fromRooms;

  return null;
};

export default function HotelDetail({ HotelData, type }) {
  const selectedRoom = getSelectedRoomDetails(HotelData);

  const renderStars = (rating, maxStars = 6) => {
    const numericRating = Number(rating);
    if (!numericRating) return null;

    const roundedRating = Math.round(numericRating * 2) / 2;
    const fullStars = Math.floor(roundedRating);
    const hasHalfStar = roundedRating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className={styles.hotelStar} />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className={styles.hotelStar} />);
    }

    return stars;
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderLeft}>
          <div className={styles.usectiontitleIconBox}>
            <FaHotel size={22} className={styles.usectiontitleIcon} />
          </div>
          <div>
            <div className={styles.usectiontitleTitle}>
              {HotelData?.city} Accommodation
            </div>
            <p className={styles.usectiontitleSubtitle}>
              {HotelData?.nights} Night{HotelData?.nights > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {/* <span className={styles.usectiontitleBadge}>{HotelData?.city}</span> */}
      </div>

      <div className={styles.hotelContentRow}>
        <div className={styles.hotelImageBox}>
          {HotelData?.first_image && (
            <Image src={HotelData.first_image} alt={HotelData?.name || 'Hotel'} width={200} height={150} />
          )}
        </div>

        <div className="flex-fill">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-start mb-2">
            <div>
              <h3 className={styles.hotelName}>{HotelData?.name}</h3>
              {HotelData?.location?.address && (
                <p className={styles.hotelAddress}>
                  <FaLocationDot /> {HotelData?.location?.address}
                </p>
              )}
            </div>
            <div className="d-flex gap-1">
              {renderStars(HotelData?.star_rating, 6)}
            </div>
          </div>

          <div className={styles.hotelDates}>
            <span className={styles.hotelDatesLabel}>Check-in:</span>
            <span className={styles.hotelDatesValue}>{moment(HotelData?.check_in).format('DD-MM-YYYY')}</span>
            <span className="mx-2 text-muted">→</span>
            <span className={styles.hotelDatesLabel}>Check-out:</span>
            <span className={styles.hotelDatesValue}>{moment(HotelData?.check_out).format('DD-MM-YYYY')}</span>
          </div>

          {(selectedRoom?.roomName || selectedRoom?.boardName) && (
            <div className={styles.hotelRoomDetails}>
              {selectedRoom?.roomName && (
                <div className={styles.hotelRoomDetailCard}>
                  <IoMdBed className={styles.hotelRoomDetailIcon} />
                  <div className={styles.hotelRoomDetailContent}>
                    <span className={styles.hotelRoomDetailLabel}>Room Type</span>
                    <p className={styles.hotelRoomDetailValue}>{selectedRoom.roomName}</p>
                  </div>
                </div>
              )}

              {selectedRoom?.boardName && (
                <div className={styles.hotelRoomDetailCard}>
                  <FaUtensils className={styles.hotelRoomDetailIcon} />
                  <div className={styles.hotelRoomDetailContent}>
                    <span className={styles.hotelRoomDetailLabel}>Board Basis</span>
                    <p className={styles.hotelRoomDetailValue}>{selectedRoom.boardName}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {type === 'receipt' && !selectedRoom?.roomName && (
            <div className="mt-3">
              {HotelData?.rooms?.filter((room) => room.price_added_to_package || room.selected_for_package).map((room, index) => (
                <div key={index}>
                  {room.rates?.filter((rate) => rate.price_added_to_package || rate.selected_for_package).map((rate, rateIndex) => (
                    <div key={rateIndex}>
                      <h6><IoMdBed size={22} /> {room?.name} - ({rate?.board_name})</h6>
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
