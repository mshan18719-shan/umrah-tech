'use client'
import styles from './invoice.module.css'
import moment from 'moment'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import HotelInvoiceLoader from '@/components/Loader/HotelInvoiceLoader'
import {
  FaBus, FaFileInvoice, FaHotel, FaUser, FaUserFriends, FaHome, FaStar,
  FaPassport, FaCheckCircle, FaPhone, FaEnvelope, FaPrint, FaDownload,
  FaReceipt, FaInfoCircle, FaMapMarkerAlt,
} from 'react-icons/fa'
import { MdFlight } from 'react-icons/md'
import Link from 'next/link'
import { IoWarningOutline } from 'react-icons/io5'

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
      const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages/booking/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      const res = await responses.json()
      setIsLoading(false)
      if (res.Success) {
        const uniqueRooms = [
          ...new Map(res?.Content?.booking.room_selections_original.map(room => [room.type, room])).values()
        ]
        res.Content.booking.room_selections_original = uniqueRooms
        setVoucherDetail(res?.Content?.booking)
      } else {
        setErrorMessage(res?.Title)
      }
    } catch (err) {
      setIsLoading(false)
      console.error('Error fetching package details:', err)
    }
  }

  function formatLabel(count, singular, plural) {
    return `${count} ${count === 1 ? singular : plural}`
  }

  function capitalize(text) {
    if (!text) return ''
    return String(text).charAt(0).toUpperCase() + String(text).slice(1)
  }

  function convertToCustomerCurrency(price) {
    if (!price || !voucherDetail.customer_exchange_rate) return Number(price || 0).toFixed(2)
    if (voucherDetail.currency_code === voucherDetail.customer_currency) {
      return Number(price).toFixed(2)
    }
    const convertedPrice = Number(price) * Number(voucherDetail.customer_exchange_rate)
    return convertedPrice.toFixed(2)
  }

  function CalCulateRoomPrice(room) {
    let price = 0
    price += Number(room.adultsInRoom >= 0 ? room.adultsInRoom : room.adults) * Number(room?.sale_per_person ? room.sale_per_person : room.adultPrice)
    price += Number(room.childrenInRoom >= 0 ? room.childrenInRoom : room.children) * Number(room?.child_sale_per_person ? room.child_sale_per_person : room.childPrice)
    price += Number(room.infantsInRoom >= 0 ? room.infantsInRoom : room.infants) * Number(room?.infant_sale_per_person ? room.infant_sale_per_person : room.infantPrice)
    if (room.adults_without_bed) {
      price += Number(room.adults_without_bed || 0) * Number(room?.adult_without_bed_price)
    }
    if (room.children_without_bed) {
      price += Number(room.children_without_bed || 0) * Number(room?.child_without_bed_price)
    }
    if (room.infants_without_bed) {
      price += Number(room.infants_without_bed || 0) * Number(room?.infant_without_bed_price)
    }
    return convertToCustomerCurrency(price)
  }

  function capitalizeString(str) {
    if (!str) return ''
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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

  const CalculateWithoutBeds = (type) => {
    const RoomList = voucherDetail?.room_selections_original?.filter(room => room.type === type) || []
    const adults = RoomList.reduce((sum, room) => sum + (room.adults_without_bed || 0), 0)
    const children = RoomList.reduce((sum, room) => sum + (room.children_without_bed || 0), 0)
    const infants = RoomList.reduce((sum, room) => sum + (room.infants_without_bed || 0), 0)
    if (adults === 0 && children === 0 && infants === 0) return 0;
    return `${adults} Adult${adults !== 1 ? 's' : ''}, ${children} Child${children !== 1 ? 'ren' : ''}, ${infants} Infant${infants !== 1 ? 's' : ''}`
  }

  const handlePrint = () => window.print()

  const currency = voucherDetail?.customer_currency || voucherDetail?.currency_code || ''
  const grandTotal = Number(
    voucherDetail?.customer_total_after_discount ||
    voucherDetail?.grand_total_after_discount ||
    0
  )
  const paymentStatus = (voucherDetail?.payment_status || '').toLowerCase()
  const amountPaid = paymentStatus === 'paid' || paymentStatus === 'completed' ? grandTotal : 0
  const remaining = Math.max(grandTotal - amountPaid, 0)
  const bookingStatus = (voucherDetail?.booking_status || '').toLowerCase()
  const statusClass =
    bookingStatus === 'confirmed' ? styles.statusPillConfirmed
      : bookingStatus === 'cancelled' ? styles.statusPillCancelled
        : styles.statusPillPending
  const refNo = voucherDetail?.booking_reference || id;
  const invoiceNo = voucherDetail?.invoice_number;
  const nights = voucherDetail?.packageDetails?.start_date && voucherDetail?.packageDetails?.end_date
    ? moment(voucherDetail.packageDetails.end_date).diff(moment(voucherDetail.packageDetails.start_date), 'days')
    : 0
  const docLabel = voucherDetail?.packageDetails?.category?.name
    || voucherDetail?.packageDetails?.category?.slug
    || 'Umrah Voucher'

  const stayChips = (() => {
    const selections = voucherDetail?.room_selections || []
    const chips = []
    selections.forEach((item) => {
      const city = item?.hotel?.city
      const n = item?.hotel?.booked_from && item?.hotel?.booked_to
        ? moment(item.hotel.booked_to).diff(moment(item.hotel.booked_from), 'days')
        : null
      if (city && n != null) chips.push({ city, nights: n })
    })
    return chips
  })()

  if (isLoading) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.shell}>
          <div className={styles.sheet}><HotelInvoiceLoader /></div>
        </div>
      </div>
    )
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
    )
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.shell}>
        <div className={styles.previewBar}>
          <span className={styles.previewLabel}>Invoice preview — {refNo}</span>
          <div className={styles.previewActions}>
            <Link
              href={`/${voucherDetail?.packageDetails?.category?.slug}/voucher/${voucherDetail?.booking_reference}`}
              className={styles.linkChip}
            >
              <FaFileInvoice size={12} /> Voucher
            </Link>
            <Link href="/" className={styles.linkChip}><FaHome size={12} /> Home</Link>
            <button type="button" className={styles.btnPrint} onClick={handlePrint}><FaPrint size={13} /> Print</button>
            {/* <button type="button" className={styles.btnPdf} onClick={handlePrint}><FaDownload size={13} /> Download PDF</button> */}
          </div>
        </div>

        <div ref={ref} id="invoice" className={styles.sheet}>
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
                {/* <div className={styles.statusRow}>
                  <span className={`${styles.statusPill} ${statusClass}`}>
                    <FaCheckCircle size={11} />
                    {bookingStatus ? bookingStatus.toUpperCase() : 'PENDING'}
                  </span>
                  <span className={styles.invoiceId}>{refNo}</span>
                </div> */}
              </div>
              <div className={styles.metaCols}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Date of Issue</span>
                  <span className={styles.metaValue}>
                    {voucherDetail?.created_at
                      ? moment(voucherDetail.created_at, 'DD-MM-YYYY HH:mm:ss').format('MMMM DD, YYYY')
                      : '—'}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Reference No</span>
                  <span className={styles.metaValue}>{refNo}</span>
                </div>
                {invoiceNo && <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Invoice No</span>
                  <span className={styles.metaValue}>{invoiceNo}</span>
                </div>}
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Payment Status</span>
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
                      {voucherDetail?.lead_title} {voucherDetail?.lead_first_name} {voucherDetail?.lead_last_name}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Email</span>
                    <div className={styles.fieldValue}>{voucherDetail?.lead_email || '—'}</div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Phone</span>
                    <div className={styles.fieldValue}>
                      {voucherDetail?.lead_phone_code}{voucherDetail?.lead_phone || '—'}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Booking Status</span>
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
                {/* <span className={styles.sectionRight}>{nights} Nights</span> */}
              </div>
              <div className={styles.card}>
                <div className={styles.activityTitle}>{voucherDetail?.packageDetails?.title}</div>
                {voucherDetail?.packageDetails?.star_rating && (
                  <div className={styles.starsRow}>
                    {Array(Math.floor(Number(voucherDetail?.packageDetails?.star_rating || 0))).fill(0).map((_, i) => (
                      <FaStar key={i} size={13} />
                    ))}
                    <span className={styles.starsScore}>
                      {voucherDetail?.packageDetails?.star_rating} Star Package
                    </span>
                  </div>
                )}
                <div className={`${styles.fieldGrid} ${styles.fieldGrid3}`}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Duration</span>
                    <div className={styles.fieldValue}>{nights} Nights</div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Departure Date</span>
                    <div className={styles.fieldValue}>
                      {voucherDetail?.packageDetails?.start_date
                        ? moment(voucherDetail.packageDetails.start_date).format('MMMM DD, YYYY')
                        : '—'}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>End Date</span>
                    <div className={styles.fieldValue}>
                      {voucherDetail?.packageDetails?.end_date
                        ? moment(voucherDetail.packageDetails.end_date).format('MMMM DD, YYYY')
                        : '—'}
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
                <table className={styles.priceTable}>
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
                        <strong>
                          {voucherDetail?.lead_title} {voucherDetail?.lead_first_name} {voucherDetail?.lead_last_name}
                        </strong>
                      </td>
                      <td><span className={styles.typeBadge}>Lead / Adult</span></td>
                      <td>{capitalize(voucherDetail?.lead_gender) || '—'}</td>
                      <td>
                        {voucherDetail?.lead_email && <div>{voucherDetail.lead_email}</div>}
                        {(voucherDetail?.lead_phone) && (
                          <div>{voucherDetail?.lead_phone_code}{voucherDetail.lead_phone}</div>
                        )}
                      </td>
                    </tr>
                    {voucherDetail?.other_passengers?.additional_adults?.map((adult, i) => (
                      <tr key={`adult-${i}`}>
                        <td>{i + 2}</td>
                        <td><strong>{adult.first_name} {adult.last_name}</strong></td>
                        <td><span className={styles.typeBadge}>Adult</span></td>
                        <td>{capitalize(adult.gender)}</td>
                        <td>—</td>
                      </tr>
                    ))}
                    {voucherDetail?.other_passengers?.children_details?.map((child, i) => {
                      const offset = 1 + (voucherDetail?.other_passengers?.additional_adults?.length || 0)
                      return (
                        <tr key={`child-${i}`}>
                          <td>{offset + i + 1}</td>
                          <td><strong>{child.first_name} {child.last_name}</strong></td>
                          <td><span className={`${styles.typeBadge} ${styles.typeBadgeChild}`}>Child</span></td>
                          <td>{capitalize(child.gender)}</td>
                          <td>—</td>
                        </tr>
                      )
                    })}
                    {voucherDetail?.other_passengers?.infants_details?.map((infant, i) => {
                      const offset = 1
                        + (voucherDetail?.other_passengers?.additional_adults?.length || 0)
                        + (voucherDetail?.other_passengers?.children_details?.length || 0)
                      return (
                        <tr key={`infant-${i}`}>
                          <td>{offset + i + 1}</td>
                          <td><strong>{infant.first_name} {infant.last_name}</strong></td>
                          <td><span className={`${styles.typeBadge} ${styles.typeBadgeInfant}`}>Infant</span></td>
                          <td>{capitalize(infant.gender)}</td>
                          <td>—</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {voucherDetail?.lead_address && (
                <div className={styles.addressRow}>
                  <span className={styles.addressLabel}>Address:</span>
                  <span className={styles.addressValue}>{voucherDetail.lead_address}</span>
                </div>
              )}
            </section>

            {/* Accommodation */}
            {voucherDetail?.room_selections?.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionHeadLeft}>
                    <span className={styles.sectionIcon}><FaHotel size={11} /></span>
                    <h3 className={styles.sectionTitle}>Accommodation</h3>
                  </div>
                  <span className={styles.sectionRight}>{nights} Nights</span>
                </div>
                <div className={styles.segmentsWrapper}>
                  {voucherDetail.room_selections.map((item, index) => (
                    <div key={index} className={styles.flightSegmentCard}>
                      <div className={styles.airlineRow}>
                        <FaHotel size={22} color="#1B3B6F" />
                        <div>
                          <p className={styles.airlineNameText}>
                            {capitalizeString(item?.hotel?.name)}
                            {item?.hotel?.city && <span className={styles.cityChip}>{item.hotel.city}</span>}
                          </p>
                          <p className={styles.flightNumberText}>{item?.hotel?.address}</p>
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
                            {moment(item?.hotel?.booked_to).diff(moment(item?.hotel?.booked_from), 'days')} Nights
                          </span>
                          <div className={styles.flightArrowLine}>
                            <FaHotel className={styles.flightPlaneIcon} />
                          </div>
                        </div>
                        <div className={`${styles.flightStation} ${styles.flightStationRight}`}>
                          <h4 className={styles.flightCode}>CHECK-OUT</h4>
                          <p className={styles.flightTime}>
                            {moment(item?.hotel?.booked_to).format('DD MMM YYYY')}
                          </p>
                        </div>
                      </div>
                      <div className={styles.innerTableWrap}>
                        <div className={styles.priceTableWrap}>
                          <table className={styles.priceTable}>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Room Type</th>
                                <th>Meal / View</th>
                                <th>Adults</th>
                                <th>Children</th>
                                <th>Infants</th>
                                <th>Without Beds</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.rooms.map((room, rindex) => (
                                <tr key={rindex}>
                                  <td>{rindex + 1}</td>
                                  <td style={{ fontWeight: 600 }}>
                                    {room.selection.label === 'without_beds'
                                      ? 'Without Beds'
                                      : `${room.selection.label} × ${room.selection.rooms}`}
                                  </td>
                                  <td>
                                    {[room?.rooms?.items?.data?.meal, room?.rooms?.items?.data?.view].filter(Boolean).join(' + ') || '—'}
                                  </td>
                                  <td>{room.selection.adults}</td>
                                  <td>{room.selection.children}</td>
                                  <td>{room.selection.infants}</td>
                                  <td>{CalculateWithoutBeds(room.selection.type)}</td>
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

            {/* Outbound flights */}
            {voucherDetail?.flights?.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionHeadLeft}>
                    <span className={styles.sectionIcon}><MdFlight size={14} /></span>
                    <h3 className={styles.sectionTitle}>Flight Details</h3>
                  </div>
                  <span className={styles.sectionRight}>Outbound</span>
                </div>
                <div className={styles.segmentsWrapper}>
                  {voucherDetail.flights.map((item, index) =>
                    item.stops?.filter(s => s.is_return === false).map((flight, fIndex) => (
                      <div key={`dep-${index}-${fIndex}`} className={styles.flightSegmentCard}>
                        <div className={styles.airlineRow}>
                          <MdFlight size={26} color="#1B3B6F" />
                          <div>
                            <p className={styles.airlineNameText}>{flight.airline_name}</p>
                            <p className={styles.flightNumberText}>
                              {flight.flight_number}&nbsp;·&nbsp;{capitalize(flight.type)}
                            </p>
                          </div>
                          <span className={styles.flightLegLabel}>Outbound</span>
                        </div>
                        <div className={styles.flightRouteGrid}>
                          <div className={styles.flightStation}>
                            <h4 className={styles.flightCode}>{flight?.departure_from}</h4>
                            <p className={styles.flightAirport}>Departure</p>
                            <p className={styles.flightTime}>{moment.utc(flight.datetime_from).format('DD MMM YYYY, LT')}</p>
                          </div>
                          <div className={styles.flightArrow}>
                            <span className={styles.flightDuration}>{flight.duration}</span>
                            <div className={styles.flightArrowLine}>
                              <MdFlight className={styles.flightPlaneIcon} />
                            </div>
                          </div>
                          <div className={`${styles.flightStation} ${styles.flightStationRight}`}>
                            <h4 className={styles.flightCode}>{flight?.departure_to}</h4>
                            <p className={styles.flightAirport}>Arrival</p>
                            <p className={styles.flightTime}>{moment.utc(flight.datetime_to).format('DD MMM YYYY, LT')}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Return flights */}
            {voucherDetail?.flights?.some(f => f.stops?.some(s => s.is_return === true)) && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionHeadLeft}>
                    <span className={styles.sectionIcon}><MdFlight size={14} /></span>
                    <h3 className={styles.sectionTitle}>Return Flight Details</h3>
                  </div>
                  <span className={styles.sectionRight}>Return</span>
                </div>
                <div className={styles.segmentsWrapper}>
                  {voucherDetail.flights.map((item, index) =>
                    item.stops?.filter(s => s.is_return === true).map((flight, fIndex) => (
                      <div key={`ret-${index}-${fIndex}`} className={styles.flightSegmentCard}>
                        <div className={styles.airlineRow}>
                          <MdFlight size={26} color="#1B3B6F" />
                          <div>
                            <p className={styles.airlineNameText}>{flight.airline_name}</p>
                            <p className={styles.flightNumberText}>
                              {flight.flight_number}&nbsp;·&nbsp;{capitalize(flight.type)}
                            </p>
                          </div>
                          <span className={styles.flightLegLabel}>Return</span>
                        </div>
                        <div className={styles.flightRouteGrid}>
                          <div className={styles.flightStation}>
                            <h4 className={styles.flightCode}>{flight?.departure_from}</h4>
                            <p className={styles.flightAirport}>Departure</p>
                            <p className={styles.flightTime}>{moment.utc(flight.datetime_from).format('DD MMM YYYY, LT')}</p>
                          </div>
                          <div className={styles.flightArrow}>
                            <span className={styles.flightDuration}>{flight.duration}</span>
                            <div className={styles.flightArrowLine}>
                              <MdFlight className={styles.flightPlaneIcon} />
                            </div>
                          </div>
                          <div className={`${styles.flightStation} ${styles.flightStationRight}`}>
                            <h4 className={styles.flightCode}>{flight?.departure_to}</h4>
                            <p className={styles.flightAirport}>Arrival</p>
                            <p className={styles.flightTime}>{moment.utc(flight.datetime_to).format('DD MMM YYYY, LT')}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* Transfers + excursions */}
            {voucherDetail?.transfers?.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionHeadLeft}>
                    <span className={styles.sectionIcon}><FaBus size={11} /></span>
                    <h3 className={styles.sectionTitle}>Transfer Details</h3>
                  </div>
                </div>
                <div className={styles.segmentsWrapper}>
                  {voucherDetail.transfers.map((item, index) => (
                    <div key={index} className={styles.flightSegmentCard}>
                      <div className={styles.airlineRow}>
                        <FaBus size={22} color="#1B3B6F" />
                        <div>
                          <p className={styles.airlineNameText}>{capitalize(item?.vehicle)}</p>
                          <p className={styles.flightNumberText}>{capitalize(item?.trip_type)}</p>
                        </div>
                      </div>
                      {item.locations.map((loc, idx) => (
                        <div key={idx} className={styles.flightRouteGrid}>
                          <div className={styles.flightStation}>
                            <h4 className={styles.flightCode}>PICKUP</h4>
                            <p className={styles.flightAirport}>{loc.pickup_address}</p>
                            <p className={styles.flightTime}>{moment(loc.outbound).format('DD MMM YYYY, HH:mm')}</p>
                          </div>
                          <div className={styles.flightArrow}>
                            <span className={styles.flightDuration}>{capitalize(item?.trip_type)}</span>
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
                                <div key={city} className={styles.excursionCityGroup}>
                                  <div className={styles.excursionCityHeader}>{city}</div>
                                  <ul className={styles.excursionList}>
                                    {byCity[city].map((exc, i) => (
                                      <li key={exc.id ?? `${city}-${i}`} className={styles.excursionItem}>
                                        <span className={styles.excursionIndex}>{i + 1}</span>
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

            {/* Visa */}
            {voucherDetail?.visas?.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionHeadLeft}>
                    <span className={styles.sectionIcon}><FaPassport size={11} /></span>
                    <h3 className={styles.sectionTitle}>Visa Details</h3>
                  </div>
                </div>
                <div className={styles.priceTableWrap}>
                  <table className={styles.priceTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Visa Type</th>
                        <th>Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voucherDetail.visas.map((item, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td style={{ fontWeight: 600 }}>{item?.visa_type || '—'}</td>
                          <td>{item?.visa_country?.name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {voucherDetail?.special_request && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionHeadLeft}>
                    <span className={styles.sectionIcon}><IoWarningOutline size={13} /></span>
                    <h3 className={styles.sectionTitle}>Special Request</h3>
                  </div>
                </div>
                <div className={styles.card}>
                  <p style={{ margin: 0, color: '#4A5568' }}>{voucherDetail.special_request}</p>
                </div>
              </section>
            )}

            {/* Price Breakdown */}
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionHeadLeft}>
                  <span className={styles.sectionIcon}><FaReceipt size={11} /></span>
                  <h3 className={styles.sectionTitle}>Price Breakdown</h3>
                </div>
              </div>

              {voucherDetail?.room_selections_original?.length > 0 && (
                <div className={styles.priceTableWrap} style={{ marginBottom: 12 }}>
                  <table className={styles.priceTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Room Type</th>
                        <th>Pax</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voucherDetail.room_selections_original.map((room, rindex) => (
                        <tr key={rindex}>
                          <td>{rindex + 1}</td>
                          <td style={{ fontWeight: 600 }}>
                            {room.type === 'without_beds' ? 'Without Beds' : `${room.type}`}
                          </td>
                          <td>
                            {formatLabel(room.adultsInRoom >= 0 ? room.adultsInRoom + (room?.adults_without_bed || 0) : room.adults + (room?.adults_without_bed || 0), 'Adult', 'Adults')}
                            {' – '}
                            {formatLabel(room.childrenInRoom >= 0 ? room.childrenInRoom + (room?.children_without_bed || 0) : room.children + (room?.children_without_bed || 0), 'Child', 'Children')}
                            {' – '}
                            {formatLabel(room.infantsInRoom >= 0 ? room.infantsInRoom + (room?.infants_without_bed || 0) : room.infants + (room?.infants_without_bed || 0), 'Infant', 'Infants')}
                          </td>
                          <td>{currency} {CalCulateRoomPrice(room)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {voucherDetail?.additional_services?.length > 0 && (
                <div className={styles.priceTableWrap} style={{ marginBottom: 12 }}>
                  <table className={styles.priceTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Additional Service</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voucherDetail.additional_services.map((item, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{currency} {convertToCustomerCurrency(item.price_per_person)}</td>
                          <td>{currency} {convertToCustomerCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className={styles.totals}>
                {voucherDetail?.total_discount > 0 && (
                  <div className={styles.totalsRow}>
                    <span>Discount</span>
                    <strong>{currency} {voucherDetail.total_discount}</strong>
                  </div>
                )}
                <div className={styles.grandTotal}>
                  <span>GRAND TOTAL</span>
                  <strong>
                    {currency}{' '}
                    {voucherDetail?.customer_total_after_discount
                      ? voucherDetail.customer_total_after_discount
                      : voucherDetail?.grand_total_after_discount}
                  </strong>
                </div>
                <p className={styles.taxNote}>VAT and Taxes included</p>
              </div>
            </section>

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
                  The invoice displays the complete pricing details of your package booking, inclusive of all applicable taxes.
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
  )
}
