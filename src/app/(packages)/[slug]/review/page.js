'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { FaStar, FaStarHalf, FaPlane, FaCheck, FaChevronLeft, FaChevronRight, FaLongArrowAltRight } from 'react-icons/fa';
import { FaLocationDot, FaHotel as FaHotelIcon, FaBus } from 'react-icons/fa6';
import { MdOutlineDirectionsWalk, MdAccessTime } from 'react-icons/md';
import { GiPassport } from 'react-icons/gi';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import { usePackageStore } from '@/components/Store/PackageStore';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import styles from './PackageReview.module.css';

function getAmenities(hotel) {
  const raw = hotel?.amenities || hotel?.facilities || hotel?.facility_list || [];
  if (Array.isArray(raw)) {
    return raw
      .map((a) => (typeof a === 'string' ? a : a?.name || a?.title))
      .filter(Boolean);
  }
  return [];
}

function calcDuration(from, to) {
  const diff = moment(to).diff(moment(from), 'minutes');
  if (!diff || diff < 0) return null;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}H ${m}M` : `${m}M`;
}

function airportCode(text) {
  if (!text) return '';
  const match = String(text).match(/\(([A-Z]{3})\)/);
  if (match) return match[1];
  const parts = String(text).trim().split(/[\s,]+/);
  const last = parts[parts.length - 1];
  return last && last.length <= 4 ? last.toUpperCase() : String(text).slice(0, 3).toUpperCase();
}

function formatTripType(type) {
  const labels = { 'one-way': 'One Way', return: 'Return', 'all-round': 'All Round' };
  return labels[type] || type;
}

export default function PackageReviewPage() {
  const router = useRouter();
  const { selectedPackage, setSelectedPackage } = usePackageStore();
  const [pkg, setPkg] = useState({});
  const [selectedServices, setSelectedServices] = useState([]);
  const [servicesTotal, setServicesTotal] = useState(0);

  useEffect(() => {
    setPkg(selectedPackage || {});
    const saved = selectedPackage?.selected_services || [];
    setSelectedServices(saved);
    setServicesTotal(
      saved.reduce((acc, s) => acc + Number(s.total || 0), 0)
    );
  }, [selectedPackage]);

  const hotels = pkg?.hotels || [];
  const transfers = pkg?.transfers || [];
  const visas = pkg?.visas || [];
  const additionalServices = pkg?.additional_services || [];

  const allFlightLegs = useMemo(() => {
    const legs = [];
    (pkg?.flights || []).forEach((flight) => {
      (flight.stops || []).forEach((stop) => {
        legs.push(stop);
      });
    });
    return legs.sort((a, b) => {
      const aReturn = a.is_return === true ? 1 : 0;
      const bReturn = b.is_return === true ? 1 : 0;
      if (aReturn !== bReturn) return aReturn - bReturn;
      return moment.utc(a.datetime_from).valueOf() - moment.utc(b.datetime_from).valueOf();
    });
  }, [pkg?.flights]);

  const hasFlights = allFlightLegs.length > 0;

  const subtitleParts = [];
  if (hotels.length) subtitleParts.push('Hotel');
  if (hasFlights) subtitleParts.push('Flight');
  if (transfers.length) subtitleParts.push('Transfers');
  if (visas.length) subtitleParts.push('Visa Services');

  const handleServiceToggle = (service) => {
    const isSelected = selectedServices.find((r) => r.id === service.id);
    let updated;
    if (isSelected) {
      updated = selectedServices.filter((r) => r.id !== service.id);
    } else {
      updated = [
        ...selectedServices,
        {
          id: service.id,
          name: service.name,
          price_per_person: service.price,
          quantity: 1,
          total: service.price,
        },
      ];
    }
    const total = updated.reduce((acc, curr) => acc + Number(curr.total), 0);
    setSelectedServices(updated);
    setServicesTotal(total);
  };

  const continueToCheckout = () => {
    const next = {
      ...pkg,
      selected_services: selectedServices,
      services_total: servicesTotal,
    };
    setSelectedPackage(next);
    router.push(`/${pkg?.category?.slug}/checkout`);
  };

  const backHref = pkg?.category?.slug && pkg?.slug
    ? `/${pkg.category.slug}/${pkg.slug}/selection`
    : '/';

  if (!pkg?.id && !pkg?.title) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.empty}>No package selected. Please choose a package first.</p>
          <Link href="/" className={styles.backLink}>Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>Review Your Booking</h1>
          <p className={styles.subtitle}>
            {subtitleParts.length
              ? `${subtitleParts.join(', ')}.`
              : 'Hotel, Flight, Transfers, Visa Services.'}
          </p>
        </header>

        {/* Hotels */}
        {hotels.length > 0 && (
          <section className={styles.section}>
            <div className={styles.hotelList}>
              {hotels.map((item, index) => {
                const hotel = item?.hotel || {};
                const rating = Number(hotel?.rating);
                const fullStars = Math.floor(rating);
                const hasHalfStar = rating % 1 >= 0.5;
                const amenities = getAmenities(hotel);
                const visibleAmenities = amenities.slice(0, 3);
                const roomAmenities = (item?.rooms || [])
                  .slice(0, 3)
                  .map((room) =>
                    `${room?.type || ''}${room?.items?.data?.meal ? ` · ${room.items.data.meal}` : ''}`.trim()
                  )
                  .filter(Boolean);
                const visible = visibleAmenities.length ? visibleAmenities : roomAmenities;
                const more = Math.max((amenities.length || roomAmenities.length) - visible.length, 0);
                const distance =
                  hotel?.distance_from_haram ||
                  hotel?.distance ||
                  hotel?.haram_distance ||
                  null;
                const walkMins = hotel?.walking_minutes || hotel?.walk_time || null;

                return (
                  <article key={index} className={styles.hotelCard}>
                    <div className={styles.hotelMedia}>
                      {hotel?.featured_image ? (
                        <Image
                          fill
                          sizes="(max-width: 768px) 100vw, 220px"
                          src={hotel.featured_image}
                          alt={hotel?.name || 'Hotel'}
                          className={styles.hotelImage}
                        />
                      ) : (
                        <div className={styles.hotelPlaceholder}>
                          <FaHotelIcon size={28} />
                        </div>
                      )}
                    </div>
                    <div className={styles.hotelBody}>
                      <div className={styles.hotelTop}>
                        <div className={styles.stars}>
                          {rating > 0 ? (
                            <>
                              {Array(fullStars).fill(0).map((_, i) => (
                                <FaStar key={i} size={13} />
                              ))}
                              {hasHalfStar && <FaStarHalf size={13} />}
                            </>
                          ) : null}
                        </div>
                        <span className={styles.bookingDate}>
                          ({hotel?.booked_from ? moment(hotel.booked_from).format('DD-MM-YYYY') : ''} <FaLongArrowAltRight /> {hotel?.booked_to ? moment(hotel.booked_to).format('DD-MM-YYYY') : ''})
                        </span>
                      </div>
                      <h2 className={styles.hotelName}>{hotel?.name || 'Hotel'}</h2>
                      {hotel?.address && (
                        <p className={styles.hotelAddress}>
                          <FaLocationDot size={12} />
                          <span>{hotel.address}</span>
                        </p>
                      )}
                      {(visible.length > 0 || more > 0) && (
                        <div className={styles.amenityRow}>
                          {visible.map((a, i) => (
                            <span key={i} className={styles.amenityChip}>{a}</span>
                          ))}
                          {more > 0 && (
                            <span className={styles.amenityChip}>+{more} more</span>
                          )}
                        </div>
                      )}
                      {(distance || walkMins) && (
                        <div className={styles.metaRow}>
                          {distance && (
                            <span className={styles.metaChip}>
                              <MdOutlineDirectionsWalk size={14} />
                              {distance}
                            </span>
                          )}
                          {walkMins && (
                            <span className={styles.metaChip}>
                              <MdAccessTime size={13} />
                              {walkMins}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Flights — one row per stop/leg */}
        {hasFlights && (
          <section className={styles.section}>
            <div className={styles.flightCard}>
              {allFlightLegs.map((leg, index) => {
                const isReturn = leg.is_return === true;
                const duration = calcDuration(leg.datetime_from, leg.datetime_to);
                const stopCount = Number(leg.stops_count) || 0;

                return (
                  <div key={index} className={styles.flightLeg}>
                    <div className={styles.flightLegTop}>
                      <span
                        className={`${styles.legBadge} ${
                          isReturn ? styles.legBadgeReturn : styles.legBadgeDepart
                        }`}
                      >
                        {isReturn ? 'RETURN' : 'DEPARTURE'}
                      </span>
                      <span className={styles.legDate}>
                        {moment.utc(leg.datetime_from).format('ddd, DD MMM YYYY')}
                      </span>
                    </div>

                    <div className={styles.flightLegBody}>
                      <div className={styles.airlineCol}>
                        <div
                          className={styles.airlineName}
                          title={leg.airline_name || 'Airline'}
                        >
                          {leg.airline_name || 'Airline'}
                        </div>
                        {leg.flight_number && (
                          <div className={styles.cabinClass} title={leg.flight_number}>
                            {leg.flight_number}
                          </div>
                        )}
                        <div className={styles.cabinClass}>Economy</div>
                      </div>

                      <div className={styles.endpoint}>
                        <span className={styles.time}>
                          {moment.utc(leg.datetime_from).format('h:mm A')}
                        </span>
                        <span className={styles.code}>
                          {airportCode(leg.departure_from)}
                        </span>
                        <span className={styles.place} title={leg.departure_from || ''}>
                          {leg.departure_from}
                        </span>
                      </div>

                      <div className={styles.route}>
                        {duration && (
                          <span className={styles.duration}>DURATION {duration}</span>
                        )}
                        <div className={styles.routeLineWrap}>
                          <span className={styles.routeLine} />
                          <FaPlane className={styles.routePlane} size={12} />
                        </div>
                        <span className={styles.stopBadge}>
                          {stopCount > 0
                            ? `${stopCount} STOP${stopCount > 1 ? 'S' : ''}`
                            : 'DIRECT'}
                        </span>
                      </div>

                      <div className={`${styles.endpoint} ${styles.endpointEnd}`}>
                        <span className={styles.time}>
                          {moment.utc(leg.datetime_to).format('h:mm A')}
                          {moment.utc(leg.datetime_to).isAfter(
                            moment.utc(leg.datetime_from),
                            'day'
                          ) && <sup className={styles.dayPlus}>+1</sup>}
                        </span>
                        <span className={styles.code}>
                          {airportCode(leg.departure_to)}
                        </span>
                        <span className={styles.place} title={leg.departure_to || ''}>
                          {leg.departure_to}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Transfers + Visa + Extra services */}
        <section className={styles.serviceGrid}>
          {transfers.length > 0 ? (
            transfers.map((item, index) => {
              const locs = item?.locations || [];
              const firstLoc = locs[0];
              const route = firstLoc
                ? `${firstLoc.pickup_address || 'Pickup'} → ${firstLoc.dropoff_address || 'Dropoff'}`
                : item?.vehicle || 'Ground Transfer';
              return (
                <div key={`tr-${index}`} className={styles.serviceCard}>
                  <div className={styles.serviceIcon} aria-hidden="true">
                    <FaBus size={18} />
                  </div>
                  <div className={styles.serviceBody}>
                    <h3 className={styles.serviceTitle}>
                      {item?.vehicle || 'Transfer'}
                    </h3>
                    <p className={styles.serviceSub}>
                      {[route, formatTripType(item?.trip_type)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className={styles.serviceAction}>
                    <span className={styles.servicePrice}>Included</span>
                    <span className={styles.btnAdded}>
                      <FaCheck size={11} /> Added
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.serviceCard}>
              <div className={styles.serviceIcon} aria-hidden="true">
                <FaBus size={18} />
              </div>
              <div className={styles.serviceBody}>
                <h3 className={styles.serviceTitle}>Transfers</h3>
                <p className={styles.serviceSub}>As per package inclusions</p>
              </div>
              <div className={styles.serviceAction}>
                <span className={styles.servicePrice}>Included</span>
                <span className={styles.btnAdded}>
                  <FaCheck size={11} /> Added
                </span>
              </div>
            </div>
          )}

          {visas.length > 0 ? (
            visas.map((item, index) => (
              <div key={`visa-${index}`} className={styles.serviceCard}>
                <div className={`${styles.serviceIcon} ${styles.serviceIconDark}`} aria-hidden="true">
                  <GiPassport size={18} />
                </div>
                <div className={styles.serviceBody}>
                  <h3 className={styles.serviceTitle}>
                    {item?.visa_type || 'Visa Service'}
                  </h3>
                  <p className={styles.serviceSub}>
                    {item?.visa_description ||
                      'Full visa processing — we handle all documentation and embassy submissions'}
                  </p>
                </div>
                <div className={styles.serviceAction}>
                  <span className={styles.servicePrice}>Included</span>
                  <span className={styles.btnAdded}>
                    <FaCheck size={11} /> Added
                  </span>
                </div>
              </div>
            ))
          ) : null}

          {additionalServices.map((service) => {
            const isOn = selectedServices.some((s) => s.id === service.id);
            return (
              <div key={service.id} className={styles.serviceCard}>
                <div className={`${styles.serviceIcon} ${styles.serviceIconDark}`} aria-hidden="true">
                  <GiPassport size={18} />
                </div>
                <div className={styles.serviceBody}>
                  <h3 className={styles.serviceTitle}>{service?.name}</h3>
                  <p className={styles.serviceSub}>Optional add-on for your package</p>
                </div>
                <div className={styles.serviceAction}>
                  <span className={styles.servicePrice}>
                    +<PriceDisplay price={service.price} currency={pkg?.currency_code} />
                  </span>
                  <button
                    type="button"
                    className={isOn ? styles.btnAdded : styles.btnSelect}
                    onClick={() => handleServiceToggle(service)}
                  >
                    {isOn ? (
                      <>
                        <FaCheck size={11} /> Added
                      </>
                    ) : (
                      'Select'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Footer bar */}
        <div className={styles.footerBar}>
          <Link href={backHref} className={styles.backLink}>
            <FaChevronLeft size={12} /> Back to Rooms
          </Link>
          <div className={styles.trustNote}>
            <HiOutlineShieldCheck size={16} />
            ATOL Protected - No hidden fees
          </div>
          <button type="button" className={styles.continueBtn} onClick={continueToCheckout}>
            Continue to Checkout <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
