'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { FaLocationDot } from 'react-icons/fa6'
import { FaStar, FaCheck, FaCalendarAlt, FaEye, FaMoon, FaUtensils, FaUser, FaChild } from 'react-icons/fa'
import GalleryImages from '@/components/Hotels/HotelDetail/GalleryImages'
import Image from 'next/image'
import { useUmrahPackage } from '@/contexts/UmrahPackageContext'
import PriceDisplay from '../../Currency/PriceDisplay'
import { GiCheckMark } from 'react-icons/gi'
import moment from 'moment'
import { useCurrency } from '@/util/currency'
import style from './Detail.module.css';
import { ConvertPrice } from '../../Currency/ConvertPrice'
export default function HotelsDetail({ detail, type, onNext }) {
    const { selections, updateMakkahHotelSelection, updateMadinahHotelSelection, packageData } = useUmrahPackage();
    const { currency, rates } = useCurrency();
    const [basePrice, setBasePrice] = useState(0);
    // Get current selection from context based on hotel type
    const currentSelection = type === 'makkah' ? selections.makkahHotel : selections.madinahHotel;
    const selectedRoom = currentSelection.roomIndex;
    const selectedRate = currentSelection.rateIndex;
    const [descExpanded, setDescExpanded] = useState(false);
    const [expandedAmenities, setExpandedAmenities] = useState({});
    const [facilitiesExpanded, setFacilitiesExpanded] = useState(false);
    const FACILITIES_DEFAULT_COUNT = 6;

    const isHtmlDescription = detail?.provider === 'liteapi';
    const plainDescription = useMemo(() => {
        if (!detail?.description) return '';
        if (isHtmlDescription) {
            return detail.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        return detail.description;
    }, [detail?.description, isHtmlDescription]);

    const showReadMore = plainDescription.length > 100;

    useEffect(() => {
        setDescExpanded(false);
        setExpandedAmenities({});
        setFacilitiesExpanded(false);
    }, [detail?.id, type]);

    const toggleRoomAmenities = (roomIndex) => {
        setExpandedAmenities(prev => ({ ...prev, [roomIndex]: !prev[roomIndex] }));
    };

    // Initialize base price from the selected room
    useEffect(() => {
        if (detail?.rooms && selectedRoom !== null && selectedRate !== null) {
            const room = detail.rooms[selectedRoom];
            const rate = room?.rates?.[selectedRate];
            if (rate) {
                setBasePrice(rate.price);
            }
        } else if (detail?.rooms) {
            // Fallback: find the room with selected_for_package
            for (let roomIndex = 0; roomIndex < detail.rooms.length; roomIndex++) {
                const room = detail.rooms[roomIndex];
                for (let rateIndex = 0; rateIndex < room.rates.length; rateIndex++) {
                    const rate = room.rates[rateIndex];
                    if (rate.selected_for_package === true) {
                        setBasePrice(rate.price);
                        return;
                    }
                }
            }
        }
    }, [detail, selectedRoom, selectedRate]);

    const handleRateChange = (roomIndex, rateIndex, rate) => {
        // Update context based on hotel type
        if (type === 'makkah') {
            updateMakkahHotelSelection(roomIndex, rateIndex);
        } else {
            updateMadinahHotelSelection(roomIndex, rateIndex);
        }
        setBasePrice(rate.price);
    };

    const packageBaselinePrice = useMemo(() => {
        for (const room of detail?.rooms || []) {
            const packageRate = room.rates?.find((r) => r.selected_for_package === true);
            if (packageRate) return packageRate.price;
        }
        return 0;
    }, [detail?.rooms]);

    const selectedRatePrice = useMemo(() => {
        if (detail?.rooms && selectedRoom !== null && selectedRate !== null) {
            const rate = detail.rooms[selectedRoom]?.rates?.[selectedRate];
            if (rate) return rate.price;
        }
        return packageBaselinePrice;
    }, [detail?.rooms, selectedRoom, selectedRate, packageBaselinePrice]);

    const formatPriceDifference = (price, referencePrice) => {
        const difference = price - referencePrice;
        if (difference > 0) {
            return { value: difference, display: `+${difference.toFixed(2)}` };
        } else if (difference < 0) {
            return { value: difference, display: `${difference.toFixed(2)}` };
        } else {
            return { value: 0, display: '0' };
        }
    };

    const getMealPlanPriceDifference = (price) =>
        formatPriceDifference(price, selectedRatePrice);

    const getSummaryPriceDifference = (roomIndex, price) => {
        const referencePrice = roomIndex === selectedRoom
            ? packageBaselinePrice
            : selectedRatePrice;
        return formatPriceDifference(price, referencePrice);
    };

    return (
        <div>
            <GalleryImages imageList={detail?.all_images || []}  type='umrah-getaway'/>
            <div className={style.hotelInfoCard}>
                <div className={style.hotelInfoHeader}>
                    <span className={style.cityBadge}>{type === 'makkah' ? 'Makkah Hotel' : 'Madinah Hotel'}</span>
                    <h2 className={style.hotelName}>{detail?.name}</h2>
                    {detail?.location?.address && (
                        <p className={style.hotelAddress}>
                            <FaLocationDot size={14} />
                            <span>{detail.location.address}</span>
                        </p>
                    )}
                </div>

                <div className={style.hotelStatsBar}>
                    {detail?.nights && (
                        <div className={style.hotelStatChip}>
                            <FaMoon size={14} color="#02245E" />
                            <div>
                                <span className={style.hotelStatLabel}>Stay</span>
                                <span className={style.hotelStatValue}>{detail.nights} {detail.nights === 1 ? 'Night' : 'Nights'}</span>
                            </div>
                        </div>
                    )}
                    {detail?.check_in && (
                        <div className={style.hotelStatChip}>
                            <FaCalendarAlt size={14} color="#02245E" />
                            <div>
                                <span className={style.hotelStatLabel}>Check-in</span>
                                <span className={style.hotelStatValue}>{moment(detail.check_in).format('DD MMM YYYY')}</span>
                            </div>
                        </div>
                    )}
                    {detail?.check_out && (
                        <div className={style.hotelStatChip}>
                            <FaCalendarAlt size={14} color="#02245E" />
                            <div>
                                <span className={style.hotelStatLabel}>Check-out</span>
                                <span className={style.hotelStatValue}>{moment(detail.check_out).format('DD MMM YYYY')}</span>
                            </div>
                        </div>
                    )}
                    {detail?.star_rating && !isNaN(parseFloat(detail.star_rating)) && (
                        <div className={style.hotelStatChip}>
                            <FaStar size={14} color="#02245E" />
                            <div>
                                <span className={style.hotelStatLabel}>Rating</span>
                                <span className={style.hotelStatValue}>{parseFloat(detail.star_rating)}-Star</span>
                            </div>
                        </div>
                    )}
                    {detail?.haram_view && (
                        <div className={`${style.hotelStatChip} ${style.hotelStatChipGreen}`}>
                            <FaEye size={14} color="#15803d" />
                            <span className={style.hotelStatValueGreen}>Haram View</span>
                        </div>
                    )}
                    {detail?.kaaba_view && (
                        <div className={`${style.hotelStatChip} ${style.hotelStatChipGreen}`}>
                            <FaEye size={14} color="#15803d" />
                            <span className={style.hotelStatValueGreen}>Kaaba View</span>
                        </div>
                    )}
                </div>

                {plainDescription && (
                    <div className={style.descriptionSection}>
                        <h3 className={style.descriptionTitle}>About this hotel</h3>
                        {descExpanded ? (
                            isHtmlDescription ? (
                                <div
                                    className={style.descriptionHtml}
                                    dangerouslySetInnerHTML={{ __html: detail.description }}
                                />
                            ) : (
                                <p className={style.descriptionText}>{detail.description}</p>
                            )
                        ) : (
                            <p className={`${style.descriptionText} ${style.descriptionCollapsed}`}>
                                {plainDescription}
                            </p>
                        )}
                        {showReadMore && (
                            <button
                                type="button"
                                className={style.readMoreBtn}
                                onClick={() => setDescExpanded(prev => !prev)}
                            >
                                {descExpanded ? 'Read less' : 'Read more'}
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div className={style.roomsSection}>
                <h5 className={style.roomsSectionTitle}>Rooms Available</h5>
                {(detail?.rooms || []).map((room, roomIndex) => (
                    <div key={roomIndex} className={style.roomCard}>
                        <div className='row g-0'>
                            {/* ── Image + Amenities ── */}
                            <div className={`col-md-3 ${style.roomImageCol}`}>
                                <p className={style.roomName}>{room.name}</p>
                                <Image
                                    className={style.roomImg}
                                    src={room?.images && room.images !== null && room.images.length > 0 ? room.images[0]?.url : '/images/noimage.png'}
                                    height={130} width={300}
                                    alt={`Room${roomIndex + 1} image`}
                                />
                                {room?.amenities?.length > 0 && (
                                    <div className={style.amenitiesWrap}>
                                        <button
                                            type="button"
                                            className={style.seeAmenitiesBtn}
                                            onClick={() => toggleRoomAmenities(roomIndex)}
                                        >
                                            {expandedAmenities[roomIndex] ? 'Hide amenities' : `See amenities (${room.amenities.length})`}
                                        </button>
                                        {expandedAmenities[roomIndex] && (
                                            <div className={style.amenitiesList}>
                                                {room.amenities.slice(0, 10).map((facility, idx) => (
                                                    <span key={idx} className={style.amenityTag}>
                                                        <FaCheck size={9} /> {facility?.description?.content}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── Meal Plan + Cancellation ── */}
                            <div className={`col-md-6 ${style.mealPlanCol}`}>
                                <div className={style.mealPlanHeader}>
                                    <FaUtensils size={13} />
                                    <span>Meal Plan</span>
                                </div>
                                <div className={style.mealPlanList}>
                                    {room?.rates.map((rate, rateIndex) => {
                                        const priceDiff = getMealPlanPriceDifference(rate.price);
                                        const isSelected = roomIndex === selectedRoom && rateIndex === selectedRate;
                                        const priceClass =
                                            priceDiff.value > 0
                                                ? style.mealPriceUp
                                                : priceDiff.value < 0
                                                    ? style.mealPriceDown
                                                    : style.mealPriceIncluded;

                                        return (
                                            <button
                                                type="button"
                                                key={rateIndex}
                                                className={`${style.mealOption} ${isSelected ? style.mealOptionSelected : ''}`}
                                                onClick={() => handleRateChange(roomIndex, rateIndex, rate)}
                                                aria-pressed={isSelected}
                                            >
                                                <div className={style.mealOptionMain}>
                                                    <span className={style.mealOptionRadio} aria-hidden="true">
                                                        {isSelected && <span className={style.mealOptionRadioDot} />}
                                                    </span>
                                                    <div className={style.mealOptionInfo}>
                                                        <span className={style.mealOptionName}>{rate?.board_name}</span>
                                                        <div className={style.mealOptionGuests}>
                                                            <span className={style.guestChip}>
                                                                <FaUser size={9} />
                                                                {rate?.adults} Adult{rate?.adults !== 1 ? 's' : ''}
                                                            </span>
                                                                <span className={style.guestChip}>
                                                                    <FaChild size={9} />
                                                                    {rate?.children} Child{rate?.children !== 1 ? 'ren' : ''}
                                                                </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`${style.mealOptionPrice} ${priceClass}`}>
                                                    {priceDiff.value === 0 && isSelected ? (
                                                        'Included'
                                                    ) : (
                                                        <PriceDisplay currency={packageData?.currency} price={priceDiff.display} />
                                                    )}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                               
                                {/* <div className={style.cancellationBox}>
                                    <p className={style.cancellationTitle}>Cancellation Policy</p>
                                    {(() => {
                                        const selectedRateForRoom = roomIndex === selectedRoom
                                            ? room.rates[selectedRate] ?? room.rates[0]
                                            : room.rates[0];
                                        const policies = selectedRateForRoom?.cancellation_policies;
                                        const rateCurrency = selectedRateForRoom?.currency;

                                        if (!Array.isArray(policies) || policies.length === 0) {
                                            return <p className='small text-danger mb-0 fw-semibold'>✗ Non-refundable</p>;
                                        }

                                        const sorted = [...policies].sort((a, b) =>
                                            moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
                                        );
                                        const now = moment.utc();

                                        return sorted.map((policy, pi) => {
                                            const fromDate = moment.utc(policy.from);
                                            const isFuture = fromDate.isAfter(now);
                                            const amount = Number(policy.amount);

                                            if (amount === 0) {
                                                return (
                                                    <p key={pi} className='small text-success mb-1'>
                                                        ✓ Free cancellation before {fromDate.format('DD MMMM YYYY')}
                                                    </p>
                                                );
                                            }

                                            const converted = ConvertPrice(policy.amount, rateCurrency, currency, rates);
                                            return (
                                                <p key={pi} className={`small mb-1 ${isFuture ? 'text-warning' : 'text-danger'} fw-semibold`}>
                                                    From {fromDate.format('DD MMMM YYYY')}: {converted.newcurrency} {Number(converted.newprice).toFixed(2)} will be charged
                                                </p>
                                            );
                                        });
                                    })()}
                                </div> */}
                            </div>

                            {/* ── Price + Action ── */}
                            <div className={`col-md-3 ${style.priceCol}`}>
                                {(() => {
                                    const bestRateIndex = room.rates.findIndex((r, idx) =>
                                        roomIndex === selectedRoom && idx === selectedRate
                                    );
                                    const displayRateIndex = bestRateIndex !== -1 ? bestRateIndex : 0;
                                    const displayRate = room.rates[displayRateIndex];
                                    const priceDiff = getSummaryPriceDifference(roomIndex, displayRate.price);

                                    return (
                                        <>
                                        {priceDiff.value > 0 ? (
                                            <span className={style.roompricediff}>Total Extra Cost </span>
                                        ):(
                                            <span className={style.roompricediffup}>Total savings</span>
                                        )}
                                            <span className={style.roomPriceMain} style={{ color: priceDiff.value > 0 ? '#dc3545' : '#28a745' }}>
                                                <PriceDisplay currency={packageData?.currency} price={priceDiff.display} />
                                            </span>
                                             <span className='small' style={{fontSize : '12px'}}>Vat and Taxes included</span>
                                            {/* {priceDiff.value !== 0 && (
                                                <p className={`${style.priceDiffNote} mb-1`} style={{ color: priceDiff.value > 0 ? '#dc3545' : '#28a745' }}>
                                                    (<PriceDisplay currency={packageData?.currency} price={priceDiff.display} />)
                                                </p>
                                            )} */}
                                            {priceDiff.value === 0 && roomIndex === selectedRoom && (
                                                <span className={style.includedBadge}>Included in package</span>
                                            )}
                                            <button
                                                className={`btn ${style.selectRoomBtn} ${roomIndex === selectedRoom ? 'btn-success' : 'btn-outline-success'}`}
                                                onClick={() => {
                                                    if (roomIndex !== selectedRoom) {
                                                        if (type === 'makkah') {
                                                            updateMakkahHotelSelection(roomIndex, 0);
                                                        } else {
                                                            updateMadinahHotelSelection(roomIndex, 0);
                                                        }
                                                    } else if (onNext) {
                                                        onNext();
                                                    }
                                                }}
                                            >
                                                {roomIndex === selectedRoom ? 'Confirm & Continue' : 'Select Room'}
                                            </button>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {detail?.facilities?.length > 0 && (() => {
                const hasMoreFacilities = detail.facilities.length > FACILITIES_DEFAULT_COUNT;
                const visibleFacilities = facilitiesExpanded
                    ? detail.facilities
                    : detail.facilities.slice(0, FACILITIES_DEFAULT_COUNT);

                return (
                <div className={style.facilitiesSection}>
                    <div className={style.facilitiesGrid}>
                        <div className={style.sectionLabel}>
                            <span>Hotel Facilities</span>
                            <div className={style.sectionLine} />
                        </div>
                        <div className="row row-cols-2 row-cols-sm-4">
                            {visibleFacilities.map((amenity, index) => (
                                <div key={index} className="col-12 col-sm-6 col-md-4 col-lg-3 mt-2">
                                    <div className={style.facilityTile}>
                                        <div className={style.facilityIcon}>
                                            <GiCheckMark size={11} color="#16a34a" />
                                        </div>
                                        {amenity}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {hasMoreFacilities && (
                            <button
                                type="button"
                                className={style.readMoreBtn}
                                onClick={() => setFacilitiesExpanded(prev => !prev)}
                            >
                                {facilitiesExpanded
                                    ? 'View less'
                                    : `View more (${detail.facilities.length - FACILITIES_DEFAULT_COUNT} more)`}
                            </button>
                        )}
                    </div>
                </div>
                );
            })()}
        </div>
    )
}
