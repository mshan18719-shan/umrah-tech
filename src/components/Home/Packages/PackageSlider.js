"use client";
import React, { useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css/pagination";
import Image from "next/image";
import Link from "next/link";
import moment from "moment";
import { BsWhatsapp } from "react-icons/bs";
import { FaArrowLeft, FaArrowRight, FaStar, FaStarHalfAlt, FaRegStar, FaRegCalendarAlt } from "react-icons/fa";
import { RiHotelLine, RiPlaneFill } from "react-icons/ri";
import { GiPassport } from "react-icons/gi";
import { IoCarOutline, IoWarning } from "react-icons/io5";
import PriceDisplay from "@/components/Currency/PriceDisplay";
import s from "./PackageSlider.module.css";

export default function PackageSlider({ packages }) {
    const [packagesList, setPackagesList] = React.useState(packages);

    useEffect(() => {
        setPackagesList(packages);
    }, [packages]);

    const getLowestPrice = (priceDetails) => {
        if (!priceDetails || priceDetails.length === 0) return null;
        const filteredPrices = priceDetails.filter(p => p.type?.toLowerCase() !== "without_beds");
        if (filteredPrices.length === 0) return null;
        const sortedPrices = filteredPrices.sort((a, b) => Number(a.sale_per_person) - Number(b.sale_per_person));
        const lowestPrice = sortedPrices[0];
        return lowestPrice.sale_per_person;
    };

    const renderStars = (rating) => {
        const r = Number(rating) || 0;
        const full = Math.floor(r);
        const half = r - full >= 0.5;
        return Array.from({ length: 5 }).map((_, i) => {
            if (i < full) return <FaStar key={i} />;
            if (i === full && half) return <FaStarHalfAlt key={i} />;
            return <FaRegStar key={i} />;
        });
    };

    return (
        <div className={s.sliderWrap}>
            {/* Navigation */}
            {/* <div className={s.controls}>
                <button className={`${s.navBtn} custom-prevh`} aria-label="Previous">
                    <FaArrowLeft />
                </button>
                <button className={`${s.navBtn} custom-nexth`} aria-label="Next">
                    <FaArrowRight />
                </button>
            </div> */}

            <Swiper
                className={s.packageSwiper}
                modules={[Pagination, Navigation]}
                spaceBetween={24}
                slidesPerView={1}
                slidesPerGroup={1}
                loop={packagesList.length > 3}
                watchOverflow
                navigation={{ nextEl: ".custom-nexth", prevEl: ".custom-prevh" }}
                // pagination={{ clickable: true }}
                breakpoints={{
                    320: { slidesPerView: 1, slidesPerGroup: 1 },
                    640: { slidesPerView: 2, slidesPerGroup: 2 },
                    992: { slidesPerView: 3, slidesPerGroup: 3 },
                }}
            >
                {packagesList.map((item, index) => {
                    const nights = moment(item.end_date).diff(moment(item.start_date), "days");
                    const lowestPrice = getLowestPrice(item?.price_Details);
                    const roomTypes = item?.price_Details?.filter(p => p.type?.toLowerCase() !== "without_beds") ?? [];
                    const flight = item?.flights.length > 0 ? item?.flights[0]?.stops[0] : {};
                    return (
                        <SwiperSlide key={index}>
                            <div className={`${s.card}`}>

                                {/* ── Image ── */}
                                <div className={s.imgWrap}>
                                    <Image
                                        fill
                                        src={item.featured_image}
                                        alt={item.title}
                                        className={s.cardImg}
                                        quality={50}
                                        sizes="(max-width: 640px) 100vw, (max-width: 992px) 50vw, 33vw"
                                    />
                                    <div className={s.imgGradient} />
                                    <span className={s.limitedBadge}>Limited Seats</span>

                                    {/* Stars */}
                                    <div className={s.stars}>
                                        {renderStars(item?.star_rating)}
                                    </div>

                                    {/* City chips at bottom of image */}
                                    {item.hotels?.length > 0 && (
                                        <div className={s.imgFooter}>
                                            {item.hotels.map((h, hi) => {
                                                const n = moment(h.hotel.booked_to).diff(moment(h.hotel.booked_from), "days");
                                                return (
                                                    <span key={hi} className={s.cityChip}>
                                                        {n}N · {h.hotel.city}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* ── Body ── */}
                                <div className={s.body}>

                                    {/* Title */}
                                    <h5 className={s.title}>{item.title}</h5>

                                    {/* Dates */}
                                    <div className={s.dateRow}>
                                        <span className={s.dateText}>
                                            <FaRegCalendarAlt className={s.dateIcon} />
                                            {moment(item.start_date).format("D MMM")} &ndash; {moment(item.end_date).format("D MMM YYYY")}
                                        </span>
                                        <span className={s.nightsPill}>{nights} Night{nights !== 1 ? "s" : ""}</span>
                                    </div>
                                    {item?.flights?.length > 0 && (
                                        <div className={s.departureRow} title={`Departure: ${flight?.departure_from}`}>
                                            <RiPlaneFill className={s.departureIcon} /> {flight?.departure_from}
                                        </div>
                                    )}
                                    {/* Room-type pills */}
                                    {roomTypes.length > 0 && (
                                        <div className={s.roomTypeSection}>
                                            <span className={s.roomTypeLabel}>
                                                <RiHotelLine /> Room Type
                                            </span>
                                            <div className={s.roomTypes}>
                                                {roomTypes.map((price, pi) => {
                                                    const isLowest = Number(price.sale_per_person) === Number(lowestPrice);
                                                    return (
                                                        <span
                                                            key={pi}
                                                            className={`${s.roomPill}${isLowest ? ` ${s.roomPillActive}` : ""}`}
                                                        >
                                                            {price.type}
                                                            <span className={s.roomPillPrice}>
                                                                <PriceDisplay price={price.sale_per_person} currency={item?.currency_code} />
                                                            </span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Inclusions */}
                                    <div className={s.inclusions}>
                                        <div className={s.inclusion}><span className={s.inclusionIcon}><GiPassport size={18} /></span><span className={s.inclusionLabel}>Visa</span></div>
                                        <div className={s.inclusion}><span className={s.inclusionIcon}><RiPlaneFill size={18} /></span><span className={s.inclusionLabel}>Flight</span></div>
                                        <div className={s.inclusion}><span className={s.inclusionIcon}><IoCarOutline size={18} /></span><span className={s.inclusionLabel}>Transfers</span></div>
                                        <div className={s.inclusion}><span className={s.inclusionIcon}><RiHotelLine size={18} /></span><span className={s.inclusionLabel}>Hotel</span></div>
                                    </div>

                                    {/* Seats warning */}
                                    {/* {item?.pax && (
                                        <div className={s.seatsWarn}>
                                            <IoWarning /> Only {item.pax} seats left at this price!
                                        </div>
                                    )} */}
                                </div>

                                {/* ── CTA Footer ── */}
                                <div className={s.footer}>
                                    {lowestPrice && (
                                        <div className={s.priceBlock}>
                                            <span className={s.priceFrom}>From</span>
                                            <span className={s.priceValue}>
                                                <PriceDisplay price={lowestPrice} currency={item?.currency_code} />
                                                <span className={s.pricePer}>/pp</span>
                                            </span>
                                            <span className={s.pricePer}>VAT and taxes included</span>
                                        </div>
                                    )}
                                    <div className={s.footerActions}>
                                        <a
                                            href={`https://wa.me/+447309803307?text=I'm%20interested%20in%20the%20package:%20${encodeURIComponent(item.title)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={s.btnWa}
                                            aria-label="Chat on WhatsApp"
                                        >
                                            <BsWhatsapp />
                                        </a>
                                        <Link href={`/${item?.category?.slug}/${item.slug}`} className={s.btnView}>
                                            View Package <FaArrowRight style={{ fontSize: "0.7rem" }} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    );
                })}
            </Swiper>
            
            {/* View All Packages */}
            {/* <div className={s.viewAllWrap}>
                <Link href="/packages" className={s.btnViewAll}>
                    View All Packages <FaArrowRight style={{ fontSize: "0.7rem" }} />
                </Link>
            </div> */}
        </div>
    );
}