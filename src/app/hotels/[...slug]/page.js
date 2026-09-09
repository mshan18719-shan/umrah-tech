'use client';
import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import GalleryImages from "@/components/Hotels/HotelDetail/GalleryImages";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import RoomList from "@/components/Hotels/HotelDetail/RoomSelection/RoomList";
import { useSearchParams } from "next/navigation";
import HotelDetailLoader from "@/components/Loader/HotelDetailLoader";
import { usePackageMode } from "@/components/Store/PackageModeHelper";
import { useHolidayPackageStore } from "@/components/Store/HolidayPackageStore";
import moment from "moment";
import { FaStar } from "react-icons/fa";
import { IoLocationSharp } from "react-icons/io5";
import { FiClock, FiMoon } from "react-icons/fi";
import FacilitiesModal from "@/components/Hotels/HotelDetail/FacilitiesModal";

const FACILITY_PREVIEW = 6;

const hasHtmlTags = (text) => /<\/?[a-z][\s\S]*>/i.test(text || '');

export default function Page() {
  const searchParams = useSearchParams();
  const HotelCode = searchParams.get("id");
  const ProviderCode = searchParams.get("code");
  const { selectedData, packageConfig } = useHolidayPackageStore();
  const { isPackageMode, isEditMode } = usePackageMode();
  const [searchData, setSearchData] = useState({});
  const [hotelDetails, setHotelDetails] = useState({});
  const [isFetching, setIsFetching] = useState(true);
  const [listingStars, setListingStars] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [needsReadMore, setNeedsReadMore] = useState(false);
  const [facilitiesModalOpen, setFacilitiesModalOpen] = useState(false);
  const descTextRef = useRef(null);

  const isHtmlDescription = useMemo(
    () => hasHtmlTags(hotelDetails?.description),
    [hotelDetails?.description]
  );
  const plainDescription = useMemo(() => {
    if (!hotelDetails?.description) return "";
    if (isHtmlDescription) {
      return hotelDetails.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    return hotelDetails.description;
  }, [hotelDetails?.description, isHtmlDescription]);

  const detailCity = searchData?.city || searchData?.location || "Makkah";
  const heroHeading = `${detailCity} Hotel`;
  const heroSubheading = `Review and confirm your ${detailCity} accommodation`;
  const facilities = hotelDetails?.facilities || [];
  const visibleFacilities = facilities.slice(0, FACILITY_PREVIEW);
  const hasMoreFacilities = facilities.length > FACILITY_PREVIEW;

  const totalNights = useMemo(() => {
    if (hotelDetails?.checkIn && hotelDetails?.checkOut) {
      const nights = moment(hotelDetails.checkOut).diff(moment(hotelDetails.checkIn), 'days');
      return nights > 0 ? nights : 1;
    }
    return 1;
  }, [hotelDetails?.checkIn, hotelDetails?.checkOut]);

  const starRating = hotelDetails?.star_rating
    || hotelDetails?.stars
    || hotelDetails?.metadata?.stars
    || listingStars
    || 0;

  useEffect(() => {
    if (!HotelCode || typeof window === 'undefined') return;
    const storedMeta = localStorage.getItem('selectedHotelMeta');
    if (!storedMeta) return;
    try {
      const parsed = JSON.parse(storedMeta);
      if (String(parsed?.id) === String(HotelCode) && parsed?.stars != null) {
        setListingStars(parsed.stars);
      }
    } catch {
      setListingStars(0);
    }
  }, [HotelCode]);

  useEffect(() => {
    setDescExpanded(false);
    setNeedsReadMore(false);
    setFacilitiesModalOpen(false);
  }, [hotelDetails?.hotel_name, hotelDetails?.description]);

  // Only show Read more when clamped text actually overflows (~4 lines)
  useLayoutEffect(() => {
    if (!plainDescription) {
      setNeedsReadMore(false);
      return;
    }
    if (descExpanded) return;

    const el = descTextRef.current;
    if (!el) return;

    setNeedsReadMore(el.scrollHeight > el.clientHeight + 1);
  }, [plainDescription, descExpanded, isHtmlDescription]);

  useEffect(() => {
    const storedData = localStorage.getItem('HotelSearchData');
    if (storedData) {
      setSearchData(JSON.parse(storedData));
      fetchDetails(JSON.parse(storedData));
    }
  }, [searchParams]);

  const decodeProvider = (encoded) => {
    let result = '';
    let buffer = '';

    for (const ch of encoded) {
      buffer += ch;
      const code = parseInt(buffer, 36);

      if (code >= 65 && code <= 130) {
        result += String.fromCharCode(code - 3);
        buffer = '';
      }
    }
    return result;
  };

  const fetchDetails = async (searchNew) => {
    let storedRoomList = [];
    let roomDetails = [];
    if (isPackageMode || isEditMode) {
      storedRoomList = selectedData?.hotel?.hotelData?.rooms;
      searchNew = {
        check_in: packageConfig.searchData.dates?.checkIn,
        check_out: packageConfig.searchData.dates?.checkOut,
      };
    } else {
      roomDetails = localStorage.getItem('roomSelection');
      if (roomDetails) {
        storedRoomList = JSON.parse(roomDetails);
      }
    }

    const hotelProviderName = decodeProvider(ProviderCode || '').toLowerCase();

    try {
      setIsFetching(true);
      const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/full/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: hotelProviderName,
          hotelId: HotelCode,
          checkIn: searchNew?.check_in,
          checkOut: searchNew?.check_out,
          roomList: storedRoomList,
        }),
      });
      const res = await responses.json();
      setIsFetching(false);
      if (res.success) {
        res.data.provider = res.provider;
        setHotelDetails(res.data);
      }
    } catch (err) {
      console.error("Error fetching hotel details:", err);
      setIsFetching(false);
      setHotelDetails({});
    }
  };

  return (
    <div className="hotel-detail-page">
      <div className="container py-3">
        {isFetching ? (
          <HotelDetailLoader />
        ) : (
          <div className="hotel-detail-layout">
            <div className="hotel-detail-hero-head">
              <h1 className="hotel-detail-hero-head__title">{heroHeading}</h1>
              <p className="hotel-detail-hero-head__subtitle">{heroSubheading}</p>
            </div>

            <GalleryImages
              imageList={hotelDetails?.all_images || []}
              hotelName={hotelDetails?.hotel_name}
              address={hotelDetails?.address}
              stars={starRating}
            />

            {(hotelDetails?.description || plainDescription) && (
              <section className="hotel-detail-card hotel-detail-about">
                <h3 className="hotel-detail-about__title">About this hotel</h3>
                {isHtmlDescription && descExpanded ? (
                  <div
                    className="hotel-detail-about__html"
                    dangerouslySetInnerHTML={{ __html: hotelDetails.description }}
                  />
                ) : (
                  <p
                    ref={descTextRef}
                    className={`hotel-detail-about__text${
                      (!descExpanded ? " hotel-detail-about__text--truncated" : "")
                    }`}
                  >
                    {isHtmlDescription ? plainDescription : hotelDetails.description}
                  </p>
                )}
                {needsReadMore && (
                  <button
                    type="button"
                    className="hotel-detail-link-btn"
                    onClick={() => setDescExpanded((prev) => !prev)}
                  >
                    {descExpanded ? "Read less" : "Read more"}
                  </button>
                )}
              </section>
            )}

            <div className="hotel-detail-info-row">
              <div className="hotel-detail-info-card">
                <div className="hotel-detail-info-card__icon"><IoLocationSharp /></div>
                <div>
                  <span className="hotel-detail-info-card__label">Location</span>
                  <span className="hotel-detail-info-card__value">{detailCity}</span>
                </div>
              </div>
              <div className="hotel-detail-info-card">
                <div className="hotel-detail-info-card__icon"><FiClock /></div>
                <div>
                  <span className="hotel-detail-info-card__label">Check-in</span>
                  <span className="hotel-detail-info-card__value">
                    {hotelDetails?.checkIn ? moment(hotelDetails.checkIn).format('DD MMM YYYY') : '—'}
                  </span>
                </div>
              </div>
              <div className="hotel-detail-info-card">
                <div className="hotel-detail-info-card__icon"><FiMoon /></div>
                <div>
                  <span className="hotel-detail-info-card__label">Nights</span>
                  <span className="hotel-detail-info-card__value">{totalNights} night{totalNights > 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="hotel-detail-info-card">
                <div className="hotel-detail-info-card__icon"><FaStar /></div>
                <div>
                  <span className="hotel-detail-info-card__label">Rating</span>
                  <span className="hotel-detail-info-card__value">
                    {Number(starRating) > 0 ? `${starRating} / 5.0` : 'Not rated'}
                  </span>
                </div>
              </div>
            </div>

            {facilities.length > 0 && (
              <section className="hotel-detail-card">
                <h3 className="hotel-detail-card__title">Hotel Amenities</h3>
                <div className="hotel-detail-amenity-pills">
                  {visibleFacilities.map((item, index) => (
                    <span key={index} className="hotel-detail-amenity-pill">
                      <IoMdCheckmarkCircleOutline />
                      {item}
                    </span>
                  ))}
                  {hasMoreFacilities && (
                    <button
                      type="button"
                      className="hotel-detail-link-btn"
                      onClick={() => setFacilitiesModalOpen(true)}
                    >
                      View More+
                    </button>
                  )}
                </div>
              </section>
            )}

            <FacilitiesModal
              opened={facilitiesModalOpen}
              onClose={() => setFacilitiesModalOpen(false)}
              title="Hotel Facilities"
              subtitle={hotelDetails?.hotel_name || ''}
              facilities={facilities}
            />

            <RoomList
              hotelDetail={hotelDetails}
              isPackageMode={isPackageMode}
              isEditMode={isEditMode}
              totalNights={totalNights}
            />
          </div>
        )}
      </div>
    </div>
  );
}
