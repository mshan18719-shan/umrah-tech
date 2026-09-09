'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './voucher.module.css';
import Image from 'next/image';
import HotelInvoiceLoader from '@/components/Loader/HotelInvoiceLoader';
import {
    FaBus, FaFileInvoice, FaHotel, FaUser, FaUserFriends, FaHome, FaStar, FaStarHalfAlt,
    FaPassport, FaPhone, FaEnvelope, FaPrint, FaDownload, FaCheckCircle,
    FaCalendarAlt, FaUsers, FaHashtag, FaClock, FaMapMarkerAlt,
} from 'react-icons/fa';
import { MdFlight } from 'react-icons/md';
import { IoWarningOutline, IoAirplaneSharp } from 'react-icons/io5';
import { IoMdBed } from 'react-icons/io';
import QRCode from 'react-qr-code';
import moment from 'moment';
import Link from 'next/link';
import airline from '@/util/airlines.json';

export default function Page() {
    const { id } = useParams();
    const [voucherDetail, setvoucherDetail] = useState({});
    const [voucherResponse, setvoucherResponse] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedTransfer, setSelectedTransfer] = useState([]);
    const [selectedVisa, setSelectedVisa] = useState([]);

    useEffect(() => {
        if (id) {
            fetchDetails();
        }
    }, [id]);

    const fetchDetails = async () => {
        setIsLoading(true);
        const Request = { booking_reference: id };
        try {
            const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customized/packages/booking/details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Request),
            });
            const res = await responses.json();
            setIsLoading(false);
            if (res.Success) {
                if (res?.Content?.booking.temp_cart.transfer_selected_id !== null) {
                    setSelectedTransfer([res?.Content?.booking.temp_cart.transfer]);
                }
                if (res?.Content?.booking.temp_cart.visa_selected_id !== null) {
                    setSelectedVisa([res?.Content?.booking.temp_cart.visa]);
                }
                setvoucherDetail(res?.Content?.booking.temp_cart);
                setvoucherResponse(res?.Content.booking);
            } else {
                setErrorMessage(res?.Description);
            }
        } catch (err) {
            setIsLoading(false);
            console.error('Error fetching voucher details:', err);
        }
    };

    function capitalize(text) {
        if (!text) return '';
        return String(text).charAt(0).toUpperCase() + String(text).slice(1);
    }

    const getTotalGuestsLabel = () => {
        const adults = (voucherResponse?.other_passengers?.additional_adults?.length || 0) + 1;
        const children = voucherResponse?.other_passengers?.children_details?.length || 0;
        return [
            `${adults} Adult${adults !== 1 ? 's' : ''}`,
            children > 0 && `${children} Child${children !== 1 ? 'ren' : ''}`,
        ].filter(Boolean).join(', ');
    };

    const getTotalGuests = () => {
        const adults = voucherResponse?.other_passengers?.additional_adults?.length || 0;
        const children = voucherResponse?.other_passengers?.children_details?.length || 0;
        return adults + children + 1;
    };

    function groupFlightSegments(flight) {
        if (!flight?.segments?.length) return [];
        if (flight.trip_type === 'return') {
            const mid = Math.ceil(flight.segments.length / 2);
            return [
                { segments: flight.segments.slice(0, mid), label: 'Outbound' },
                { segments: flight.segments.slice(mid), label: 'Return' },
            ];
        }
        return [{ segments: flight.segments, label: 'Outbound' }];
    }

    const handlePrint = () => window.print();

    const bookingRef = voucherResponse?.booking_reference || id;
    const paymentStatus = (voucherResponse?.payment_status || '').toLowerCase();
    const bookingStatus = (voucherResponse?.booking_status || '').toLowerCase();
    const lead = voucherResponse?.lead_details || {};
    const hasOtherGuests =
        voucherResponse?.other_passengers?.additional_adults?.length > 0 ||
        voucherResponse?.other_passengers?.children_details?.length > 0;

    const totalNights = (Number(voucherDetail?.makkah_hotel?.nights) || 0)
        + (Number(voucherDetail?.madinah_hotel?.nights) || 0);

    const tripStart = voucherDetail?.makkah_hotel?.check_in
        || voucherDetail?.madinah_hotel?.check_in
        || voucherDetail?.flight?.segments?.[0]?.departure?.datetime;

    const tripEnd = voucherDetail?.madinah_hotel?.check_out
        || voucherDetail?.makkah_hotel?.check_out
        || (voucherDetail?.flight?.segments?.length
            ? voucherDetail.flight.segments[voucherDetail.flight.segments.length - 1]?.arrival?.datetime
            : null);

    const voucherUrl = typeof window !== 'undefined' ? window.location.href : '';

    const renderStars = (rating) => {
        const rounded = Math.round(Number(rating || 0) * 2) / 2;
        const full = Math.floor(rounded);
        const half = rounded % 1 !== 0;
        const stars = [];
        for (let i = 0; i < full; i++) {
            stars.push(<FaStar key={`f-${i}`} size={13} />);
        }
        if (half) stars.push(<FaStarHalfAlt key="half" size={13} />);
        return stars;
    };

    let sectionNum = 0;
    const nextNum = () => {
        sectionNum += 1;
        return String(sectionNum).padStart(2, '0');
    };

    if (isLoading) {
        return (
            <div className={styles.pageWrap}>
                <div className={styles.shell}>
                    <div className={styles.sheet}><HotelInvoiceLoader /></div>
                </div>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className={styles.pageWrap}>
                <div className={styles.shell}>
                    <div className="alert alert-danger text-center p-5">
                        <IoWarningOutline className="text-warning" size={80} />
                        <h5 className="mt-3">{errorMessage}</h5>
                        <Link href="/" className={styles.linkChip} style={{ display: 'inline-flex', marginTop: 16 }}>
                            <FaHome size={12} /> Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Pre-compute section numbers in render order
    const nPackage = nextNum();
    const nBookingBy = nextNum();
    const nGuests = hasOtherGuests ? nextNum() : null;
    const nFlight = voucherDetail?.flight ? nextNum() : null;
    const nMakkah = voucherDetail?.makkah_hotel ? nextNum() : null;
    const nMadinah = voucherDetail?.madinah_hotel ? nextNum() : null;
    const nTransfer = selectedTransfer.length > 0 ? nextNum() : null;
    const nVisa = selectedVisa.length > 0 ? nextNum() : null;
    const nInfo = nextNum();

    return (
        <div className={styles.pageWrap}>
            <div className={styles.shell}>
                <div className={styles.previewBar}>
                    <span className={styles.previewLabel}>Voucher preview — {bookingRef}</span>
                    <div className={styles.previewActions}>
                        <Link href={`/umrah-getaway/invoice/${bookingRef}`} className={styles.linkChip}>
                            <FaFileInvoice size={12} /> Invoice
                        </Link>
                        <Link href="/" className={styles.linkChip}><FaHome size={12} /> Home</Link>
                        <button type="button" className={styles.btnPrint} onClick={handlePrint}>
                            <FaPrint size={13} /> Print
                        </button>
                        <button type="button" className={styles.btnPdf} onClick={handlePrint}>
                            <FaDownload size={13} /> Download PDF
                        </button>
                    </div>
                </div>

                <div id="voucher" className={styles.sheet}>
                    <div className={styles.watermark}>
                        <Image
                            src="/watermark.png"
                            width={450}
                            height={450}
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                            alt="Watermark"
                            quality={100}
                        />
                    </div>

                    <header className={styles.brandHeader}>
                        <div className={styles.brandLeft}>
                            <div className={styles.brandLogoBox}>
                                <Image
                                    src="/images/navlogo.png"
                                    width={48}
                                    height={48}
                                    alt="Umrah Tech"
                                    quality={100}
                                />
                            </div>
                            <div>
                                <h1 className={styles.brandName}>Umrah Tech</h1>
                                <p className={styles.brandTagline}>
                                    Trusted Umrah &amp; Hajj Technology Partner
                                </p>
                            </div>
                        </div>
                        <div className={styles.brandContact}>
                            <span className={styles.brandContactItem}>
                                <FaPhone size={12} /> 01217772522
                            </span>
                            <span className={styles.brandContactItem}>
                                <FaEnvelope size={12} /> info@umrahtech.net
                            </span>
                        </div>
                    </header>

                    <div className={styles.body}>
                        <div className={styles.summaryHero}>
                            <div className={styles.summaryLeft}>
                                <span className={styles.summaryBadge}>Booking Summary</span>
                                <h2 className={styles.summaryTitle}>Umrah Getaway Voucher</h2>
                                <p className={styles.summaryDesc}>
                                    Present this voucher at check-in for all included services.
                                    Keep it with your travel documents.
                                </p>
                                <div className={styles.qrBlock}>
                                    <QRCode value={voucherUrl || ' '} size={72} bgColor="#ffffff" fgColor="#1B3B6F" />
                                    <span className={styles.qrHint}>Scan to verify booking</span>
                                </div>
                            </div>
                            <div className={styles.ticketCard}>
                                <div className={styles.ticketTop}>
                                    <span className={styles.ticketLabel}>
                                        <FaHashtag size={10} /> Booking Ref
                                    </span>
                                    <span
                                        className={`${styles.paidBadge} ${
                                            paymentStatus !== 'paid' && paymentStatus !== 'completed'
                                                ? styles.pendingPayBadge
                                                : ''
                                        }`}
                                    >
                                        {paymentStatus === 'paid' || paymentStatus === 'completed'
                                            ? 'PAID'
                                            : (voucherResponse?.payment_status || 'PENDING').toUpperCase()}
                                    </span>
                                </div>
                                <p className={styles.ticketRef}>{bookingRef}</p>
                                <div className={styles.ticketGrid}>
                                    <div className={styles.ticketItem}>
                                        <FaCalendarAlt size={12} className={styles.ticketItemIcon} />
                                        <div>
                                            <span className={styles.ticketItemLabel}>Booking Date</span>
                                            <span className={styles.ticketItemValue}>
                                                {voucherResponse?.created_at
                                                    ? moment(voucherResponse.created_at).format('MMM DD, YYYY')
                                                    : '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.ticketItem}>
                                        <FaCheckCircle size={12} className={styles.ticketItemIcon} />
                                        <div>
                                            <span className={styles.ticketItemLabel}>Status</span>
                                            <span className={`${styles.ticketItemValue} ${styles.statusOk}`}>
                                                {(voucherResponse?.booking_status || 'confirmed').toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.ticketItem}>
                                        <FaUsers size={12} className={styles.ticketItemIcon} />
                                        <div>
                                            <span className={styles.ticketItemLabel}>Guests</span>
                                            <span className={styles.ticketItemValue}>{getTotalGuestsLabel()}</span>
                                        </div>
                                    </div>
                                    <div className={styles.ticketItem}>
                                        <FaClock size={12} className={styles.ticketItemIcon} />
                                        <div>
                                            <span className={styles.ticketItemLabel}>Duration</span>
                                            <span className={styles.ticketItemValue}>
                                                {totalNights > 0 ? `${totalNights} Nights` : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.dateRibbon}>
                            <div className={styles.dateSide}>
                                <span className={styles.dateSideIcon}><FaCalendarAlt size={14} /></span>
                                <div>
                                    <span className={styles.dateSideLabel}>Booking Date</span>
                                    <span className={styles.dateSideValue}>
                                        {voucherResponse?.created_at
                                            ? moment(voucherResponse.created_at).format('MMM DD, YYYY')
                                            : '—'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.dateCenter}>
                                <div className={styles.dateCenterLine} />
                                <span className={styles.dateCenterBadge}>
                                    {totalNights > 0 ? `${totalNights} NIGHTS` : 'TRIP'}
                                </span>
                                <div className={styles.dateCenterLine} />
                            </div>
                            <div className={styles.dateSide}>
                                <span className={styles.dateSideIcon}><FaCalendarAlt size={14} /></span>
                                <div>
                                    <span className={styles.dateSideLabel}>Trip Date</span>
                                    <span className={styles.dateSideValue}>
                                        {tripStart ? moment(tripStart).format('MMM DD, YYYY') : '—'}
                                        {tripEnd ? ` – ${moment(tripEnd).format('MMM DD, YYYY')}` : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Package Details */}
                        <section className={styles.section}>
                            <div className={styles.sectionTitleRow}>
                                <span className={styles.sectionNum}>{nPackage}</span>
                                <span className={styles.sectionIcon}><FaStar size={12} /></span>
                                <h3 className={styles.sectionTitle}>Package Details</h3>
                            </div>
                            <div className={styles.activityHero}>
                                <h4 className={styles.activityTitle}>Umrah Getaway Package</h4>
                                <div className={styles.metaGrid}>
                                    <div>
                                        <span className={styles.fieldLabel}>Duration</span>
                                        <div className={styles.fieldValue}>
                                            {totalNights > 0 ? `${totalNights} Nights` : '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <span className={styles.fieldLabel}>Guests</span>
                                        <div className={styles.fieldValue}>{getTotalGuests()}</div>
                                    </div>
                                    <div>
                                        <span className={styles.fieldLabel}>Booking Ref</span>
                                        <div className={styles.fieldValue}>{bookingRef}</div>
                                    </div>
                                    <div>
                                        <span className={styles.fieldLabel}>Payment</span>
                                        <div className={styles.fieldValue}>
                                            {(voucherResponse?.payment_status || '—').toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Booking By */}
                        <section className={styles.section}>
                            <div className={styles.sectionTitleRow}>
                                <span className={styles.sectionNum}>{nBookingBy}</span>
                                <span className={styles.sectionIcon}><FaUser size={11} /></span>
                                <h3 className={styles.sectionTitle}>Booking By</h3>
                            </div>
                            <div className={styles.bookingGrid}>
                                <div>
                                    <span className={styles.fieldLabel}>Full Name</span>
                                    <div className={styles.fieldValue}>
                                        {lead?.title} {lead?.firstName} {lead?.lastName}
                                    </div>
                                </div>
                                <div>
                                    <span className={styles.fieldLabel}>Email</span>
                                    <div className={styles.fieldValue}>{lead?.email || '—'}</div>
                                </div>
                                <div>
                                    <span className={styles.fieldLabel}>Phone</span>
                                    <div className={styles.fieldValue}>{lead?.phone || '—'}</div>
                                </div>
                                <div>
                                    <span className={styles.fieldLabel}>Gender</span>
                                    <div className={styles.fieldValue}>{capitalize(lead?.gender) || '—'}</div>
                                </div>
                                <div>
                                    <span className={styles.fieldLabel}>Country</span>
                                    <div className={styles.fieldValue}>{lead?.country || '—'}</div>
                                </div>
                                {lead?.address && (
                                    <div>
                                        <span className={styles.fieldLabel}>Address</span>
                                        <div className={styles.fieldValue}>{lead.address}</div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Additional Guests */}
                        {hasOtherGuests && (
                            <section className={styles.section}>
                                <div className={styles.sectionTitleRow}>
                                    <span className={styles.sectionNum}>{nGuests}</span>
                                    <span className={styles.sectionIcon}><FaUserFriends size={11} /></span>
                                    <h3 className={styles.sectionTitle}>Additional Guests</h3>
                                </div>
                                <div className={styles.tableWrap}>
                                    <table className={`${styles.dataTable} ${styles.navyTableHead}`}>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Full Name</th>
                                                <th>Gender</th>
                                                <th>Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {voucherResponse?.other_passengers?.additional_adults?.map((adult, i) => (
                                                <tr key={`adult-${i}`}>
                                                    <td className={styles.srCell}>{i + 1}</td>
                                                    <td style={{ fontWeight: 700 }}>{adult.firstName} {adult.lastName}</td>
                                                    <td>{capitalize(adult.gender)}</td>
                                                    <td><span className={styles.typeBadge}>Adult</span></td>
                                                </tr>
                                            ))}
                                            {voucherResponse?.other_passengers?.children_details?.map((child, i) => (
                                                <tr key={`child-${i}`}>
                                                    <td className={styles.srCell}>
                                                        {(voucherResponse?.other_passengers?.additional_adults?.length || 0) + i + 1}
                                                    </td>
                                                    <td style={{ fontWeight: 700 }}>{child.firstName} {child.lastName}</td>
                                                    <td>{capitalize(child.gender)}</td>
                                                    <td>
                                                        <span className={`${styles.typeBadge} ${styles.typeBadgeChild}`}>Child</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {/* Flight Details */}
                        {voucherDetail?.flight && (
                            <section className={styles.section}>
                                <div className={styles.sectionTitleRow}>
                                    <span className={styles.sectionNum}>{nFlight}</span>
                                    <span className={styles.sectionIcon}><MdFlight size={14} /></span>
                                    <h3 className={styles.sectionTitle}>Flight Details</h3>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    {groupFlightSegments(voucherDetail.flight).map((group, idx) => {
                                        const firstSeg = group.segments[0];
                                        const lastSeg = group.segments[group.segments.length - 1];
                                        const totalMin = group.segments.reduce((acc, seg, sIdx) => {
                                            let time = acc + seg.duration;
                                            const nextSeg = group.segments[sIdx + 1];
                                            if (nextSeg) {
                                                time += moment(nextSeg.departure.datetime).diff(moment(seg.arrival.datetime), 'minutes');
                                            }
                                            return time;
                                        }, 0);
                                        const airlineData = airline.find(a => a.iata === firstSeg?.airline?.code);
                                        return (
                                            <div key={idx} className={styles.flightSegmentCard}>
                                                <div className={styles.airlineRow}>
                                                    {firstSeg?.airline?.logo_url ? (
                                                        <Image src={firstSeg.airline.logo_url} height={36} width={36} quality={50} alt={firstSeg.airline.code} className={styles.airlineLogo} />
                                                    ) : airlineData?.logo ? (
                                                        <Image src={airlineData.logo} height={36} width={36} quality={50} alt={airlineData.icao || firstSeg?.airline?.code} className={styles.airlineLogo} />
                                                    ) : (
                                                        <MdFlight size={26} color="#1B3B6F" />
                                                    )}
                                                    <div>
                                                        <p className={styles.airlineNameText}>
                                                            {firstSeg?.airline?.name || airlineData?.name || firstSeg?.airline?.code}
                                                        </p>
                                                        <p className={styles.flightNumberText}>
                                                            {firstSeg?.flight_number}&nbsp;·&nbsp;
                                                            {firstSeg?.cabin_class?.name || capitalize(voucherDetail.flight.trip_type)}
                                                        </p>
                                                    </div>
                                                    <span className={styles.flightLegLabel}>{group.label}</span>
                                                </div>
                                                <div className={styles.flightRouteGrid}>
                                                    <div className={styles.flightStation}>
                                                        <h4 className={styles.flightCode}>{firstSeg?.departure?.airport_code}</h4>
                                                        <p className={styles.flightAirport}>
                                                            {moment(firstSeg?.departure?.datetime).format('LT')}
                                                        </p>
                                                        <p className={styles.flightTime}>
                                                            {moment(firstSeg?.departure?.datetime).format('DD MMM YYYY')}
                                                        </p>
                                                    </div>
                                                    <div className={styles.flightArrow}>
                                                        <span className={styles.flightDuration}>
                                                            {Math.floor(totalMin / 60)}h {totalMin % 60}m
                                                        </span>
                                                        <div className={styles.flightArrowLine}>
                                                            <IoAirplaneSharp className={styles.flightPlaneIcon} />
                                                        </div>
                                                        {group.segments.length === 1 && group.segments[0].stops === 0 ? (
                                                            <span style={{ fontSize: 11, color: '#8B93A7' }}>Direct</span>
                                                        ) : group.segments.length > 1 ? (
                                                            <span style={{ fontSize: 11, color: '#8B93A7' }}>
                                                                {group.segments.length - 1} stop(s)
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className={`${styles.flightStation} ${styles.flightStationRight}`}>
                                                        <h4 className={styles.flightCode}>{lastSeg?.arrival?.airport_code}</h4>
                                                        <p className={styles.flightAirport}>
                                                            {moment(lastSeg?.arrival?.datetime).format('LT')}
                                                        </p>
                                                        <p className={styles.flightTime}>
                                                            {moment(lastSeg?.arrival?.datetime).format('DD MMM YYYY')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Makkah Hotel */}
                        {voucherDetail?.makkah_hotel && (
                            <section className={styles.section}>
                                <div className={styles.sectionTitleRow}>
                                    <span className={styles.sectionNum}>{nMakkah}</span>
                                    <span className={styles.sectionIcon}><FaHotel size={12} /></span>
                                    <h3 className={styles.sectionTitle}>Accommodation Details</h3>
                                    <span className={styles.sectionRight}>
                                        {voucherDetail.makkah_hotel.nights} Night{voucherDetail.makkah_hotel.nights > 1 ? 's' : ''} · Makkah
                                    </span>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    <div className={styles.flightSegmentCard}>
                                        <div className={styles.airlineRow}>
                                            {voucherDetail.makkah_hotel.first_image ? (
                                                <Image
                                                    src={voucherDetail.makkah_hotel.first_image}
                                                    width={48}
                                                    height={48}
                                                    alt={voucherDetail.makkah_hotel.name}
                                                    style={{ borderRadius: 8, objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <FaHotel size={22} color="#1B3B6F" />
                                            )}
                                            <div>
                                                <p className={styles.airlineNameText}>
                                                    {voucherDetail.makkah_hotel.name}
                                                    <span className={styles.cityChip}>
                                                        {voucherDetail.makkah_hotel.city || 'Makkah'}
                                                    </span>
                                                </p>
                                                <p className={styles.flightNumberText}>
                                                    <FaMapMarkerAlt size={10} style={{ marginRight: 4 }} />
                                                    {voucherDetail.makkah_hotel.location?.address}
                                                </p>
                                                {voucherDetail.makkah_hotel.star_rating && (
                                                    <div className={styles.starsRow} style={{ marginTop: 4, marginBottom: 0 }}>
                                                        {renderStars(voucherDetail.makkah_hotel.star_rating)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.flightRouteGrid}>
                                            <div className={styles.flightStation}>
                                                <h4 className={styles.flightCode}>CHECK-IN</h4>
                                                <p className={styles.flightTime}>
                                                    {moment(voucherDetail.makkah_hotel.check_in).format('DD MMM YYYY')}
                                                </p>
                                            </div>
                                            <div className={styles.flightArrow}>
                                                <span className={styles.flightDuration}>
                                                    {voucherDetail.makkah_hotel.nights} Nights
                                                </span>
                                                <div className={styles.flightArrowLine}>
                                                    <FaHotel className={styles.flightPlaneIcon} />
                                                </div>
                                            </div>
                                            <div className={`${styles.flightStation} ${styles.flightStationRight}`}>
                                                <h4 className={styles.flightCode}>CHECK-OUT</h4>
                                                <p className={styles.flightTime}>
                                                    {moment(voucherDetail.makkah_hotel.check_out).format('DD MMM YYYY')}
                                                </p>
                                            </div>
                                        </div>
                                        {voucherDetail.makkah_hotel.rooms?.some(r => r.price_added_to_package) && (
                                            <div className={styles.innerTableWrap}>
                                                <div className={styles.tableWrap}>
                                                    <table className={styles.dataTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Room Name</th>
                                                                <th>Board</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {voucherDetail.makkah_hotel.rooms.filter(r => r.price_added_to_package).flatMap((room, ri) =>
                                                                room.rates.filter(rate => rate.price_added_to_package).map((rate, rti) => (
                                                                    <tr key={`mk-${ri}-${rti}`}>
                                                                        <td className={styles.srCell}>{ri + 1}</td>
                                                                        <td style={{ fontWeight: 700 }}>
                                                                            <IoMdBed size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                                                            {room.name}
                                                                        </td>
                                                                        <td>{rate.board_name || '—'}</td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Madinah Hotel */}
                        {voucherDetail?.madinah_hotel && (
                            <section className={styles.section}>
                                <div className={styles.sectionTitleRow}>
                                    <span className={styles.sectionNum}>{nMadinah}</span>
                                    <span className={styles.sectionIcon}><FaHotel size={12} /></span>
                                    <h3 className={styles.sectionTitle}>Accommodation Details</h3>
                                    <span className={styles.sectionRight}>
                                        {voucherDetail.madinah_hotel.nights} Night{voucherDetail.madinah_hotel.nights > 1 ? 's' : ''} · Madinah
                                    </span>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    <div className={styles.flightSegmentCard}>
                                        <div className={styles.airlineRow}>
                                            {voucherDetail.madinah_hotel.first_image ? (
                                                <Image
                                                    src={voucherDetail.madinah_hotel.first_image}
                                                    width={48}
                                                    height={48}
                                                    alt={voucherDetail.madinah_hotel.name}
                                                    style={{ borderRadius: 8, objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <FaHotel size={22} color="#1B3B6F" />
                                            )}
                                            <div>
                                                <p className={styles.airlineNameText}>
                                                    {voucherDetail.madinah_hotel.name}
                                                    <span className={styles.cityChip}>
                                                        {voucherDetail.madinah_hotel.city || 'Madinah'}
                                                    </span>
                                                </p>
                                                <p className={styles.flightNumberText}>
                                                    <FaMapMarkerAlt size={10} style={{ marginRight: 4 }} />
                                                    {voucherDetail.madinah_hotel.location?.address}
                                                </p>
                                                {voucherDetail.madinah_hotel.star_rating && (
                                                    <div className={styles.starsRow} style={{ marginTop: 4, marginBottom: 0 }}>
                                                        {renderStars(voucherDetail.madinah_hotel.star_rating)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.flightRouteGrid}>
                                            <div className={styles.flightStation}>
                                                <h4 className={styles.flightCode}>CHECK-IN</h4>
                                                <p className={styles.flightTime}>
                                                    {moment(voucherDetail.madinah_hotel.check_in).format('DD MMM YYYY')}
                                                </p>
                                            </div>
                                            <div className={styles.flightArrow}>
                                                <span className={styles.flightDuration}>
                                                    {voucherDetail.madinah_hotel.nights} Nights
                                                </span>
                                                <div className={styles.flightArrowLine}>
                                                    <FaHotel className={styles.flightPlaneIcon} />
                                                </div>
                                            </div>
                                            <div className={`${styles.flightStation} ${styles.flightStationRight}`}>
                                                <h4 className={styles.flightCode}>CHECK-OUT</h4>
                                                <p className={styles.flightTime}>
                                                    {moment(voucherDetail.madinah_hotel.check_out).format('DD MMM YYYY')}
                                                </p>
                                            </div>
                                        </div>
                                        {voucherDetail.madinah_hotel.rooms?.some(r => r.price_added_to_package) && (
                                            <div className={styles.innerTableWrap}>
                                                <div className={styles.tableWrap}>
                                                    <table className={styles.dataTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Room Name</th>
                                                                <th>Board</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {voucherDetail.madinah_hotel.rooms.filter(r => r.price_added_to_package).flatMap((room, ri) =>
                                                                room.rates.filter(rate => rate.price_added_to_package).map((rate, rti) => (
                                                                    <tr key={`md-${ri}-${rti}`}>
                                                                        <td className={styles.srCell}>{ri + 1}</td>
                                                                        <td style={{ fontWeight: 700 }}>
                                                                            <IoMdBed size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                                                            {room.name}
                                                                        </td>
                                                                        <td>{rate.board_name || '—'}</td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Transfers */}
                        {selectedTransfer.length > 0 && (
                            <section className={styles.section}>
                                <div className={styles.sectionTitleRow}>
                                    <span className={styles.sectionNum}>{nTransfer}</span>
                                    <span className={styles.sectionIcon}><FaBus size={12} /></span>
                                    <h3 className={styles.sectionTitle}>Transfer Details</h3>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    {selectedTransfer.map((transfer, index) => (
                                        <div key={index} className={styles.flightSegmentCard}>
                                            <div className={styles.airlineRow}>
                                                <FaBus size={22} color="#1B3B6F" />
                                                <div>
                                                    <p className={styles.airlineNameText}>
                                                        {capitalize(transfer?.vehicle_details?.name)}
                                                    </p>
                                                    <p className={styles.flightNumberText}>
                                                        {capitalize(transfer?.trip_type)}
                                                        {transfer?.vehicle && <> · {capitalize(transfer.vehicle)}</>}
                                                    </p>
                                                </div>
                                            </div>
                                            {transfer?.locations?.map((loc, li) => (
                                                <div key={li} className={styles.flightRouteGrid}>
                                                    <div className={styles.flightStation}>
                                                        <h4 className={styles.flightCode}>PICKUP</h4>
                                                        <p className={styles.flightAirport}>{loc.pickup_address}</p>
                                                        {loc.outbound && (
                                                            <p className={styles.flightTime}>
                                                                {moment(loc.outbound).format('DD MMM YYYY, HH:mm')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className={styles.flightArrow}>
                                                        <span className={styles.flightDuration}>
                                                            {capitalize(transfer?.trip_type)}
                                                        </span>
                                                        <div className={styles.flightArrowLine}>
                                                            <FaBus className={styles.flightPlaneIcon} />
                                                        </div>
                                                    </div>
                                                    <div className={`${styles.flightStation} ${styles.flightStationRight}`}>
                                                        <h4 className={styles.flightCode}>DROPOFF</h4>
                                                        <p className={styles.flightAirport}>{loc.dropoff_address}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Visa */}
                        {selectedVisa.length > 0 && (
                            <section className={styles.section}>
                                <div className={styles.sectionTitleRow}>
                                    <span className={styles.sectionNum}>{nVisa}</span>
                                    <span className={styles.sectionIcon}><FaPassport size={12} /></span>
                                    <h3 className={styles.sectionTitle}>Visa Details</h3>
                                </div>
                                <div className={styles.tableWrap}>
                                    <table className={`${styles.dataTable} ${styles.navyTableHead}`}>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Visa Type</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedVisa.map((visa, i) => (
                                                <tr key={i}>
                                                    <td className={styles.srCell}>{i + 1}</td>
                                                    <td style={{ fontWeight: 700 }}>
                                                        {capitalize(visa?.visa_type) || '—'}
                                                        {visa?.description && (
                                                            <>
                                                                <br />
                                                                <span style={{ fontWeight: 500, color: '#6B7280' }}>
                                                                    {visa.description}
                                                                </span>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={styles.typeBadge}>Included</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {/* Important Info */}
                        <section className={styles.section}>
                            <div className={styles.sectionTitleRow}>
                                <span className={styles.sectionNum}>{nInfo}</span>
                                <span className={styles.sectionIcon}><FaCheckCircle size={11} /></span>
                                <h3 className={styles.sectionTitle}>Important Information</h3>
                            </div>
                            <ul className={styles.infoList}>
                                <li>
                                    <span className={styles.infoCheck}><FaCheckCircle size={10} /></span>
                                    Please present this voucher at check-in for all included services.
                                </li>
                                <li>
                                    <span className={styles.infoCheck}><FaCheckCircle size={10} /></span>
                                    All passengers must carry valid photo identification at all times.
                                </li>
                                <li>
                                    <span className={styles.infoCheck}><FaCheckCircle size={10} /></span>
                                    Check-in times and service schedules are subject to operator confirmation.
                                </li>
                                <li>
                                    <span className={styles.infoCheck}><FaCheckCircle size={10} /></span>
                                    This voucher covers only the services listed above.
                                </li>
                                <li>
                                    <span className={styles.infoCheck}><FaCheckCircle size={10} /></span>
                                    This is a computer-generated receipt and does not require a physical signature.
                                </li>
                            </ul>
                        </section>

                        <p className={styles.noteText}>
                            <b>Note:</b> This is a computer generated voucher and does not require any physical signature.
                        </p>
                    </div>

                    <footer className={styles.footerBar}>
                        <p className={styles.footerThanks}>Thanks for Choosing Umrah Tech</p>
                        <div className={styles.footerContact}>
                            <span><FaPhone size={11} /> 01217772522</span>
                            <span><FaEnvelope size={11} /> info@umrahtech.net</span>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
