'use client'
import styles from "./invoice.module.css";
import moment from "moment";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HotelInvoiceLoader from "@/components/Loader/HotelInvoiceLoader";
import {
    FaBus, FaFileInvoice, FaHotel, FaPlaneArrival, FaPlaneDeparture,
    FaUser, FaUserFriends, FaHome, FaStar, FaConciergeBell, FaPassport,
    FaCheckCircle, FaPhone, FaEnvelope, FaGlobe, FaCalendarAlt, FaMapMarkerAlt,
} from "react-icons/fa";
import { MdFlight, MdOutlineFileDownload } from "react-icons/md";
import Link from "next/link";

export default function Page() {
    const { id } = useParams();
    const ref = useRef();
    const [voucherDetail, setVoucherDetail] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    useEffect(() => {
        document.body.style.backgroundColor = '#efefef';
        fetchDetails();
        return () => { document.body.style.backgroundColor = ''; };
    }, [id]);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/holiday-packages/booking/${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const res = await responses.json();
            setIsLoading(false);
            if (res.Success) {
                setVoucherDetail(res?.Content);
            } else {
                setErrorMessage(res?.Title);
            }
        } catch (err) {
            setIsLoading(false);
            console.error("Error fetching package details:", err);
        }
    };


    function capitalize(text) {
        if (!text) return "";
        return String(text).charAt(0).toUpperCase() + String(text).slice(1);
    }

    function convertToCustomerCurrency(price) {
        if (!price || !voucherDetail.customer_exchange_rate) return Number(price || 0).toFixed(2);
        if (voucherDetail.currency_code === voucherDetail.customer_currency) {
            return Number(price).toFixed(2);
        }
        const convertedPrice = Number(price) * Number(voucherDetail.customer_exchange_rate);
        return convertedPrice.toFixed(2);
    }

    function capitalizeString(str) {
        if (!str) return "";
        return str.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    }


    return (
        <div className={styles.pageWrapper}>
            {isLoading ? (
                <div className={`container px-0 ${styles.confirmationWrapper}`}>
                    <div className="bg-white rounded shadow p-3">
                        <HotelInvoiceLoader />
                    </div>
                </div>
            ) : errorMessage ? (
                <div className={`container px-0 ${styles.confirmationWrapper}`}>
                    <div className={styles.errormessagecontainer}>
                        <div className={styles.errormessagebox}>
                            <div className={styles.erroricon}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="64" height="64">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <h2 className={styles.errortitle}>Oops! Something went wrong</h2>
                            <p className={styles.errordescription}>{errorMessage}</p>
                            <Link href="/" className={styles.errorhomebutton}>
                                <FaHome size={16} />
                                <span>Back to Home</span>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`container px-0 ${styles.confirmationWrapper}`}>
                    <div ref={ref} className={styles.voucherCard}>

                        {/* ── Watermark ── */}
                        <div className={styles.watermark}>
                            <Image src='/watermark.png' width={450} height={450}
                                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                                alt="Watermark" quality={100} />
                        </div>

                        {/* ── Invoice Header (Hotel Invoice Style) ── */}
                        <div className={styles.invHeader}>
                            {/* Left panel */}
                            <div className={styles.invHeaderLeft}>
                                <div className={`${styles.invHeaderLogo} text-center`}>
                                    <Image src='/images/logoblack.png' height={100} width={150} className="h-auto" quality={100} alt="Logo" />
                                </div>
                                <div className={styles.invHeaderMeta}>
                                    <span>
                                        <FaCalendarAlt size={13} className={styles.invMetaIcon} />
                                        Date: <b>{moment(voucherDetail?.created_at).format('DD-MM-YYYY')}</b>
                                    </span>
                                    <span>
                                        <FaFileInvoice size={13} className={styles.invMetaIcon} />
                                        No: <b>{voucherDetail?.booking_reference}</b>
                                    </span>
                                </div>
                                <div className={styles.invHeaderTitle}>INVOICE</div>
                            </div>
                            {/* Right panel */}
                            <div className={styles.invHeaderRight}>
                                <div className={styles.invBookingFor}>Booking For:</div>
                                <div className={styles.invGuestName}>
                                    {voucherDetail?.lead_details?.title} {voucherDetail?.lead_details?.firstName} {voucherDetail?.lead_details?.lastName}
                                </div>
                                <div className={styles.invHeaderDivider} />
                                <div className={styles.invContactInfo}>
                                    {voucherDetail?.lead_details?.country && (
                                        <p>
                                            <FaMapMarkerAlt size={12} className={styles.invContactIcon} />
                                            {voucherDetail.lead_details.country}
                                        </p>
                                    )}
                                    {voucherDetail?.lead_details?.email && (
                                        <p><FaEnvelope size={12} className={styles.invContactIcon} />{voucherDetail.lead_details.email}</p>
                                    )}
                                    {voucherDetail?.lead_details?.phone && (
                                        <p><FaPhone size={12} className={styles.invContactIcon} />{voucherDetail.lead_details.phoneCode}{voucherDetail.lead_details.phone}</p>
                                    )}
                                </div>
                                <div className={styles.invHeaderDivider} />
                                <div className={styles.invStatusRow}>
                                    <span className={`${styles.invStatusBadge} ${voucherDetail?.booking_status === 'confirmed'
                                        ? styles.confirmedStatus
                                        : voucherDetail?.booking_status === 'cancelled'
                                            ? styles.cancelledStatus
                                            : styles.pandingStatus}`}>
                                        <FaCheckCircle size={12} />
                                        STATUS: {voucherDetail?.booking_status?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── Gold Divider ── */}
                        {/* <div className={styles.goldDivider} /> */}

                        <div className={styles.downloadinner}>
                            {/* ══════════════════════════════════
                                PACKAGE DETAILS
                            ══════════════════════════════════ */}
                            <div className={styles.sectionBlock}>
                                {/* <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaStar size={12} /></span>
                                        PACKAGE DETAILS
                                    </div>
                                </div> */}
                                <div className={styles.accomHeader}>
                                    <span className={styles.accomTitle}>• Package Details</span>
                                </div>
                                <div className={styles.accomDivider}></div>
                                <div className={styles.packageInfoGrid}>
                                    <div className={styles.packageInfoMain}>
                                        <h3 className={styles.packageTitle}>
                                            {voucherDetail?.package_context?.searchData?.leavingFrom?.city} &rarr; {voucherDetail?.package_context?.searchData?.goingTo?.city}
                                        </h3>
                                        <p style={{ fontSize: 13, color: '#555', margin: '4px 0 0' }}>
                                            Services: {(voucherDetail?.package_context?.services || []).map(s => capitalize(s)).join(', ')}
                                        </p>
                                    </div>
                                    <div className={styles.packageInfoDates}>
                                        <div className={styles.hotelDateRow}>
                                            <span className={styles.hotelDateLabel}>Check-In:</span>
                                            <span className={styles.hotelDateValue}>{moment(voucherDetail?.package_context?.searchData?.dates?.checkIn).format('DD MMMM YYYY')}</span>
                                        </div>
                                        <div className={styles.hotelDateRow}>
                                            <span className={styles.hotelDateLabel}>Check-Out:</span>
                                            <span className={styles.hotelDateValue}>{moment(voucherDetail?.package_context?.searchData?.dates?.checkOut).format('DD MMMM YYYY')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ══════════════════════════════════
                                BOOKED BY
                            ══════════════════════════════════ */}
                            <div className={styles.sectionBlock}>
                                <div className={styles.accomHeader}>
                                    <span className={styles.accomTitle}>• Booked By</span>
                                </div>
                                <div className={styles.accomDivider}></div>
                                <div className="p-3">
                                    <table className={styles.premiumTable}>
                                        <thead>
                                            <tr>
                                                <th>Full Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Gender</th>
                                                <th>Country</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ fontWeight: 600 }}>
                                                    {voucherDetail?.lead_details?.title} {voucherDetail?.lead_details?.firstName} {voucherDetail?.lead_details?.lastName}
                                                </td>
                                                <td>{voucherDetail?.lead_details?.email || '—'}</td>
                                                <td>{voucherDetail?.lead_details?.phoneCode}{voucherDetail?.lead_details?.phone || '—'}</td>
                                                <td>{capitalize(voucherDetail?.lead_details?.gender) || '—'}</td>
                                                <td>{voucherDetail?.lead_details?.country || '—'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    {voucherDetail?.lead_address && (
                                        <div className={styles.addressRow}>
                                            <span className={styles.addressLabel}>Address:</span>
                                            <span className={styles.addressValue}>{voucherDetail?.lead_address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ══════════════════════════════════
                                ADDITIONAL GUESTS
                            ══════════════════════════════════ */}
                            {(voucherDetail?.other_passengers?.additional_adults?.length > 0
                                || voucherDetail?.other_passengers?.children_details?.length > 0
                                || voucherDetail?.other_passengers?.infants_details?.length > 0
                            ) && (
                                    <div className={styles.sectionBlock}>

                                        <div className={styles.accomHeader}>
                                            <span className={styles.accomTitle}>• Additional Guests</span>

                                        </div>
                                        <div className={styles.accomDivider}></div>
                                        <div className="p-3">
                                            <table className={styles.premiumTable}>
                                                <thead>
                                                    <tr>
                                                        <th className={styles.srCell}>#</th>
                                                        <th>Full Name</th>
                                                        <th>Gender</th>
                                                        <th>Type</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {voucherDetail?.other_passengers?.additional_adults?.map((adult, i) => (
                                                        <tr key={`adult-${i}`}>
                                                            <td className={styles.srCell}>{i + 1}</td>
                                                            <td style={{ fontWeight: 600 }}>{adult.title} {adult.firstName} {adult.lastName}</td>
                                                            <td>{capitalize(adult.gender)}</td>
                                                            <td><span className={styles.typeBadge}>Adult</span></td>
                                                        </tr>
                                                    ))}
                                                    {voucherDetail?.other_passengers?.children_details?.map((child, i) => (
                                                        <tr key={`child-${i}`}>
                                                            <td className={styles.srCell}>{(voucherDetail?.other_passengers?.additional_adults?.length || 0) + i + 1}</td>
                                                            <td style={{ fontWeight: 600 }}>{child.title} {child.firstName} {child.lastName}</td>
                                                            <td>{capitalize(child.gender)}</td>
                                                            <td><span className={`${styles.typeBadge} ${styles.typeBadgeChild}`}>Child</span></td>
                                                        </tr>
                                                    ))}
                                                    {voucherDetail?.other_passengers?.infants_details?.map((infant, i) => {
                                                        const offset = (voucherDetail?.other_passengers?.additional_adults?.length || 0) + (voucherDetail?.other_passengers?.children_details?.length || 0);
                                                        return (
                                                            <tr key={`infant-${i}`}>
                                                                <td className={styles.srCell}>{offset + i + 1}</td>
                                                                <td style={{ fontWeight: 600 }}>{infant.title} {infant.firstName} {infant.lastName}</td>
                                                                <td>{capitalize(infant.gender)}</td>
                                                                <td><span className={`${styles.typeBadge} ${styles.typeBadgeInfant}`}>Infant</span></td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                            {/* ══════════════════════════════════
                                ACCOMMODATION DETAILS
                            ══════════════════════════════════ */}
                            {voucherDetail?.package_context?.hotel?.name && (
                                <div className={styles.sectionBlock}>
                                    <div className={styles.accomHeader}>
                                        <span className={styles.accomTitle}>•  Accommodation Details</span>
                                        <span className={styles.accomCity}>
                                            {moment(voucherDetail?.package_context?.hotel?.checkOut).diff(moment(voucherDetail?.package_context?.hotel?.checkIn), 'days')} Night(s)
                                        </span>
                                    </div>
                                    <div className={styles.accomDivider}></div>
                                    <div className={styles.segmentsWrapper}>
                                        <div className={styles.flightSegmentCard}>
                                            <div className={styles.airlineRow}>
                                                <FaHotel size={22} color="#02245E" />
                                                <div>
                                                    <p className={styles.airlineNameText}>
                                                        {capitalizeString(voucherDetail?.package_context?.hotel?.name)}
                                                    </p>
                                                    <p className={styles.flightNumberText}>Provider: {capitalize(voucherDetail?.package_context?.hotel?.provider)}</p>
                                                </div>
                                            </div>
                                            <div className={styles.routeGrid}>
                                                <div className={styles.routeStation}>
                                                    <h4 className={styles.routeCity}>CHECK-IN</h4>
                                                    <p className={styles.routeTime}>{moment(voucherDetail?.package_context?.hotel?.checkIn).format('DD MMM YYYY')}</p>
                                                </div>
                                                <div className={styles.routeArrow}>
                                                    <span className={styles.durationLabel}>
                                                        {moment(voucherDetail?.package_context?.hotel?.checkOut).diff(moment(voucherDetail?.package_context?.hotel?.checkIn), 'days')} Night(s)
                                                    </span>
                                                    <div className={styles.arrowLine}>
                                                        <FaHotel className={styles.planeIcon} />
                                                    </div>
                                                </div>
                                                <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                                                    <h4 className={styles.routeCity}>CHECK-OUT</h4>
                                                    <p className={styles.routeTime}>{moment(voucherDetail?.package_context?.hotel?.checkOut).format('DD MMM YYYY')}</p>
                                                </div>
                                            </div>
                                            {voucherDetail?.package_context?.selectedHotelRooms?.length > 0 && (
                                                <div className={styles.innerTableWrap}>
                                                    <table className={styles.premiumTable}>
                                                        <thead>
                                                            <tr>
                                                                <th className={styles.srCell}>#</th>
                                                                <th>Room Type</th>
                                                                <th>Board</th>
                                                                <th className="text-center">Qty</th>
                                                                <th className="text-center">Adults</th>
                                                                <th className="text-center">Children</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {voucherDetail.package_context.selectedHotelRooms.map((room, rindex) => (
                                                                <tr key={rindex}>
                                                                    <td className={styles.srCell}>{rindex + 1}</td>
                                                                    <td style={{ fontWeight: 600 }}>{room.roomType || '—'}</td>
                                                                    <td>{room.boardName || '—'}</td>
                                                                    <td className="text-center">{room.quantity}</td>
                                                                    <td className="text-center">{room.adults}</td>
                                                                    <td className="text-center">{room.children}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════
                                FLIGHT DETAILS
                            ══════════════════════════════════ */}
                            {/* Outbound Flight */}
                            {(() => {
                                const segments = voucherDetail?.package_context?.flight?.data?.segments || [];
                                const originCode = voucherDetail?.package_context?.searchData?.leavingFrom?.airportCode;
                                const outbound = segments.filter(s => s.departure?.airport_code === originCode);
                                if (!outbound.length) return null;
                                return (
                                    <div className={styles.sectionBlock}>
                                        <div className={styles.accomHeader}>
                                            <span className={styles.accomTitle}>• Outbound Flight Details</span>
                                        </div>
                                        <div className={styles.accomDivider}></div>
                                        <div className={styles.segmentsWrapper}>
                                            {outbound.map((flight, fIndex) => (
                                                <div key={`dep-${fIndex}`} className={styles.flightSegmentCard}>
                                                    <div className={styles.airlineRow}>
                                                        {flight.airline?.logo_url
                                                            ? <img src={flight.airline.logo_url} alt={flight.airline.name} style={{ height: 28, objectFit: 'contain' }} />
                                                            : <MdFlight size={26} color="#02245E" />}
                                                        <div>
                                                            <p className={styles.airlineNameText}>{flight.airline?.name}</p>
                                                            <p className={styles.flightNumberText}>
                                                                Flight {flight.flight_number}&nbsp;·&nbsp;{flight.cabin_class?.name}
                                                                &nbsp;·&nbsp;{flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop(s)`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={styles.routeGrid}>
                                                        <div className={styles.routeStation}>
                                                            <h4 className={styles.routeCity}>{flight.departure?.airport_code}</h4>
                                                            <p className={styles.routeAirport}>{flight.departure?.city}{flight.departure?.terminal ? ` · Terminal ${flight.departure.terminal}` : ''}</p>
                                                            <p className={styles.routeTime}>{moment(flight.departure?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                        </div>
                                                        <div className={styles.routeArrow}>
                                                            <span className={styles.durationLabel}>{Math.floor(flight.duration / 60)}h {flight.duration % 60}m</span>
                                                            <div className={styles.arrowLine}><MdFlight className={styles.planeIcon} /></div>
                                                        </div>
                                                        <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                                                            <h4 className={styles.routeCity}>{flight.arrival?.airport_code}</h4>
                                                            <p className={styles.routeAirport}>{flight.arrival?.city}{flight.arrival?.terminal ? ` · Terminal ${flight.arrival.terminal}` : ''}</p>
                                                            <p className={styles.routeTime}>{moment(flight.arrival?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                        </div>
                                                    </div>
                                                    {flight.baggage_info?.adult && (
                                                        <div className={styles.innerTableWrap}>
                                                            <table className={styles.premiumTable}>
                                                                <thead><tr><th>Cabin Baggage</th><th>Checked Baggage</th></tr></thead>
                                                                <tbody><tr><td>{flight.baggage_info.adult.cabin || '—'}</td><td>{flight.baggage_info.adult.checked || '—'}</td></tr></tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Return Flight */}
                            {(() => {
                                const segments = voucherDetail?.package_context?.flight?.data?.segments || [];
                                const originCode = voucherDetail?.package_context?.searchData?.leavingFrom?.airportCode;
                                const returnSegs = segments.filter(s => s.departure?.airport_code !== originCode);
                                if (!returnSegs.length) return null;
                                return (
                                    <div className={styles.sectionBlock}>
                                        <div className={styles.accomHeader}>
                                            <span className={styles.accomTitle}>• Return Flight Details</span>
                                        </div>
                                        <div className={styles.accomDivider}></div>
                                        <div className={styles.segmentsWrapper}>
                                            {returnSegs.map((flight, fIndex) => (
                                                <div key={`ret-${fIndex}`} className={styles.flightSegmentCard}>
                                                    <div className={styles.airlineRow}>
                                                        {flight.airline?.logo_url
                                                            ? <img src={flight.airline.logo_url} alt={flight.airline.name} style={{ height: 28, objectFit: 'contain' }} />
                                                            : <MdFlight size={26} color="#02245E" />}
                                                        <div>
                                                            <p className={styles.airlineNameText}>{flight.airline?.name}</p>
                                                            <p className={styles.flightNumberText}>
                                                                Flight {flight.flight_number}&nbsp;·&nbsp;{flight.cabin_class?.name}
                                                                &nbsp;·&nbsp;{flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop(s)`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={styles.routeGrid}>
                                                        <div className={styles.routeStation}>
                                                            <h4 className={styles.routeCity}>{flight.departure?.airport_code}</h4>
                                                            <p className={styles.routeAirport}>{flight.departure?.city}{flight.departure?.terminal ? ` · Terminal ${flight.departure.terminal}` : ''}</p>
                                                            <p className={styles.routeTime}>{moment(flight.departure?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                        </div>
                                                        <div className={styles.routeArrow}>
                                                            <span className={styles.durationLabel}>{Math.floor(flight.duration / 60)}h {flight.duration % 60}m</span>
                                                            <div className={styles.arrowLine}><MdFlight className={styles.planeIcon} /></div>
                                                        </div>
                                                        <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                                                            <h4 className={styles.routeCity}>{flight.arrival?.airport_code}</h4>
                                                            <p className={styles.routeAirport}>{flight.arrival?.city}{flight.arrival?.terminal ? ` · Terminal ${flight.arrival.terminal}` : ''}</p>
                                                            <p className={styles.routeTime}>{moment(flight.arrival?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                        </div>
                                                    </div>
                                                    {flight.baggage_info?.adult && (
                                                        <div className={styles.innerTableWrap}>
                                                            <table className={styles.premiumTable}>
                                                                <thead><tr><th>Cabin Baggage</th><th>Checked Baggage</th></tr></thead>
                                                                <tbody><tr><td>{flight.baggage_info.adult.cabin || '—'}</td><td>{flight.baggage_info.adult.checked || '—'}</td></tr></tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ══════════════════════════════════
                                TRANSFER DETAILS
                            ══════════════════════════════════ */}
                            {voucherDetail?.package_context?.transfer?.data?.locations?.length > 0 && (
                                <div className={styles.sectionBlock}>
                                    <div className={styles.accomHeader}>
                                        <span className={styles.accomTitle}>• Transfer Details</span>
                                    </div>
                                    <div className={styles.accomDivider}></div>
                                    <div className={styles.segmentsWrapper}>
                                        {(() => {
                                            const transfer = voucherDetail.package_context.transfer.data;
                                            return (
                                                <div className={styles.flightSegmentCard}>
                                                    <div className={styles.airlineRow}>
                                                        <FaBus size={22} color="#02245E" />
                                                        <div>
                                                            <p className={styles.airlineNameText}>
                                                                {capitalize(transfer?.vehicle_details?.name || transfer?.vehicle)}
                                                                <span className={styles.cityChip}>{transfer?.vehiclecategory?.name}</span>
                                                            </p>
                                                            <p className={styles.flightNumberText}>
                                                                {capitalize(transfer?.trip_type)}&nbsp;·&nbsp;{transfer?.vehicle_details?.passenger_capacity} Passengers&nbsp;·&nbsp;{transfer?.vehicle_details?.transmission_type}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {transfer.locations.map((loc, idx) => (
                                                        <div key={idx} className={styles.routeGrid}>
                                                            <div className={styles.routeStation}>
                                                                <h4 className={styles.routeCity}>PICKUP</h4>
                                                                <p className={styles.routeAirport}>{loc.pickup_title}</p>
                                                                <p className={styles.routeTime}>{loc.pickup_address}</p>
                                                            </div>
                                                            <div className={styles.routeArrow}>
                                                                <span className={styles.durationLabel}>{capitalize(transfer?.trip_type)}</span>
                                                                <div className={styles.arrowLine}><FaBus className={styles.planeIcon} /></div>
                                                            </div>
                                                            <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                                                                <h4 className={styles.routeCity}>DROPOFF</h4>
                                                                <p className={styles.routeAirport}>{loc.dropoff_title}</p>
                                                                <p className={styles.routeTime}>{loc.dropoff_address}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════
                                VISA DETAILS
                            ══════════════════════════════════ */}
                            {voucherDetail?.visas?.length > 0 && (
                                <div className={styles.sectionBlock}>
                                    <div className={styles.accomHeader}>
                                        <span className={styles.accomTitle}>• Visa Details</span>

                                    </div>
                                    <div className={styles.accomDivider}></div>
                                    <div className="p-3">
                                        <table className={styles.premiumTable}>
                                            <thead>
                                                <tr>
                                                    <th className={styles.srCell}>#</th>
                                                    <th>Visa Type</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {voucherDetail.visas.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className={styles.srCell}>{index + 1}</td>
                                                        <td style={{ fontWeight: 600 }}>{item?.visa_type || '—'} <br/> {item?.visa_description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════
                                ADDITIONAL SERVICES (with pricing)
                            ══════════════════════════════════ */}
                            {voucherDetail?.additional_services?.length > 0 && (
                                <div className={styles.sectionBlock}>

                                    <div className={styles.accomHeader}>
                                        <span className={styles.accomTitle}>• Additional Services</span>

                                    </div>
                                    <div className={styles.accomDivider}></div>
                                    <div className="p-3">
                                        <table className={styles.premiumTable}>
                                            <thead>
                                                <tr>
                                                    <th className={styles.srCell}>#</th>
                                                    <th>Service Name</th>
                                                    <th className="text-center">Quantity / Pax</th>
                                                    <th className="text-end">Price / Person</th>
                                                    <th className="text-end">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {voucherDetail.additional_services.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className={styles.srCell}>{index + 1}</td>
                                                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                                                        <td className="text-center">{item.quantity}</td>
                                                        <td className="text-end">{voucherDetail.customer_currency} {convertToCustomerCurrency(item.price_per_person)}</td>
                                                        <td className="text-end">{voucherDetail.customer_currency} {convertToCustomerCurrency(item.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════
                                ROOM PRICE DETAILS
                            ══════════════════════════════════ */}
                            <div className={styles.sectionBlock}>
                                <div className={styles.accomHeader}>
                                    <span className={styles.accomTitle}>• Price Breakdown</span>
                                </div>
                                <div className={styles.accomDivider}></div>
                                <div className="p-3">
                                    <table className={styles.premiumTable}>
                                        <thead>
                                            <tr>
                                                <th>Description</th>
                                                <th className="text-end">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {voucherDetail?.package_context?.hotel?.name && (
                                                <tr>
                                                    <td style={{ fontWeight: 600 }}>Hotel</td>
                                                    <td className="text-end">{voucherDetail.package_context.priceBreakdown.hotel} {Number(voucherDetail.package_context.priceBreakdown.hotelPrice).toFixed(2)}</td>
                                                </tr>
                                            )}
                                            {voucherDetail?.package_context?.services?.includes('flight') && (
                                                <tr>
                                                    <td style={{ fontWeight: 600 }}>
                                                        Flight 
                                                    </td>
                                                    <td className="text-end">
                                                        {voucherDetail.package_context.priceBreakdown.flight} {Number(voucherDetail.package_context.priceBreakdown.flightPrice).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )}
                                            {voucherDetail?.package_context?.services?.includes('transfer') && (
                                                <tr>
                                                    <td style={{ fontWeight: 600 }}>Transfer </td>
                                                    <td className="text-end">
                                                        {voucherDetail.package_context.priceBreakdown.transfer} {Number(voucherDetail.package_context.priceBreakdown.transferPrice || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ── Total Summary ── */}
                            <div className={styles.invTotalSection}>
                                <div className={styles.invTotalLabel}>Total Amount:</div>
                                <div className={styles.invTotalAmount}>
                                    {voucherDetail?.customer_currency} {voucherDetail?.customer_amount}
                                </div>
                            </div>
                            <div className={styles.invTotalDivider} />

                            {/* ── Important Information ── */}
                            <div className={styles.importantSection}>
                                <p className={styles.importantTitle}>IMPORTANT INFORMATION</p>
                                <div className={styles.importantDivider} />
                                <ul className={styles.importantList}>
                                    <li>The invoice displays the complete pricing details of your package booking, inclusive of all applicable taxes.</li>
                                    <li>Please verify the information and retain this invoice for your records.</li>
                                    <li>This is a computer-generated receipt and does not require a physical signature.</li>
                                </ul>
                            </div>
                            <div className={styles.invTotalDivider} />

                            {/* ── Footer Bar ── */}
                            <div className={styles.invFooterBar}>
                                <div className={styles.invFooterLeft}>
                                    <span className={styles.invFooterItem}>
                                        <FaPhone size={13} className={styles.invFooterIcon} />
                                        01217772522
                                    </span>
                                    <span className={styles.invFooterItem}>
                                        <FaEnvelope size={13} className={styles.invFooterIcon} />
                                        info@umrahTech.net
                                    </span>
                                </div>
                                <div className={styles.invFooterRight}>
                                    <span className={styles.invFooterCompany}>Al-Hijaz Tours</span>
                                    <span className={styles.invFooterItem}>
                                        www.alhijaztours.net
                                        <FaGlobe size={13} className={styles.invFooterIcon} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Action Buttons ── */}
                    <div className={styles.actionRow}>
                        <button className={styles.btnPrimary} onClick={() => window.print()}>
                            <MdOutlineFileDownload size={17} />
                            Print / Download Invoice
                        </button>
                        <Link href={`/holiday-packages/voucher/${voucherDetail?.booking_reference}`} style={{ textDecoration: 'none' }}>
                            <button className={styles.btnGold}>
                                <FaFileInvoice size={14} />
                                View Voucher
                            </button>
                        </Link>
                        <Link href='/' style={{ textDecoration: 'none' }}>
                            <button className={styles.btnPrimary} style={{ background: 'linear-gradient(135deg, #444, #666)' }}>
                                <FaHome size={14} />
                                Go to Home
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
