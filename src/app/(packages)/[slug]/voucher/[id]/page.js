'use client'
import styles from './voucher.module.css'
import moment from 'moment'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import HotelInvoiceLoader from '@/components/Loader/HotelInvoiceLoader'
import {
  FaBus, FaFileInvoice, FaHotel, FaUser, FaUserFriends, FaHome, FaStar,
  FaConciergeBell, FaPassport, FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaPrint, FaDownload, FaCheckCircle, FaCalendarAlt, FaUsers, FaHashtag,
  FaClock,
} from 'react-icons/fa'
import { MdFlight } from 'react-icons/md'
import { IoWarningOutline } from 'react-icons/io5'
import Link from 'next/link'

export default function Page() {
  const { id } = useParams()
  const ref = useRef()
  const [voucherDetail, setVoucherDetail] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchDetails()
  }, [id])

  const fetchDetails = async () => {
    setIsLoading(true)
    try {
      const responses = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/packages/booking/${id}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      )
      const res = await responses.json()
      setIsLoading(false)
      if (res.Success) {
        const uniqueRooms = [
          ...new Map(
            res?.Content?.booking.room_selections_original.map((room) => [
              room.type,
              room,
            ]),
          ).values(),
        ]
        res.Content.booking.room_selections_original = uniqueRooms
        setVoucherDetail(res?.Content?.booking)
      } else {
        setErrorMessage(res?.Description)
      }
    } catch (err) {
      setIsLoading(false)
      console.error('Error fetching package details:', err)
    }
  }

  function capitalize(text) {
    if (!text) return ''
    return String(text).charAt(0).toUpperCase() + String(text).slice(1)
  }

  function capitalizeString(str) {
    if (!str) return ''
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const EXCURSION_CITY_ORDER = ['Makkah', 'Madinah']

  function groupExcursionsByCity(excursions) {
    if (!Array.isArray(excursions) || excursions.length === 0) return {}
    const groups = {}
    excursions.forEach((exc) => {
      const city = exc?.city || 'Other'
      if (!groups[city]) groups[city] = []
      groups[city].push(exc)
    })
    const ordered = {}
    EXCURSION_CITY_ORDER.forEach((city) => {
      if (groups[city]) ordered[city] = groups[city]
    })
    Object.keys(groups)
      .filter((city) => !EXCURSION_CITY_ORDER.includes(city))
      .sort()
      .forEach((city) => {
        ordered[city] = groups[city]
      })
    return ordered
  }

  function getTransferExcursions(transfer) {
    return transfer?.items?.data?.excursions ?? []
  }

  const getTotalGuests = () => {
    const adults = voucherDetail?.room_selections_original?.reduce(
      (sum, room) =>
        sum +
        (room?.adultsInRoom >= 0 ? room?.adultsInRoom : room.adults || 0) +
        (room.adults_without_bed || 0),
      0,
    )
    const children = voucherDetail?.room_selections_original?.reduce(
      (sum, room) =>
        sum +
        (room?.childrenInRoom >= 0
          ? room?.childrenInRoom
          : room.children || 0) +
        (room.children_without_bed || 0),
      0,
    )
    const infants = voucherDetail?.room_selections_original?.reduce(
      (sum, room) =>
        sum +
        (room?.infantsInRoom >= 0 ? room?.infantsInRoom : room.infants || 0) +
        (room.infants_without_bed || 0),
      0,
    )
    return [
      `${adults} Adult${adults !== 1 ? 's' : ''}`,
      children > 0 && `${children} Child${children !== 1 ? 'ren' : ''}`,
      infants > 0 && `${infants} Infant${infants !== 1 ? 's' : ''}`,
    ]
      .filter(Boolean)
      .join(', ')
  }

  const CalculateWithoutBeds = (type) => {
    const RoomList =
      voucherDetail?.room_selections_original?.filter(
        (room) => room.type === type,
      ) || []

    const adults = RoomList.reduce(
      (sum, room) => sum + (room.adults_without_bed || 0),
      0,
    )
    const children = RoomList.reduce(
      (sum, room) => sum + (room.children_without_bed || 0),
      0,
    )
    const infants = RoomList.reduce(
      (sum, room) => sum + (room.infants_without_bed || 0),
      0,
    )

    if (adults === 0 && children === 0 && infants === 0) {
      return '-'
    }

    return `${adults} Adult${adults !== 1 ? 's' : ''}, ${children} Child${children !== 1 ? 'ren' : ''}, ${infants} Infant${infants !== 1 ? 's' : ''}`
  }

  function convertToCustomerCurrency(price) {
    if (!price || !voucherDetail.customer_exchange_rate)
      return Number(price || 0).toFixed(2)
    if (voucherDetail.currency_code === voucherDetail.customer_currency) {
      return Number(price).toFixed(2)
    }
    const convertedPrice =
      Number(price) * Number(voucherDetail.customer_exchange_rate)
    return convertedPrice.toFixed(2)
  }

  const handlePrint = () => window.print()

  const bookingRef = voucherDetail?.booking_reference || id;
  const invoiceNo = voucherDetail?.invoice_number;
  const paymentStatus = (voucherDetail?.payment_status || '').toLowerCase()
  const bookingStatus = (voucherDetail?.booking_status || '').toLowerCase()
  const nights =
    voucherDetail?.packageDetails?.start_date &&
      voucherDetail?.packageDetails?.end_date
      ? moment(voucherDetail.packageDetails.end_date).diff(
        moment(voucherDetail.packageDetails.start_date),
        'days',
      )
      : 0
  const currency =
    voucherDetail?.customer_currency || voucherDetail?.currency_code || ''

  const hasOtherGuests =
    voucherDetail?.other_passengers?.additional_adults?.length > 0 ||
    voucherDetail?.other_passengers?.children_details?.length > 0 ||
    voucherDetail?.other_passengers?.infants_details?.length > 0

  return (
    <div className={styles.pageWrap}>
      <div className={styles.shell}>
        {isLoading ? (
          <div className={styles.sheet}><HotelInvoiceLoader /></div>
        ) : errorMessage ? (
          <div className="alert alert-danger text-center p-5">
            <IoWarningOutline className="text-warning" size={80} />
            <h5 className="mt-3">{errorMessage}</h5>
          </div>
        ) : (
          <>
            <div className={styles.previewBar}>
              <span className={styles.previewLabel}>Voucher preview — {bookingRef}</span>
              <div className={styles.previewActions}>
                <Link
                  href={`/${voucherDetail?.packageDetails?.category?.slug}/invoice/${voucherDetail?.booking_reference}`}
                  className={styles.linkChip}
                >
                  <FaFileInvoice size={12} /> Invoice
                </Link>
                <Link href="/" className={styles.linkChip}><FaHome size={12} /> Home</Link>
                <button type="button" className={styles.btnPrint} onClick={handlePrint}>
                  <FaPrint size={13} /> Print
                </button>
                {/* <button type="button" className={styles.btnPdf} onClick={handlePrint}>
                  <FaDownload size={13} /> Download PDF
                </button> */}
              </div>
            </div>

            <div ref={ref} id="voucher" className={styles.sheet}>
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
                    {invoiceNo && <span className={`${styles.invoBadge} mx-2`}> Invoice No: {invoiceNo}</span>}
                    <h2 className={styles.summaryTitle}>Package Booking Voucher</h2>
                    <p className={styles.summaryDesc}>
                      Present this voucher at check-in for all included package
                      services. Keep it with your travel documents.
                    </p>
                  </div>
                  <div className={styles.ticketCard}>
                    <div className={styles.ticketTop}>
                      <span className={styles.ticketLabel}>
                        <FaHashtag size={10} /> Booking Ref
                      </span>
                      {/* <span
                        className={`${styles.paidBadge} ${paymentStatus !== 'paid' && paymentStatus !== 'completed'
                            ? styles.pendingPayBadge
                            : ''
                          }`}
                      >
                        {paymentStatus === 'paid' || paymentStatus === 'completed'
                          ? 'PAID'
                          : (voucherDetail?.payment_status || 'PENDING').toUpperCase()}
                      </span> */}
                    </div>
                    <p className={styles.ticketRef}>{bookingRef}</p>
                    <div className={styles.ticketGrid}>
                      <div className={styles.ticketItem}>
                        <FaCalendarAlt size={12} className={styles.ticketItemIcon} />
                        <div>
                          <span className={styles.ticketItemLabel}>Booking Date</span>
                          <span className={styles.ticketItemValue}>
                            {voucherDetail?.created_at
                              ? moment(voucherDetail.created_at, 'DD-MM-YYYY HH:mm:ss').format('MMM DD, YYYY')
                              : '—'}
                          </span>
                        </div>
                      </div>
                      <div className={styles.ticketItem}>
                        <FaCheckCircle size={12} className={styles.ticketItemIcon} />
                        <div>
                          <span className={styles.ticketItemLabel}>Booking Status</span>
                          <span className={`${styles.ticketItemValue} ${styles.statusOk}`}>
                            {(voucherDetail?.booking_status || 'confirmed').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className={styles.ticketItem}>
                        <FaUsers size={12} className={styles.ticketItemIcon} />
                        <div>
                          <span className={styles.ticketItemLabel}>Pax</span>
                          <span className={styles.ticketItemValue}>{getTotalGuests()}</span>
                        </div>
                      </div>
                      <div className={styles.ticketItem}>
                      <FaCheckCircle size={12} className={styles.ticketItemIcon} />
                        <div>
                          <span className={styles.ticketItemLabel}>Payment Status</span>
                          <span
                            className={`${styles.paidBadge} ${paymentStatus !== 'paid' && paymentStatus !== 'completed'
                                ? styles.pendingPayBadge
                                : ''
                              }`}
                          >
                            {paymentStatus === 'paid' || paymentStatus === 'completed'
                              ? 'PAID'
                              : (voucherDetail?.payment_status || 'PENDING').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* <div className={styles.dateRibbon}>
                  <div className={styles.dateSide}>
                    <span className={styles.dateSideIcon}><FaCalendarAlt size={14} /></span>
                    <div>
                      <span className={styles.dateSideLabel}>Start</span>
                      <span className={styles.dateSideValue}>
                        {voucherDetail?.packageDetails?.start_date
                          ? moment(voucherDetail.packageDetails.start_date).format('MMM DD, YYYY')
                          : '—'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.dateCenter}>
                    <div className={styles.dateCenterLine} />
                    <span className={styles.dateCenterBadge}>{nights} NIGHTS</span>
                    <div className={styles.dateCenterLine} />
                  </div>
                  <div className={styles.dateSide}>
                    <span className={styles.dateSideIcon}><FaCalendarAlt size={14} /></span>
                    <div>
                      <span className={styles.dateSideLabel}>End</span>
                      <span className={styles.dateSideValue}>
                        {voucherDetail?.packageDetails?.end_date
                          ? moment(voucherDetail.packageDetails.end_date).format('MMM DD, YYYY')
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div> */}

                {/* 01 Package Details */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>01</span>
                    <span className={styles.sectionIcon}><FaStar size={12} /></span>
                    <h3 className={styles.sectionTitle}>Package Details</h3>
                  </div>
                  <div className={styles.activityHero}>
                    <h4 className={styles.activityTitle}>
                      {voucherDetail?.packageDetails?.title}
                    </h4>
                    {voucherDetail?.packageDetails?.star_rating && (
                      <div className={styles.starsRow}>
                        {Array(
                          Math.floor(
                            Number(voucherDetail?.packageDetails?.star_rating || 0),
                          ),
                        )
                          .fill(0)
                          .map((_, i) => (
                            <FaStar key={i} size={13} />
                          ))}
                        <span className={styles.starsScore}>
                          {voucherDetail?.packageDetails?.star_rating} Star Package
                        </span>
                      </div>
                    )}
                    <div className={styles.metaGrid}>
                      <div>
                        <span className={styles.fieldLabel}>Duration</span>
                        <div className={styles.fieldValue}>{nights} Nights</div>
                      </div>
                      <div>
                        <span className={styles.fieldLabel}>Start Date</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.packageDetails?.start_date
                            ? moment(voucherDetail.packageDetails.start_date).format('DD-MM-YYYY')
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <span className={styles.fieldLabel}>End Date</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.packageDetails?.end_date
                            ? moment(voucherDetail.packageDetails.end_date).format('DD-MM-YYYY')
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <span className={styles.fieldLabel}>Pax</span>
                        <div className={styles.fieldValue}>{getTotalGuests()}</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 02 Booking By */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>02</span>
                    <span className={styles.sectionIcon}><FaUser size={11} /></span>
                    <h3 className={styles.sectionTitle}>Booking By</h3>
                  </div>
                  <div className={styles.bookingGrid}>
                    <div>
                      <span className={styles.fieldLabel}>Full Name</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.lead_title}{' '}
                        {voucherDetail?.lead_first_name}{' '}
                        {voucherDetail?.lead_last_name}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Email</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.lead_email || '—'}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Phone</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.lead_phone_code}
                        {voucherDetail?.lead_phone || '—'}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Gender</span>
                      <div className={styles.fieldValue}>
                        {capitalize(voucherDetail?.lead_gender) || '—'}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Country</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.lead_country || '—'}
                      </div>
                    </div>
                    {voucherDetail?.lead_address && (
                      <div>
                        <span className={styles.fieldLabel}>Address</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail.lead_address}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* 03 Additional Guests */}
                {hasOtherGuests && (
                  <section className={styles.section}>
                    <div className={styles.sectionTitleRow}>
                      <span className={styles.sectionNum}>03</span>
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
                          {voucherDetail?.other_passengers?.additional_adults?.map(
                            (adult, i) => (
                              <tr key={`adult-${i}`}>
                                <td className={styles.srCell}>{i + 1}</td>
                                <td style={{ fontWeight: 700 }}>
                                  {adult.first_name} {adult.last_name}
                                </td>
                                <td>{capitalize(adult.gender)}</td>
                                <td>
                                  <span className={styles.typeBadge}>Adult</span>
                                </td>
                              </tr>
                            ),
                          )}
                          {voucherDetail?.other_passengers?.children_details?.map(
                            (child, i) => (
                              <tr key={`child-${i}`}>
                                <td className={styles.srCell}>
                                  {(voucherDetail?.other_passengers?.additional_adults
                                    ?.length || 0) +
                                    i +
                                    1}
                                </td>
                                <td style={{ fontWeight: 700 }}>
                                  {child.first_name} {child.last_name}
                                </td>
                                <td>{capitalize(child.gender)}</td>
                                <td>
                                  <span
                                    className={`${styles.typeBadge} ${styles.typeBadgeChild}`}
                                  >
                                    Child
                                  </span>
                                </td>
                              </tr>
                            ),
                          )}
                          {voucherDetail?.other_passengers?.infants_details?.map(
                            (infant, i) => {
                              const offset =
                                (voucherDetail?.other_passengers?.additional_adults
                                  ?.length || 0) +
                                (voucherDetail?.other_passengers?.children_details
                                  ?.length || 0)
                              return (
                                <tr key={`infant-${i}`}>
                                  <td className={styles.srCell}>{offset + i + 1}</td>
                                  <td style={{ fontWeight: 700 }}>
                                    {infant.first_name} {infant.last_name}
                                  </td>
                                  <td>{capitalize(infant.gender)}</td>
                                  <td>
                                    <span
                                      className={`${styles.typeBadge} ${styles.typeBadgeInfant}`}
                                    >
                                      Infant
                                    </span>
                                  </td>
                                </tr>
                              )
                            },
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* 04 Accommodation */}
                {voucherDetail?.room_selections?.length > 0 && (
                  <section className={styles.section}>
                    <div className={styles.sectionTitleRow}>
                      <span className={styles.sectionNum}>04</span>
                      <span className={styles.sectionIcon}><FaHotel size={12} /></span>
                      <h3 className={styles.sectionTitle}>Accommodation Details</h3>
                      {/* <span className={styles.sectionRight}>{nights} Nights</span> */}
                    </div>
                    <div className={styles.segmentsWrapper}>
                      {voucherDetail.room_selections.map((item, index) => (
                        <div key={index} className={styles.flightSegmentCard}>
                          <div className={styles.airlineRow}>
                            <FaHotel size={22} color="#1B3B6F" />
                            <div>
                              <p className={styles.airlineNameText}>
                                {capitalizeString(item?.hotel?.name)}
                                {item?.hotel?.city && (
                                  <span className={styles.cityChip}>
                                    {item.hotel.city}
                                  </span>
                                )}
                              </p>
                              <p className={styles.flightNumberText}>
                                {item?.hotel?.address}
                              </p>
                            </div>
                          </div>
                          <div className={styles.flightRouteGrid}>
                            <div className={styles.flightStation}>
                              <h4 className={styles.flightCode}>CHECK-IN</h4>
                              <p className={styles.flightTime}>
                                {moment(item?.hotel?.booked_from).format('DD MMM YYYY')}
                              </p>
                            </div>
                            <div className={styles.flightArrow}>
                              <span className={styles.flightDuration}>
                                {moment(item?.hotel?.booked_to).diff(
                                  moment(item?.hotel?.booked_from),
                                  'days',
                                )}{' '}
                                Nights
                              </span>
                              <div className={styles.flightArrowLine}>
                                <FaHotel className={styles.flightPlaneIcon} />
                              </div>
                            </div>
                            <div
                              className={`${styles.flightStation} ${styles.flightStationRight}`}
                            >
                              <h4 className={styles.flightCode}>CHECK-OUT</h4>
                              <p className={styles.flightTime}>
                                {moment(item?.hotel?.booked_to).format('DD MMM YYYY')}
                              </p>
                            </div>
                          </div>
                          <div className={styles.innerTableWrap}>
                            <div className={styles.tableWrap}>
                              <table className={styles.dataTable}>
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Room Type</th>
                                    <th>Meal / View</th>
                                    <th>Adults</th>
                                    <th>Children</th>
                                    <th>Infant</th>
                                    <th>Without Beds</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.rooms.map((room, rindex) => (
                                    <tr key={rindex}>
                                      <td className={styles.srCell}>{rindex + 1}</td>
                                      <td style={{ fontWeight: 700 }}>
                                        {room.selection.label === 'without_beds'
                                          ? 'Without Beds'
                                          : `${room.selection.label} × ${room.selection.rooms}`}
                                      </td>
                                      <td>
                                        {[
                                          room?.rooms?.items?.data?.meal,
                                          room?.rooms?.items?.data?.view,
                                        ]
                                          .filter(Boolean)
                                          .join(' + ') || '—'}
                                      </td>
                                      <td>{room.selection.adults}</td>
                                      <td>{room.selection.children}</td>
                                      <td>{room.selection.infants}</td>
                                      <td>
                                        {CalculateWithoutBeds(room.selection.type)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 05 Flight Details */}
                {(voucherDetail?.flights?.length > 0 ||
                  voucherDetail?.flights?.some((f) =>
                    f.stops?.some((s) => s.is_return === true),
                  )) && (
                    <section className={styles.section}>
                      <div className={styles.sectionTitleRow}>
                        <span className={styles.sectionNum}>05</span>
                        <span className={styles.sectionIcon}><MdFlight size={14} /></span>
                        <h3 className={styles.sectionTitle}>Flight Details</h3>
                      </div>
                      <div className={styles.segmentsWrapper}>
                        {voucherDetail.flights?.map((item, index) =>
                          item.stops
                            ?.filter((s) => s.is_return === false)
                            .map((flight, fIndex) => (
                              <div
                                key={`dep-${index}-${fIndex}`}
                                className={styles.flightSegmentCard}
                              >
                                <div className={styles.airlineRow}>
                                  <MdFlight size={26} color="#1B3B6F" />
                                  <div>
                                    <p className={styles.airlineNameText}>
                                      {flight.airline_name}
                                    </p>
                                    <p className={styles.flightNumberText}>
                                      {flight.flight_number}&nbsp;·&nbsp;
                                      {capitalize(flight.type)}
                                    </p>
                                  </div>
                                  <span className={styles.flightLegLabel}>Outbound</span>
                                </div>
                                <div className={styles.flightRouteGrid}>
                                  <div className={styles.flightStation}>
                                    <h4 className={styles.flightCode}>
                                      {flight?.departure_from}
                                    </h4>
                                    <p className={styles.flightAirport}>Departure</p>
                                    <p className={styles.flightTime}>
                                      {moment
                                        .utc(flight.datetime_from)
                                        .format('DD MMM YYYY, LT')}
                                    </p>
                                  </div>
                                  <div className={styles.flightArrow}>
                                    <span className={styles.flightDuration}>
                                      {flight.duration}
                                    </span>
                                    <div className={styles.flightArrowLine}>
                                      <MdFlight className={styles.flightPlaneIcon} />
                                    </div>
                                  </div>
                                  <div
                                    className={`${styles.flightStation} ${styles.flightStationRight}`}
                                  >
                                    <h4 className={styles.flightCode}>
                                      {flight?.departure_to}
                                    </h4>
                                    <p className={styles.flightAirport}>Arrival</p>
                                    <p className={styles.flightTime}>
                                      {moment
                                        .utc(flight.datetime_to)
                                        .format('DD MMM YYYY, LT')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )),
                        )}
                        {voucherDetail.flights?.map((item, index) =>
                          item.stops
                            ?.filter((s) => s.is_return === true)
                            .map((flight, fIndex) => (
                              <div
                                key={`ret-${index}-${fIndex}`}
                                className={styles.flightSegmentCard}
                              >
                                <div className={styles.airlineRow}>
                                  <MdFlight size={26} color="#1B3B6F" />
                                  <div>
                                    <p className={styles.airlineNameText}>
                                      {flight.airline_name}
                                    </p>
                                    <p className={styles.flightNumberText}>
                                      {flight.flight_number}&nbsp;·&nbsp;
                                      {capitalize(flight.type)}
                                    </p>
                                  </div>
                                  <span className={styles.flightLegLabel}>Return</span>
                                </div>
                                <div className={styles.flightRouteGrid}>
                                  <div className={styles.flightStation}>
                                    <h4 className={styles.flightCode}>
                                      {flight?.departure_from}
                                    </h4>
                                    <p className={styles.flightAirport}>Departure</p>
                                    <p className={styles.flightTime}>
                                      {moment
                                        .utc(flight.datetime_from)
                                        .format('DD MMM YYYY, LT')}
                                    </p>
                                  </div>
                                  <div className={styles.flightArrow}>
                                    <span className={styles.flightDuration}>
                                      {flight.duration}
                                    </span>
                                    <div className={styles.flightArrowLine}>
                                      <MdFlight className={styles.flightPlaneIcon} />
                                    </div>
                                  </div>
                                  <div
                                    className={`${styles.flightStation} ${styles.flightStationRight}`}
                                  >
                                    <h4 className={styles.flightCode}>
                                      {flight?.departure_to}
                                    </h4>
                                    <p className={styles.flightAirport}>Arrival</p>
                                    <p className={styles.flightTime}>
                                      {moment
                                        .utc(flight.datetime_to)
                                        .format('DD MMM YYYY, LT')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )),
                        )}
                      </div>
                    </section>
                  )}

                {/* 06 Transfer + excursions */}
                {voucherDetail?.transfers?.length > 0 && (
                  <section className={styles.section}>
                    <div className={styles.sectionTitleRow}>
                      <span className={styles.sectionNum}>06</span>
                      <span className={styles.sectionIcon}><FaBus size={12} /></span>
                      <h3 className={styles.sectionTitle}>Transfer Details</h3>
                    </div>
                    <div className={styles.segmentsWrapper}>
                      {voucherDetail.transfers.map((item, index) => (
                        <div key={index} className={styles.flightSegmentCard}>
                          <div className={styles.airlineRow}>
                            <FaBus size={22} color="#1B3B6F" />
                            <div>
                              <p className={styles.airlineNameText}>
                                {capitalize(item?.vehicle)}
                              </p>
                              <p className={styles.flightNumberText}>
                                {capitalize(item?.trip_type)}
                              </p>
                            </div>
                          </div>
                          {item.locations.map((loc, idx) => (
                            <div key={idx} className={styles.flightRouteGrid}>
                              <div className={styles.flightStation}>
                                <h4 className={styles.flightCode}>PICKUP</h4>
                                <p className={styles.flightAirport}>
                                  {loc.pickup_address}
                                </p>
                                <p className={styles.flightTime}>
                                  {moment(loc.outbound).format('DD MMM YYYY, HH:mm')}
                                </p>
                              </div>
                              <div className={styles.flightArrow}>
                                <span className={styles.flightDuration}>
                                  {capitalize(item?.trip_type)}
                                </span>
                                <div className={styles.flightArrowLine}>
                                  <FaBus className={styles.flightPlaneIcon} />
                                </div>
                              </div>
                              <div
                                className={`${styles.flightStation} ${styles.flightStationRight}`}
                              >
                                <h4 className={styles.flightCode}>DROPOFF</h4>
                                <p className={styles.flightAirport}>
                                  {loc.dropoff_address}
                                </p>
                              </div>
                            </div>
                          ))}
                          {(() => {
                            const excursions = getTransferExcursions(item)
                            const byCity = groupExcursionsByCity(excursions)
                            const cities = Object.keys(byCity)
                            if (!cities.length) return null
                            return (
                              <div className={styles.excursionsSection}>
                                <div className={styles.excursionsHeader}>
                                  <FaMapMarkerAlt size={14} />
                                  <span>Included Ziyarat &amp; Excursions</span>
                                </div>
                                <div className={styles.excursionsCityGrid}>
                                  {cities.map((city) => (
                                    <div
                                      key={city}
                                      className={styles.excursionCityGroup}
                                    >
                                      <div className={styles.excursionCityHeader}>
                                        {city}
                                      </div>
                                      <ul className={styles.excursionList}>
                                        {byCity[city].map((exc, i) => (
                                          <li
                                            key={exc.id ?? `${city}-${i}`}
                                            className={styles.excursionItem}
                                          >
                                            <span className={styles.excursionIndex}>
                                              {i + 1}
                                            </span>
                                            <span>{exc.name}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 07 Visa */}
                {voucherDetail?.visas?.length > 0 && (
                  <section className={styles.section}>
                    <div className={styles.sectionTitleRow}>
                      <span className={styles.sectionNum}>07</span>
                      <span className={styles.sectionIcon}><FaPassport size={12} /></span>
                      <h3 className={styles.sectionTitle}>Visa Details</h3>
                    </div>
                    <div className={styles.tableWrap}>
                      <table className={`${styles.dataTable} ${styles.navyTableHead}`}>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Visa Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {voucherDetail.visas.map((item, index) => (
                            <tr key={index}>
                              <td className={styles.srCell}>{index + 1}</td>
                              <td style={{ fontWeight: 700 }}>
                                {item?.visa_type || '—'}
                                {item?.visa_description && (
                                  <>
                                    <br />
                                    <span style={{ fontWeight: 500, color: '#6B7280' }}>
                                      {item.visa_description}
                                    </span>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* Additional services */}
                {voucherDetail?.additional_services?.length > 0 && (
                  <section className={styles.section}>
                    <div className={styles.sectionTitleRow}>
                      <span className={styles.sectionIcon}>
                        <FaConciergeBell size={12} />
                      </span>
                      <h3 className={styles.sectionTitle}>Additional Services</h3>
                    </div>
                    <div className={styles.tableWrap}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Service Name</th>
                            <th>Quantity / Pax</th>
                          </tr>
                        </thead>
                        <tbody>
                          {voucherDetail.additional_services.map((item, index) => (
                            <tr key={index}>
                              <td className={styles.srCell}>{index + 1}</td>
                              <td style={{ fontWeight: 700 }}>{item.name}</td>
                              <td>{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* Special Request & Important Info */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>08</span>
                    <span className={styles.sectionIcon}><FaCheckCircle size={11} /></span>
                    <h3 className={styles.sectionTitle}>
                      Special Request &amp; Important Info
                    </h3>
                  </div>
                  <div className={styles.splitGrid}>
                    <div className={styles.specialBox}>
                      <span className={styles.specialBoxTitle}>Special Request</span>
                      <p className={styles.specialBoxText}>
                        {voucherDetail?.special_request || 'No special requests noted.'}
                      </p>
                    </div>
                    <div className={styles.specialBox}>
                      <span className={styles.specialBoxTitle}>Important Information</span>
                      <ul className={styles.infoList}>
                        <li>
                          <span className={styles.infoCheck}>
                            <FaCheckCircle size={10} />
                          </span>
                          Please present this voucher at check-in for all included services.
                        </li>
                        <li>
                          <span className={styles.infoCheck}>
                            <FaCheckCircle size={10} />
                          </span>
                          All passengers must carry valid photo identification at all times.
                        </li>
                        <li>
                          <span className={styles.infoCheck}>
                            <FaCheckCircle size={10} />
                          </span>
                          Check-in times and service schedules are subject to operator confirmation.
                        </li>
                        <li>
                          <span className={styles.infoCheck}>
                            <FaCheckCircle size={10} />
                          </span>
                          This package voucher covers only the services listed above.
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <p className={styles.noteText}>
                  This is a computer-generated voucher and does not require a physical signature.
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
          </>
        )}
      </div>
    </div>
  )
}
