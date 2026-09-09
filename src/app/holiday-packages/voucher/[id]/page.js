'use client'
import styles from "./voucher.module.css";
import moment from "moment";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import HotelInvoiceLoader from "@/components/Loader/HotelInvoiceLoader";
import {
    FaBus, FaFileInvoice, FaHotel, FaPlaneArrival, FaPlaneDeparture,
    FaUser, FaUserFriends, FaHome, FaStar, FaConciergeBell, FaPassport,
} from "react-icons/fa";
import { MdFlight, MdOutlineFileDownload } from "react-icons/md";
import { IoWarningOutline } from "react-icons/io5";
import QRCode from "react-qr-code";
import Link from "next/link";

export default function Page() {
    const { id } = useParams();
    const ref = useRef();
    const [voucherDetail, setVoucherDetail] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [voucherUrl, setVoucherUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') setVoucherUrl(window.location.href);
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
                setErrorMessage(res?.Description);
            }
        } catch (err) {
            setIsLoading(false);
            console.error("Error fetching package details:", err);
        }
    };

    function capitalize(text) {
        if (!text) return "";
        return String(text).charAt(0).toUpperCase() + String(text).slice(1);
    };

    function capitalizeString(str) {
        if (!str) return "";
        return str.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };  

    const getTotalGuests = () => {
        const op = voucherDetail?.other_passengers || {};
        const adults = (op.additional_adults?.length || 0) + 1;
        const children = op.children_details?.length || 0;
        const infants = op.infants_details?.length || 0;
        return [
            `${adults} Adult${adults !== 1 ? 's' : ''}`,
            children > 0 && `${children} Child${children !== 1 ? 'ren' : ''}`,
            infants > 0 && `${infants} Infant${infants !== 1 ? 's' : ''}`,
        ].filter(Boolean).join(', ');
    };
    // console.log("Voucher Detail:", voucherDetail);
    return (
        <div className={styles.pageWrapper}>
            {isLoading ? (
                <div className={`container px-0 ${styles.confirmationWrapper}`}>
                    <div className="bg-white rounded shadow p-3">
                        <HotelInvoiceLoader />
                    </div>
                </div>
            ) : (
                <div className={`container px-0 ${styles.confirmationWrapper}`}>
                    {errorMessage ? (
                        <div className="bg-white shadow text-center p-5 rounded">
                            <IoWarningOutline className="text-warning" size={120} />
                            <h5 className="mt-4">{errorMessage}</h5>
                        </div>
                    ) : (
                        <div ref={ref} className={styles.voucherCard}>

                            {/* ── Watermark ── */}
                            <div className={styles.watermark}>
                                <Image src='/watermark.png' width={450} height={450}
                                    style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                                    alt="Watermark" quality={100} />
                            </div>

                            {/* ── Company Header ── */}
                            <Image src={voucherDetail?.client?.client_images?.header_image}
                                height={150} width={1000} className="w-100 h-auto d-block"
                                quality={100} alt="Company Header" />

                            {/* ── Title + QR Band ── */}
                            <div className={styles.titleBand}>
                                <div className={styles.titleLeft}>
                                    <h1 className={styles.mainTitle}>Holiday Package Booking<br/> Voucher</h1>
                                    <p className={styles.mainSubtitle}>Thank you for choosing Alhijaz Tours</p>
                                </div>
                                <div className={styles.titleRight}>
                                    <div className={styles.qrWrapper}>
                                        <QRCode value={voucherUrl || ' '} size={78} bgColor="#ffffff" fgColor="#1a1a1a" />
                                    </div>
                                    <span className={styles.qrLabel}>Scan the QR Code<br />to Verify Booking</span>
                                </div>
                            </div>

                            {/* ── Gold Divider ── */}
                            <div className={styles.goldDivider} />

                            {/* ── Voucher Details Band ── */}
                            <div className={styles.voucherDetailsBand}>
                                <div className={styles.voucherBandInner}>
                                    <span className={styles.voucherSectionLabel}>Voucher Details</span>
                                    <div className={styles.voucherDetailsRow}>
                                        <div className={styles.voucherDetailsLeft}>
                                            <p className={styles.voucherNoLabel}>BOOKING REFERENCE:</p>
                                            <h2 className={styles.voucherNumber}>{voucherDetail?.booking_reference}</h2>
                                            <p className={styles.bookingDetailSmallLabel}>Booking Date:</p>
                                            <p className={styles.bookingDateValue}>
                                                {moment(voucherDetail?.created_at).format('DD-MM-YYYY')}
                                            </p>
                                            <span className={`${styles.confirmedBadge} ${voucherDetail?.booking_status === 'cancelled' ? styles.cancelledBadge : voucherDetail?.booking_status === 'tentative' || voucherDetail?.booking_status === 'pending' ? styles.tentativeBadge : ''}`}>
                                                Status: {voucherDetail?.booking_status?.toUpperCase() || 'CONFIRMED'}
                                            </span>
                                            {voucherDetail?.payment_status && (
                                                <span className={`${styles.confirmedBadge} mt-1 ${voucherDetail?.payment_status === 'paid' ? styles.confirmedBadge : styles.tentativeBadge}`}>
                                                    Payment: {voucherDetail?.payment_status?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.voucherDetailsDivider} />
                                        <div className={styles.voucherDetailsRight}>
                                            <p className={styles.bookingDetailsTitle}>BOOKING DETAILS</p>
                                            <p className={styles.bookingDetailLine}>
                                                <span className={styles.bookingDetailLabel}>Lead Passenger:</span>
                                                <span className={styles.bookingDetailValue}>
                                                    {voucherDetail?.lead_details?.title} {voucherDetail?.lead_details?.firstName} {voucherDetail?.lead_details?.lastName}
                                                </span>
                                            </p>
                                            <p className={styles.bookingDetailLine}>
                                                <span className={styles.bookingDetailLabel}>Route:</span>
                                                <span className={styles.bookingDetailValue}>
                                                    {voucherDetail?.package_context?.searchData?.leavingFrom?.city} &rarr; {voucherDetail?.package_context?.searchData?.goingTo?.city}
                                                </span>
                                            </p>
                                            <p className={styles.bookingDetailLine}>
                                                <span className={styles.bookingDetailLabel}>Total Guests:</span>
                                                <span className={styles.bookingDetailValue}>{getTotalGuests()}</span>
                                            </p>
                                            <p className={styles.bookingDetailLine}>
                                                <span className={styles.bookingDetailLabel}>Duration:</span>
                                                <span className={styles.bookingDetailValue}>
                                                    {moment(voucherDetail?.package_context?.searchData?.dates?.checkOut).diff(moment(voucherDetail?.package_context?.searchData?.dates?.checkIn), 'days')} Night(s)
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ══════════════════════════════════
                                PACKAGE DETAILS
                            ══════════════════════════════════ */}
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaStar size={12} /></span>
                                        PACKAGE DETAILS
                                    </div>
                                </div>
                                <div className={styles.packageInfoGrid}>
                                    <div className={styles.packageInfoMain}>
                                        <h3 className={styles.packageTitle}>
                                            {voucherDetail?.package_context?.searchData?.leavingFrom?.city} &rarr; {voucherDetail?.package_context?.searchData?.goingTo?.city}
                                        </h3>
                                        <p style={{ fontSize: 13, color: '#000', margin: '4px 0 0' }}>
                                            Services: {(voucherDetail?.package_context?.services || []).map(s => capitalize(s)).join(', ')}
                                        </p>
                                    </div>
                                    <div className={styles.packageInfoDates}>
                                        <div className={styles.hotelDateRow}>
                                            <span className={styles.hotelDateLabel}>Check-In:</span>
                                            <span className={styles.hotelDateValue}>{moment(voucherDetail?.package_context?.searchData?.dates?.checkIn).format('DD-MM-YYYY')}</span>
                                        </div>
                                        <div className={styles.hotelDateRow}>
                                            <span className={styles.hotelDateLabel}>Check-Out:</span>
                                            <span className={styles.hotelDateValue}>{moment(voucherDetail?.package_context?.searchData?.dates?.checkOut).format('DD-MM-YYYY')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ══════════════════════════════════
                                LEAD PASSENGER
                            ══════════════════════════════════ */}
                            <div className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={styles.sectionIconWrap}><FaUser size={12} /></span>
                                        LEAD PASSENGER
                                    </div>
                                </div>
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
                                        <div className={styles.sectionHeader}>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className={styles.sectionIconWrap}><FaUserFriends size={12} /></span>
                                                ADDITIONAL GUESTS
                                            </div>
                                        </div>
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
                                    <div className={styles.sectionHeader}>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className={styles.sectionIconWrap}><FaHotel size={12} /></span>
                                            ACCOMMODATION DETAILS
                                        </div>
                                    </div>
                                    <div className={styles.segmentsWrapper}>
                                        <div className={styles.flightSegmentCard}>
                                            {/* Hotel header row */}
                                            <div className={styles.airlineRow}>
                                                <FaHotel size={22} color="#02245E" />
                                                <div>
                                                    <p className={styles.airlineNameText}>
                                                        {capitalizeString(voucherDetail?.package_context?.hotel?.name)}
                                                    </p>
                                                    <p className={styles.flightNumberText}>Location: {capitalize(voucherDetail?.package_context?.hotel?.location)}</p>
                                                </div>
                                            </div>
                                            {/* Check-in / Check-out route */}
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
                                            {/* Room table */}
                                            {voucherDetail?.package_context?.selectedHotelRooms?.length > 0 && (
                                                <div className={styles.innerTableWrap}>
                                                    <table className={styles.premiumTable}>
                                                        <thead>
                                                            <tr>
                                                                <th className={styles.srCell}>#</th>
                                                                <th>Room Type</th>
                                                                <th>Board</th>
                                                                <th>Qty</th>
                                                                <th>Adults</th>
                                                                <th>Children</th>
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
                                OUTBOUND FLIGHT
                            ══════════════════════════════════ */}
                            {(() => {
                                const segments = voucherDetail?.package_context?.flight?.data?.segments || [];
                                const originCode = voucherDetail?.package_context?.searchData?.leavingFrom?.airportCode;
                                const outbound = segments.filter(s => s.departure?.airport_code === originCode);
                                if (!outbound.length) return null;
                                return (
                                    <div className={styles.sectionBlock}>
                                        <div className={styles.sectionHeader}>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className={styles.sectionIconWrap}><FaPlaneDeparture size={12} /></span>
                                                OUTBOUND FLIGHT DETAILS
                                            </div>
                                        </div>
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
                                                            <p className={styles.routeAirport}>{flight.departure?.city}</p>
                                                            <p className={styles.routeTime}>{moment(flight.departure?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                            {flight.departure?.terminal && <p className={styles.routeAirport}>Terminal {flight.departure.terminal}</p>}
                                                        </div>
                                                        <div className={styles.routeArrow}>
                                                            <span className={styles.durationLabel}>
                                                                {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
                                                            </span>
                                                            <div className={styles.arrowLine}>
                                                                <MdFlight className={styles.planeIcon} />
                                                            </div>
                                                        </div>
                                                        <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                                                            <h4 className={styles.routeCity}>{flight.arrival?.airport_code}</h4>
                                                            <p className={styles.routeAirport}>{flight.arrival?.city}</p>
                                                            <p className={styles.routeTime}>{moment(flight.arrival?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                            {flight.arrival?.terminal && <p className={styles.routeAirport}>Terminal {flight.arrival.terminal}</p>}
                                                        </div>
                                                    </div>
                                                    {flight.baggage_info?.adult && (
                                                        <div className={styles.innerTableWrap} style={{ marginTop: 8 }}>
                                                            <table className={styles.premiumTable}>
                                                                <thead><tr><th>Cabin Baggage</th><th>Checked Baggage</th></tr></thead>
                                                                <tbody>
                                                                    <tr>
                                                                        <td>{flight.baggage_info.adult.cabin || '—'}</td>
                                                                        <td>{flight.baggage_info.adult.checked || '—'}</td>
                                                                    </tr>
                                                                </tbody>
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
                                RETURN FLIGHT
                            ══════════════════════════════════ */}
                            {(() => {
                                const segments = voucherDetail?.package_context?.flight?.data?.segments || [];
                                const originCode = voucherDetail?.package_context?.searchData?.leavingFrom?.airportCode;
                                const returnSegs = segments.filter(s => s.departure?.airport_code !== originCode);
                                if (!returnSegs.length) return null;
                                return (
                                    <div className={styles.sectionBlock}>
                                        <div className={styles.sectionHeader}>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className={styles.sectionIconWrap}><FaPlaneArrival size={12} /></span>
                                                RETURN FLIGHT DETAILS
                                            </div>
                                        </div>
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
                                                            <p className={styles.routeAirport}>{flight.departure?.city}</p>
                                                            <p className={styles.routeTime}>{moment(flight.departure?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                            {flight.departure?.terminal && <p className={styles.routeAirport}>Terminal {flight.departure.terminal}</p>}
                                                        </div>
                                                        <div className={styles.routeArrow}>
                                                            <span className={styles.durationLabel}>
                                                                {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
                                                            </span>
                                                            <div className={styles.arrowLine}>
                                                                <MdFlight className={styles.planeIcon} />
                                                            </div>
                                                        </div>
                                                        <div className={`${styles.routeStation} ${styles.routeStationRight}`}>
                                                            <h4 className={styles.routeCity}>{flight.arrival?.airport_code}</h4>
                                                            <p className={styles.routeAirport}>{flight.arrival?.city}</p>
                                                            <p className={styles.routeTime}>{moment(flight.arrival?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                            {flight.arrival?.terminal && <p className={styles.routeAirport}>Terminal {flight.arrival.terminal}</p>}
                                                        </div>
                                                    </div>
                                                    {flight.baggage_info?.adult && (
                                                        <div className={styles.innerTableWrap} style={{ marginTop: 8 }}>
                                                            <table className={styles.premiumTable}>
                                                                <thead><tr><th>Cabin Baggage</th><th>Checked Baggage</th></tr></thead>
                                                                <tbody>
                                                                    <tr>
                                                                        <td>{flight.baggage_info.adult.cabin || '—'}</td>
                                                                        <td>{flight.baggage_info.adult.checked || '—'}</td>
                                                                    </tr>
                                                                </tbody>
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
                                    <div className={styles.sectionHeader}>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className={styles.sectionIconWrap}><FaBus size={12} /></span>
                                            TRANSFER DETAILS
                                        </div>
                                    </div>
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
                                                            <div className={styles.arrowLine}>
                                                                <FaBus className={styles.planeIcon} />
                                                            </div>
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
                                ADDITIONAL SERVICES
                            ══════════════════════════════════ */}
                            {voucherDetail?.additional_services?.length > 0 && (
                                <div className={styles.sectionBlock}>
                                    <div className={styles.sectionHeader}>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className={styles.sectionIconWrap}><FaConciergeBell size={12} /></span>
                                            ADDITIONAL SERVICES
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <table className={styles.premiumTable}>
                                            <thead>
                                                <tr>
                                                    <th className={styles.srCell}>#</th>
                                                    <th>Service Name</th>
                                                    <th className="text-center">Quantity / Pax</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {voucherDetail.additional_services.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className={styles.srCell}>{index + 1}</td>
                                                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                                                        <td className="text-center">{item.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════
                                VISA DETAILS
                            ══════════════════════════════════ */}
                            {voucherDetail?.visas?.length > 0 && (
                                <div className={styles.sectionBlock}>
                                    <div className={styles.sectionHeader}>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className={styles.sectionIconWrap}><FaPassport size={12} /></span>
                                            VISA DETAILS
                                        </div>
                                    </div>
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
                                                        <td style={{ fontWeight: 600 }}>{item?.visa_type || '—'} <br /> {item?.visa_description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ── Important Information ── */}
                            <div className={styles.importantSection}>
                                <p className={styles.importantTitle}>IMPORTANT INFORMATION</p>
                                <div className={styles.importantDivider} />
                                <ul className={styles.importantList}>
                                    <li>Please present this voucher at check-in for all included services.</li>
                                    <li>All passengers must carry valid photo identification at all times.</li>
                                    <li>Check-in times and service schedules are subject to operator confirmation.</li>
                                    <li>This package voucher covers only the services listed above.</li>
                                    <li>This is a computer-generated receipt and does not require a physical signature.</li>
                                </ul>
                            </div>

                            {/* ── Company Footer ── */}
                            <Image src={voucherDetail?.client?.client_images?.footer_image}
                                height={150} width={1000} className="w-100 h-auto d-block"
                                quality={100} alt="Company Footer" />
                        </div>
                    )}
                </div>
            )}

            {/* ── Action Buttons ── */}
            {!isLoading && !errorMessage && (
                <div className={`container mb-3 px-0 ${styles.confirmationWrapper}`}>
                    <div className={styles.actionRow}>
                        <button className={styles.btnPrimary} onClick={() => window.print()}>
                            <MdOutlineFileDownload size={17} />
                            Print / Download Voucher
                        </button>
                        <Link href={`/holiday-packages/invoice/${voucherDetail?.booking_reference}`} style={{ textDecoration: 'none' }}>
                            <button className={styles.btnGold}>
                                <FaFileInvoice size={14} />
                                View Invoice
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
