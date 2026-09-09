'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './invoice.module.css';
import Image from 'next/image';
import HotelInvoiceLoader from '@/components/Loader/HotelInvoiceLoader';
import moment from 'moment';
import Link from 'next/link';
import {
    FaBus, FaFileInvoice, FaHotel, FaHome, FaCheckCircle, FaPhone, FaEnvelope,
    FaUser, FaUserFriends, FaPassport, FaPrint, FaDownload, FaReceipt, FaInfoCircle,
    FaMapMarkerAlt, FaStar,
} from 'react-icons/fa';
import { MdFlight } from 'react-icons/md';
import { IoWarningOutline } from 'react-icons/io5';
import airline from '@/util/airlines.json';

export default function Page() {
    const { id } = useParams();
    const [voucherDetail, setVoucherDetail] = useState({});
    const [voucherResponse, setVoucherResponse] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedTransfer, setSelectedTransfer] = useState([]);
    const [selectedVisa, setSelectedVisa] = useState([]);

    useEffect(() => {
        if (id) { fetchDetails(); }
    }, [id]);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customized/packages/booking/details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking_reference: id }),
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
                setVoucherDetail(res?.Content?.booking.temp_cart);
                setVoucherResponse(res?.Content.booking);
            } else {
                setErrorMessage(res?.Description);
            }
        } catch (err) {
            setIsLoading(false);
            console.error('Error fetching hotel details:', err);
        }
    };

    function capitalize(text) {
        if (!text) return '';
        return String(text).charAt(0).toUpperCase() + String(text).slice(1);
    }

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

    const refNo = voucherResponse?.booking_reference || id;
    const bookingStatus = (voucherResponse?.booking_status || '').toLowerCase();
    const paymentStatus = (voucherResponse?.payment_status || '').toLowerCase();
    const statusClass =
        bookingStatus === 'confirmed' ? styles.statusPillConfirmed
            : bookingStatus === 'cancelled' ? styles.statusPillCancelled
                : styles.statusPillPending;

    const currency = voucherDetail?.pricing?.currency || '';
    const grandTotal = Number(voucherDetail?.pricing?.total_price || 0);
    const amountPaid = paymentStatus === 'paid' || paymentStatus === 'completed' ? grandTotal : 0;
    const remaining = Math.max(grandTotal - amountPaid, 0);

    const totalNights = (Number(voucherDetail?.makkah_hotel?.nights) || 0)
        + (Number(voucherDetail?.madinah_hotel?.nights) || 0);

    const stayChips = [];
    if (voucherDetail?.makkah_hotel) {
        stayChips.push({ city: voucherDetail.makkah_hotel.city || 'Makkah', nights: voucherDetail.makkah_hotel.nights });
    }
    if (voucherDetail?.madinah_hotel) {
        stayChips.push({ city: voucherDetail.madinah_hotel.city || 'Madinah', nights: voucherDetail.madinah_hotel.nights });
    }

    const lead = voucherResponse?.lead_details || {};
    const adultsCount = voucherResponse?.other_passengers?.additional_adults?.length || 0;
    const childrenCount = voucherResponse?.other_passengers?.children_details?.length || 0;
    const totalGuests = adultsCount + childrenCount + 1;

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
                    <div className={styles.errormessagecontainer}>
                        <div className={styles.errormessagebox}>
                            <div className={styles.erroricon}>
                                <IoWarningOutline size={64} />
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
            </div>
        );
    }

    const renderHotelSection = (hotel, title) => {
        if (!hotel) return null;
        return (
            <section className={styles.section} key={title}>
                <div className={styles.sectionHead}>
                    <div className={styles.sectionHeadLeft}>
                        <span className={styles.sectionIcon}><FaHotel size={11} /></span>
                        <h3 className={styles.sectionTitle}>{title}</h3>
                    </div>
                    <span className={styles.sectionRight}>
                        {hotel.nights} Night{hotel.nights > 1 ? 's' : ''}
                    </span>
                </div>
                <div className={styles.segmentsWrapper}>
                    <div className={styles.flightSegmentCard}>
                        <div className={styles.airlineRow}>
                            <FaHotel size={22} color="#1B3B6F" />
                            <div>
                                <p className={styles.airlineNameText}>
                                    {hotel.name}
                                    {hotel.city && <span className={styles.cityChip}>{hotel.city}</span>}
                                </p>
                                <p className={styles.flightNumberText}>{hotel.location?.address}</p>
                            </div>
                        </div>
                        <div className={styles.flightRouteGrid}>
                            <div className={styles.flightStation}>
                                <h4 className={styles.flightCode}>CHECK-IN</h4>
                                <p className={styles.flightTime}>{moment(hotel.check_in).format('DD MMM YYYY')}</p>
                            </div>
                            <div className={styles.flightArrow}>
                                <span className={styles.flightDuration}>
                                    {hotel.nights} Night{hotel.nights > 1 ? 's' : ''}
                                </span>
                                <div className={styles.flightArrowLine}>
                                    <FaHotel className={styles.flightPlaneIcon} />
                                </div>
                            </div>
                            <div className={`${styles.flightStation} ${styles.flightStationRight}`}>
                                <h4 className={styles.flightCode}>CHECK-OUT</h4>
                                <p className={styles.flightTime}>{moment(hotel.check_out).format('DD MMM YYYY')}</p>
                            </div>
                        </div>
                        {hotel.rooms?.some(r => r.price_added_to_package) && (
                            <div className={styles.innerTableWrap}>
                                <div className={styles.priceTableWrap}>
                                    <table className={`${styles.priceTable} ${styles.navyTableHead}`}>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Room Name</th>
                                                <th>Board</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hotel.rooms.filter(r => r.price_added_to_package).flatMap((room, ri) =>
                                                room.rates.filter(rate => rate.price_added_to_package).map((rate, rti) => (
                                                    <tr key={`${title}-${ri}-${rti}`}>
                                                        <td>{ri + 1}</td>
                                                        <td style={{ fontWeight: 600 }}>{room.name}</td>
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
        );
    };

    return (
        <div className={styles.pageWrap}>
            <div className={styles.shell}>
                <div className={styles.previewBar}>
                    <span className={styles.previewLabel}>Invoice preview — {refNo}</span>
                    <div className={styles.previewActions}>
                        <Link href={`/umrah-getaway/voucher/${refNo}`} className={styles.linkChip}>
                            <FaFileInvoice size={12} /> Voucher
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

                <div id="invoice" className={styles.sheet}>
                    <div className={styles.watermark}>
                        <Image src="/watermark.png" width={450} height={450}
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                            alt="Watermark" quality={100} />
                    </div>

                    <header className={styles.brandHeader}>
                        <div className={styles.brandLeft}>
                            <div className={styles.brandLogoBox}>
                                <Image src="/images/navlogo.png" width={48} height={48} alt="Umrah Tech" quality={100} />
                            </div>
                            <div>
                                <h1 className={styles.brandName}>Umrah Tech</h1>
                                <p className={styles.brandTagline}>Trusted Umrah &amp; Hajj Technology Partner</p>
                            </div>
                        </div>
                        <div className={styles.brandContact}>
                            <span className={styles.brandContactItem}><FaPhone size={12} /> 01217772522</span>
                            <span className={styles.brandContactItem}><FaEnvelope size={12} /> info@umrahtech.net</span>
                        </div>
                    </header>

                    <div className={styles.body}>
                        <div className={styles.metaRow}>
                            <div className={styles.metaLeft}>
                                <h2 className={styles.invoiceTitle}>Invoice</h2>
                                <div className={styles.statusRow}>
                                    <span className={`${styles.statusPill} ${statusClass}`}>
                                        <FaCheckCircle size={11} />
                                        {bookingStatus ? bookingStatus.toUpperCase() : 'PENDING'}
                                    </span>
                                    <span className={styles.invoiceId}>{refNo}</span>
                                </div>
                            </div>
                            <div className={styles.metaCols}>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Date of Issue</span>
                                    <span className={styles.metaValue}>
                                        {voucherResponse?.created_at
                                            ? moment(voucherResponse.created_at).format('MMMM DD, YYYY')
                                            : '—'}
                                    </span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Customer</span>
                                    <span className={styles.metaValue}>
                                        {lead?.title} {lead?.firstName} {lead?.lastName}
                                    </span>
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Document</span>
                                    <span className={styles.metaValue}>Umrah Getaway</span>
                                </div>
                            </div>
                        </div>

                        {/* Lead Traveler */}
                        <section className={styles.section}>
                            <div className={styles.sectionHead}>
                                <div className={styles.sectionHeadLeft}>
                                    <span className={styles.sectionIcon}><FaUser size={11} /></span>
                                    <h3 className={styles.sectionTitle}>Lead Traveler</h3>
                                </div>
                            </div>
                            <div className={styles.card}>
                                <div className={styles.fieldGrid}>
                                    <div className={styles.field}>
                                        <span className={styles.fieldLabel}>Name</span>
                                        <div className={styles.fieldValue}>
                                            {lead?.title} {lead?.firstName} {lead?.lastName}
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <span className={styles.fieldLabel}>Email</span>
                                        <div className={styles.fieldValue}>{lead?.email || '—'}</div>
                                    </div>
                                    <div className={styles.field}>
                                        <span className={styles.fieldLabel}>Phone</span>
                                        <div className={styles.fieldValue}>{lead?.phone || '—'}</div>
                                    </div>
                                    <div className={styles.field}>
                                        <span className={styles.fieldLabel}>Status</span>
                                        <div className={styles.fieldValue}>
                                            <span className={styles.inlineStatus}>
                                                {bookingStatus ? capitalize(bookingStatus) : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Package Details */}
                        <section className={styles.section}>
                            <div className={styles.sectionHead}>
                                <div className={styles.sectionHeadLeft}>
                                    <span className={styles.sectionIcon}><FaStar size={11} /></span>
                                    <h3 className={styles.sectionTitle}>Package Details</h3>
                                </div>
                                {totalNights > 0 && (
                                    <span className={styles.sectionRight}>{totalNights} Nights</span>
                                )}
                            </div>
                            <div className={styles.card}>
                                <div className={styles.activityTitle}>Umrah Getaway Package</div>
                                <div className={`${styles.fieldGrid} ${styles.fieldGrid3}`}>
                                    <div className={styles.field}>
                                        <span className={styles.fieldLabel}>Duration</span>
                                        <div className={styles.fieldValue}>
                                            {totalNights > 0 ? `${totalNights} Nights` : '—'}
                                        </div>
                                    </div>
                                    <div className={styles.field}>
                                        <span className={styles.fieldLabel}>Guests</span>
                                        <div className={styles.fieldValue}>{totalGuests}</div>
                                    </div>
                                    <div className={styles.field}>
                                        <span className={styles.fieldLabel}>Payment</span>
                                        <div className={styles.fieldValue}>
                                            {(voucherResponse?.payment_status || '—').toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                {stayChips.length > 0 && (
                                    <div className={styles.packageStayRow}>
                                        {stayChips.map((chip, i) => (
                                            <span key={i} className={styles.packageStayChip}>
                                                {chip.city} · {chip.nights} Nights
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Passenger Details */}
                        <section className={styles.section}>
                            <div className={styles.sectionHead}>
                                <div className={styles.sectionHeadLeft}>
                                    <span className={styles.sectionIcon}><FaUserFriends size={11} /></span>
                                    <h3 className={styles.sectionTitle}>Passenger Details</h3>
                                </div>
                            </div>
                            <div className={styles.priceTableWrap}>
                                <table className={`${styles.priceTable} ${styles.navyTableHead}`}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Full Name</th>
                                            <th>Type</th>
                                            <th>Gender</th>
                                            <th>Contact</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>1</td>
                                            <td>
                                                <strong>{lead?.title} {lead?.firstName} {lead?.lastName}</strong>
                                            </td>
                                            <td><span className={styles.typeBadge}>Lead / Adult</span></td>
                                            <td>{capitalize(lead?.gender) || '—'}</td>
                                            <td>
                                                {lead?.email && <div>{lead.email}</div>}
                                                {lead?.phone && <div>{lead.phone}</div>}
                                            </td>
                                        </tr>
                                        {voucherResponse?.other_passengers?.additional_adults?.map((adult, i) => (
                                            <tr key={`adult-${i}`}>
                                                <td>{i + 2}</td>
                                                <td><strong>{adult.firstName} {adult.lastName}</strong></td>
                                                <td><span className={styles.typeBadge}>Adult</span></td>
                                                <td>{capitalize(adult.gender)}</td>
                                                <td>—</td>
                                            </tr>
                                        ))}
                                        {voucherResponse?.other_passengers?.children_details?.map((child, i) => {
                                            const offset = 1 + adultsCount;
                                            return (
                                                <tr key={`child-${i}`}>
                                                    <td>{offset + i + 1}</td>
                                                    <td><strong>{child.firstName} {child.lastName}</strong></td>
                                                    <td><span className={`${styles.typeBadge} ${styles.typeBadgeChild}`}>Child</span></td>
                                                    <td>{capitalize(child.gender)}</td>
                                                    <td>—</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {lead?.address && (
                                <div className={styles.addressRow}>
                                    <span className={styles.addressLabel}>Address:</span>
                                    <span className={styles.addressValue}>{lead.address}</span>
                                </div>
                            )}
                            {lead?.country && (
                                <div className={styles.addressRow}>
                                    <span className={styles.addressLabel}>
                                        <FaMapMarkerAlt size={11} style={{ marginRight: 4 }} />
                                        Country:
                                    </span>
                                    <span className={styles.addressValue}>{lead.country}</span>
                                </div>
                            )}
                        </section>

                        {/* Flight Details */}
                        {voucherDetail?.flight && (
                            <section className={styles.section}>
                                <div className={styles.sectionHead}>
                                    <div className={styles.sectionHeadLeft}>
                                        <span className={styles.sectionIcon}><MdFlight size={14} /></span>
                                        <h3 className={styles.sectionTitle}>Flight Details</h3>
                                    </div>
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
                                                            {firstSeg?.flight_number}&nbsp;·&nbsp;{firstSeg?.cabin_class?.name || capitalize(voucherDetail.flight.trip_type)}
                                                        </p>
                                                    </div>
                                                    <span className={styles.flightLegLabel}>{group.label}</span>
                                                </div>
                                                <div className={styles.flightRouteGrid}>
                                                    <div className={styles.flightStation}>
                                                        <h4 className={styles.flightCode}>{firstSeg?.departure?.airport_code}</h4>
                                                        <p className={styles.flightAirport}>Departure</p>
                                                        <p className={styles.flightTime}>{moment(firstSeg?.departure?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                    </div>
                                                    <div className={styles.flightArrow}>
                                                        <span className={styles.flightDuration}>
                                                            {Math.floor(totalMin / 60)}h {totalMin % 60}m
                                                        </span>
                                                        <div className={styles.flightArrowLine}>
                                                            <MdFlight className={styles.flightPlaneIcon} />
                                                        </div>
                                                        {group.segments.length > 1 && (
                                                            <span style={{ fontSize: 11, color: '#8B93A7' }}>
                                                                {group.segments.length - 1} stop(s)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`${styles.flightStation} ${styles.flightStationRight}`}>
                                                        <h4 className={styles.flightCode}>{lastSeg?.arrival?.airport_code}</h4>
                                                        <p className={styles.flightAirport}>Arrival</p>
                                                        <p className={styles.flightTime}>{moment(lastSeg?.arrival?.datetime).format('DD MMM YYYY, HH:mm')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {renderHotelSection(voucherDetail?.makkah_hotel, 'Makkah Accommodation')}
                        {renderHotelSection(voucherDetail?.madinah_hotel, 'Madinah Accommodation')}

                        {/* Transfers */}
                        {selectedTransfer.length > 0 && (
                            <section className={styles.section}>
                                <div className={styles.sectionHead}>
                                    <div className={styles.sectionHeadLeft}>
                                        <span className={styles.sectionIcon}><FaBus size={11} /></span>
                                        <h3 className={styles.sectionTitle}>Transfer Details</h3>
                                    </div>
                                </div>
                                <div className={styles.segmentsWrapper}>
                                    {selectedTransfer.map((transfer, index) => (
                                        <div key={index} className={styles.flightSegmentCard}>
                                            <div className={styles.airlineRow}>
                                                <FaBus size={22} color="#1B3B6F" />
                                                <div>
                                                    <p className={styles.airlineNameText}>
                                                        {capitalize(transfer?.vehicle_details?.name)} — {capitalize(transfer?.vehicle)}
                                                    </p>
                                                    <p className={styles.flightNumberText}>
                                                        {capitalize(transfer?.trip_type)}
                                                        {transfer?.vehicle_details?.passenger_capacity && (
                                                            <>&nbsp;·&nbsp;{transfer.vehicle_details.passenger_capacity} Passengers</>
                                                        )}
                                                        {transfer?.vehicle_details?.luggage_capacity && (
                                                            <>&nbsp;·&nbsp;{transfer.vehicle_details.luggage_capacity} Luggage</>
                                                        )}
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
                                                        <span className={styles.flightDuration}>{capitalize(transfer?.trip_type)}</span>
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
                                <div className={styles.sectionHead}>
                                    <div className={styles.sectionHeadLeft}>
                                        <span className={styles.sectionIcon}><FaPassport size={11} /></span>
                                        <h3 className={styles.sectionTitle}>Visa Details</h3>
                                    </div>
                                </div>
                                <div className={styles.priceTableWrap}>
                                    <table className={`${styles.priceTable} ${styles.navyTableHead}`}>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Visa Type</th>
                                                <th>Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedVisa.map((visa, i) => (
                                                <tr key={i}>
                                                    <td>{i + 1}</td>
                                                    <td style={{ fontWeight: 600 }}>{visa?.visa_type || '—'}</td>
                                                    <td>{visa?.description || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {/* Price Breakdown */}
                        {voucherDetail?.pricing && (
                            <section className={styles.section}>
                                <div className={styles.sectionHead}>
                                    <div className={styles.sectionHeadLeft}>
                                        <span className={styles.sectionIcon}><FaReceipt size={11} /></span>
                                        <h3 className={styles.sectionTitle}>Price Breakdown</h3>
                                    </div>
                                </div>
                                <div className={styles.priceTableWrap} style={{ marginBottom: 12 }}>
                                    <table className={styles.priceTable}>
                                        <thead>
                                            <tr>
                                                <th>Description</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {voucherDetail.pricing.flight_price ? (
                                                <tr>
                                                    <td>Flight</td>
                                                    <td>{currency} {Number(voucherDetail.pricing.flight_price).toFixed(2)}</td>
                                                </tr>
                                            ) : null}
                                            {voucherDetail.pricing.makkah_hotel_price ? (
                                                <tr>
                                                    <td>Hotel Makkah</td>
                                                    <td>{currency} {Number(voucherDetail.pricing.makkah_hotel_price).toFixed(2)}</td>
                                                </tr>
                                            ) : null}
                                            {voucherDetail.pricing.madinah_hotel_price ? (
                                                <tr>
                                                    <td>Hotel Madinah</td>
                                                    <td>{currency} {Number(voucherDetail.pricing.madinah_hotel_price).toFixed(2)}</td>
                                                </tr>
                                            ) : null}
                                            {voucherDetail.transfer_selected_id !== null && voucherDetail.pricing.transfer_price ? (
                                                <tr>
                                                    <td>Transfers</td>
                                                    <td>{currency} {Number(voucherDetail.pricing.transfer_price).toFixed(2)}</td>
                                                </tr>
                                            ) : null}
                                            {voucherDetail.visa_selected_id !== null && voucherDetail.pricing.visa_price ? (
                                                <tr>
                                                    <td>Visa</td>
                                                    <td>{currency} {Number(voucherDetail.pricing.visa_price).toFixed(2)}</td>
                                                </tr>
                                            ) : null}
                                        </tbody>
                                    </table>
                                </div>
                                <div className={styles.totals}>
                                    <div className={styles.totalsRow}>
                                        <span>Subtotal</span>
                                        <strong>{currency} {grandTotal.toFixed(2)}</strong>
                                    </div>
                                    <div className={styles.grandTotal}>
                                        <span>GRAND TOTAL</span>
                                        <strong>{currency} {grandTotal.toFixed(2)}</strong>
                                    </div>
                                    <div className={styles.totalsRow}>
                                        <span>Amount Paid</span>
                                        <strong>{currency} {Number(amountPaid).toFixed(2)}</strong>
                                    </div>
                                    <div className={styles.remainingBar}>
                                        <span>Remaining Balance</span>
                                        <strong>{currency} {Number(remaining).toFixed(2)}</strong>
                                    </div>
                                </div>
                                <p className={styles.noteText} style={{ textAlign: 'right', marginTop: 8 }}>
                                    Included VAT and Taxes
                                </p>
                            </section>
                        )}

                        {/* Important info */}
                        <section className={styles.section}>
                            <div className={styles.sectionHead}>
                                <div className={styles.sectionHeadLeft}>
                                    <span className={styles.sectionIcon}><FaInfoCircle size={11} /></span>
                                    <h3 className={styles.sectionTitle}>Important Information</h3>
                                </div>
                            </div>
                            <ul className={styles.infoGrid}>
                                <li>
                                    <span className={styles.infoCheck}><FaCheckCircle size={10} /></span>
                                    The invoice displays the complete pricing details of your Umrah Getaway booking, inclusive of all applicable taxes.
                                </li>
                                <li>
                                    <span className={styles.infoCheck}><FaCheckCircle size={10} /></span>
                                    Please verify the information and retain this invoice for your records.
                                </li>
                                <li>
                                    <span className={styles.infoCheck}><FaCheckCircle size={10} /></span>
                                    This is a computer-generated receipt and does not require a physical signature.
                                </li>
                                <li>
                                    <span className={styles.infoCheck}><FaCheckCircle size={10} /></span>
                                    Present your voucher at check-in for all included package services.
                                </li>
                            </ul>
                        </section>

                        <p className={styles.noteText}>
                            <b>Note:</b> This is a computer generated invoice and does not require any physical signature.
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
