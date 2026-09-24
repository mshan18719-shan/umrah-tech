'use client'
import React, { useRef, useEffect, useState } from 'react'
import styles from '../../../hotels/voucher/[id]/Voucher.module.css'
import moment from 'moment'
import { FaUser, FaFileInvoice, FaHome, FaPhone, FaEnvelope, FaPrint, FaDownload, FaCheckCircle, FaCalendarAlt, FaUsers, FaHashtag } from 'react-icons/fa'
import { MdFlight, MdLuggage } from 'react-icons/md'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import FlightBookingDetailLoader from '@/components/Loader/FlightBookinfDetailLoader'
import Image from 'next/image'
import { IoWarningOutline } from 'react-icons/io5'
import { groupSegments } from '@/components/Flights/Checkout/flightHelpers'

export default function FlightVoucher() {
  const voucherRef = useRef()
  const { id } = useParams()
  const [voucherDetail, setVoucherDetail] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchDetails()
  }, [id])

  const fetchDetails = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/booking/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_reference: id }),
      })
      const res = await responses.json()
      if (res.success && res?.data) {
        setVoucherDetail(res.data)
      } else {
        setVoucherDetail(null)
        setErrorMessage(res?.message || 'Failed to load voucher details')
      }
    } catch (err) {
      console.error('Error fetching flight details:', err)
      setVoucherDetail(null)
      setErrorMessage('Failed to load voucher details')
    } finally {
      setIsLoading(false)
    }
  }

  const capitalize = (text) => {
    if (!text || typeof text === 'object') return ''
    const s = String(text)
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  const getAirlineName = (airline) => {
    if (!airline) return ''
    if (typeof airline === 'string') return airline
    return airline.name || airline.iata_code || airline.code || ''
  }
  const getAirlineCode = (airline) => {
    if (!airline || typeof airline === 'string') return airline || ''
    return airline.iata_code || airline.code || ''
  }
  const getCabinClassLabel = (cabin) => {
    if (!cabin) return 'Economy'
    if (typeof cabin === 'string') return capitalize(cabin) || 'Economy'
    return capitalize(cabin.name || cabin.label || cabin.class || '') || 'Economy'
  }
  const getSegmentDeparture = (segment) =>
    segment?.departure || segment?.origin || segment?.from || null
  const getSegmentArrival = (segment) =>
    segment?.arrival || segment?.destination || segment?.to || null
  const getAirportCode = (endpoint) =>
    endpoint?.airport_code || endpoint?.iata_code || endpoint?.code || ''
  const getAirportName = (endpoint) =>
    endpoint?.airport_name || endpoint?.name || endpoint?.city_name || endpoint?.city || getAirportCode(endpoint) || ''
  const getCityName = (endpoint) =>
    endpoint?.city || endpoint?.city_name || getAirportCode(endpoint) || ''
  const getDepartAt = (segment) =>
    segment?.departure?.datetime ||
    segment?.departing_at ||
    segment?.departure_at ||
    segment?.departure_time ||
    ''
  const getArriveAt = (segment) =>
    segment?.arrival?.datetime ||
    segment?.arriving_at ||
    segment?.arrival_at ||
    segment?.arrival_time ||
    ''

  const formatPassengerType = (type) => {
    if (!type) return '—'
    const raw = String(type).replace(/_/g, ' ').trim()
    if (/^infant/i.test(raw)) return 'Infant'
    if (/^child/i.test(raw)) return 'Child'
    if (/^adult/i.test(raw)) return 'Adult'
    return raw.replace(/\b\w/g, (c) => c.toUpperCase())
  }
  const formatGender = (gender) => {
    const g = String(gender || '').toLowerCase()
    if (g === 'm' || g === 'male') return 'Male'
    if (g === 'f' || g === 'female') return 'Female'
    return gender ? capitalize(gender) : '—'
  }
  const formatDateValue = (value) => {
    if (!value) return '—'
    const m = moment(value)
    return m.isValid() ? m.format('DD-MM-YYYY') : '—'
  }
  const getPassengerTicketNo = (p) =>
    p?.ticketNum || p?.ticket_num || p?.ticket_number || p?.ticketNumber ||
    p?.ticket_no || p?.ticketNo || p?.e_ticket || p?.eTicket || p?.eticket || p?.ticket || ''
  const getPassengerCardType = (p) =>
    p?.cardType || p?.card_type || p?.documentType || p?.document_type ||
    p?.identity_type || p?.id_type || ''
  const formatCardType = (type) => {
    if (!type) return '—'
    const t = String(type).trim().toLowerCase()
    if (t === 'p' || t === 'passport') return 'Passport'
    if (t === 'n' || t === 'national_id' || t === 'national id' || t === 'id' || t === 'id_card' || t === 'id card') return 'ID Card'
    if (t === 'o' || t === 'other') return 'Other'
    return capitalize(type)
  }
  const getPassengerCardNum = (p) =>
    p?.cardNum || p?.card_num || p?.cardNumber || p?.card_number ||
    p?.documentNumber || p?.document_number || p?.passport_number || p?.passportNumber || ''
  const getPassengerCardExpiry = (p) =>
    p?.cardExpiredDate || p?.card_expired_date || p?.cardExpiry || p?.card_expiry ||
    p?.documentExpiry || p?.document_expiry || p?.passport_expiry || p?.passportExpiry || ''
  const formatPenaltyLabel = (penalty, fallbackCurrency = '') => {
    if (!penalty) return '—'
    const allowed =
      penalty.allowed === true ||
      penalty.allowed === 'true' ||
      penalty.allowed === 1 ||
      penalty.allowed === '1'
    if (!allowed) return 'Non-refundable'
    const amount = Number(penalty.penalty_amount)
    if (penalty.penalty_amount != null && !Number.isNaN(amount) && amount > 0) {
      const cur = penalty.penalty_currency || fallbackCurrency || ''
      return `${cur} ${amount.toFixed(2)}`.trim()
    }
    return 'Free'
  }
  const getPenaltyEntry = (raw) => {
    if (!raw) return null
    if (Array.isArray(raw)) return raw.find(Boolean) || null
    if (typeof raw === 'object') return raw
    return null
  }
  const getCancellationPolicyRows = (detail) => {
    const penalties = detail?.penalties || detail?.flight_details?.penalties
    if (!penalties || typeof penalties !== 'object') return []

    const counts = detail?.passenger_counts || {}
    const types = [
      { key: 'adult', label: 'Adult', count: Number(counts.adults ?? counts.adult ?? 0) },
      { key: 'child', label: 'Child', count: Number(counts.children ?? counts.child ?? 0) },
      { key: 'infant', label: 'Infant', count: Number(counts.infants ?? counts.infant ?? 0) },
    ]

    const hasTyped = types.some(({ key }) => {
      const value = penalties[key]
      return Array.isArray(value) ? value.length > 0 : !!(value && typeof value === 'object')
    })

    if (hasTyped) {
      return types
        .map(({ key, label, count }) => {
          const entry = getPenaltyEntry(penalties[key])
          if (!entry && count <= 0) return null
          if (!entry) return null
          const changeBefore = entry.change_before_departure
          const changeAfter = entry.change_after_departure
          const refundBefore = entry.refund_before_departure
          const refundAfter = entry.refund_after_departure
          if (!changeBefore && !changeAfter && !refundBefore && !refundAfter) return null
          return { key, label, changeBefore, changeAfter, refundBefore, refundAfter }
        })
        .filter(Boolean)
    }

    const changeBefore = penalties.change_before_departure || null
    const changeAfter = penalties.change_after_departure || null
    const refundBefore = penalties.refund_before_departure || null
    const refundAfter = penalties.refund_after_departure || null
    if (!changeBefore && !changeAfter && !refundBefore && !refundAfter) return []

    const rows = types
      .filter(({ count }) => count > 0)
      .map(({ key, label }) => ({
        key,
        label,
        changeBefore,
        changeAfter,
        refundBefore,
        refundAfter,
      }))
    if (rows.length) return rows
    return [{ key: 'adult', label: 'Adult', changeBefore, changeAfter, refundBefore, refundAfter }]
  }
  const formatDuration = (segment) => {
    const mins = Number(segment?.duration)
    if (!Number.isFinite(mins) || mins < 0) return '—'
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const getTripTypeLabel = () => {
    const t = voucherDetail?.flight_details?.trip_type
    if (t === 'one_way') return 'One Way Flight'
    if (t === 'return') return 'Return Flight'
    if (t === 'multi_city') return 'Multi City Flight'
    return 'Flight Details'
  }

  const formatLegSectionLabel = (label) => {
    if (!label) return 'Flights'
    if (label === 'Departure') return 'Departure Flights'
    if (label === 'Return') return 'Return Flights'
    return label
  }

  const getSegmentGroups = () => {
    if (!voucherDetail?.segments?.length) return []
    return groupSegments({
      ...voucherDetail,
      trip_type: voucherDetail?.flight_details?.trip_type || voucherDetail?.trip_type,
      segments: voucherDetail.segments,
      search_criteria:
        voucherDetail?.search_criteria ||
        voucherDetail?.flight_details?.search_criteria ||
        {},
    }).filter((g) => g?.segments?.length)
  }

  const renderSegmentCard = (segment, segIndex) => {
    const departure = getSegmentDeparture(segment)
    const arrival = getSegmentArrival(segment)
    const departAt = getDepartAt(segment)
    const arriveAt = getArriveAt(segment)
    const depCode = getAirportCode(departure)
    const arrCode = getAirportCode(arrival)
    const airlineCode = getAirlineCode(segment.airline)
    const cabinLabel = getCabinClassLabel(
      segment.cabin_class || voucherDetail?.flight_details?.cabin_class
    )
    return (
      <div key={segIndex} className={styles.flightSegmentCard}>
        <div className={styles.airlineRow}>
          {segment.airline?.logo_url && (
            <img src={segment.airline.logo_url} alt={getAirlineName(segment.airline)} className={styles.airlineLogo} />
          )}
          <div>
            <p className={styles.airlineNameText}>{getAirlineName(segment.airline)}</p>
            <p className={styles.flightNumberText}>
              Flight: {airlineCode}{segment.flight_number ? ` ${segment.flight_number}` : ''} · {cabinLabel}
            </p>
          </div>
        </div>
        <div className={styles.flightRouteGrid}>
          <div className={styles.flightStation}>
            <h4 className={styles.flightCode}>{depCode || getCityName(departure) || '—'}</h4>
            <p className={styles.flightAirport}>{getAirportName(departure) || '—'}</p>
            {departure?.terminal ? (
              <p className={styles.flightAirport}>Terminal {departure.terminal}</p>
            ) : null}
            <p className={styles.flightTime}>
              {departAt && moment(departAt).isValid()
                ? moment(departAt).format('MMM DD, YYYY · HH:mm')
                : '—'}
            </p>
          </div>
          <div className={styles.flightArrow}>
            <span className={styles.flightDuration}>{formatDuration(segment)}</span>
            <div className={styles.flightArrowLine}>
              <MdFlight className={styles.flightPlaneIcon} />
            </div>
          </div>
          <div className={`${styles.flightStation} ${styles.flightStationRight}`}>
            <h4 className={styles.flightCode}>{arrCode || getCityName(arrival) || '—'}</h4>
            <p className={styles.flightAirport}>{getAirportName(arrival) || '—'}</p>
            {arrival?.terminal ? (
              <p className={styles.flightAirport}>Terminal {arrival.terminal}</p>
            ) : null}
            <p className={styles.flightTime}>
              {arriveAt && moment(arriveAt).isValid()
                ? moment(arriveAt).format('MMM DD, YYYY · HH:mm')
                : '—'}
            </p>
          </div>
        </div>
        {(segment?.baggage_info?.adult || segment?.baggage_info?.child || segment?.baggage_info?.infant) && (
          <div className={styles.baggageRow}>
            <span className={styles.baggageTitle}><MdLuggage size={14} /> Baggage:</span>
            {segment?.baggage_info?.adult && (
              <span className={styles.baggageChip}>Adult: {segment.baggage_info.adult.cabin} | {segment.baggage_info.adult.checked}</span>
            )}
            {segment?.baggage_info?.child && (
              <span className={styles.baggageChip}>Child: {segment.baggage_info.child.cabin} | {segment.baggage_info.child.checked}</span>
            )}
            {segment?.baggage_info?.infant && (
              <span className={styles.baggageChip}>Infant: {segment.baggage_info.infant.cabin} | {segment.baggage_info.infant.checked}</span>
            )}
          </div>
        )}
      </div>
    )
  }

  const getTotalPassengers = () => {
    if (!voucherDetail?.passenger_counts) return ''
    const { adults = 0, children = 0, infants = 0 } = voucherDetail.passenger_counts
    return [
      adults > 0 && `${adults} Adult${adults > 1 ? 's' : ''}`,
      children > 0 && `${children} Child${children > 1 ? 'ren' : ''}`,
      infants > 0 && `${infants} Infant${infants > 1 ? 's' : ''}`,
    ].filter(Boolean).join(', ')
  }

  const handlePrint = () => window.print()

  if (isLoading) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.shell}>
          <div className={styles.sheet}><FlightBookingDetailLoader /></div>
        </div>
      </div>
    )
  }

  if (errorMessage || !voucherDetail) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.shell}>
          <div className="alert alert-danger text-center p-5">
            <IoWarningOutline className="text-warning" size={80} />
            <h5 className="mt-3">{errorMessage || 'Failed to load voucher details'}</h5>
          </div>
        </div>
      </div>
    )
  }

  const guestCount =
    (voucherDetail?.passenger_counts?.adults || 0) +
    (voucherDetail?.passenger_counts?.children || 0) +
    (voucherDetail?.passenger_counts?.infants || 0)

  const bookingStatus = (voucherDetail?.booking_status || '').toLowerCase()
  const paymentStatus = (voucherDetail?.payment_status || '').toLowerCase()
  const lead = voucherDetail?.passenger_details?.[0]
  const firstSeg = voucherDetail?.segments?.[0]
  const lastSeg = voucherDetail?.segments?.[voucherDetail?.segments?.length - 1]
  const bookingRef = voucherDetail?.booking_reference || id
  const invoiceNo = voucherDetail?.invoice_number
  const cancellationRows = getCancellationPolicyRows(voucherDetail)
  const penaltyCurrency = voucherDetail?.pricing?.display_currency || ''

  return (
    <div className={styles.pageWrap}>
      <div className={styles.shell}>
          <>
            <div className={styles.previewBar}>
              <span className={styles.previewLabel}>Voucher preview — {bookingRef}</span>
              <div className={styles.previewActions}>
                <Link href={`/flights/invoice/${voucherDetail?.booking_reference}`} className={styles.linkChip}>
                  <FaFileInvoice size={12} /> Invoice
                </Link>
                <Link href="/" className={styles.linkChip}><FaHome size={12} /> Home</Link>
                <button type="button" className={styles.btnPrint} onClick={handlePrint}><FaPrint size={13} /> Print</button>
              </div>
            </div>

            <div ref={voucherRef} id="voucher" className={styles.sheet}>
              <div className={styles.watermark}>
                <Image src="/watermark.png" width={450} height={450} style={{ objectFit: 'contain', width: '100%', height: '100%' }} alt="Watermark" quality={100} />
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
                <div className={styles.summaryHero}>
                  <div className={styles.summaryLeft}>
                    <span className={styles.summaryBadge}>Booking Summary</span>
                    {invoiceNo && <span className={`${styles.invoBadge} mx-2`}> Invoice No: {invoiceNo}</span>}
                    <h2 className={styles.summaryTitle}>Flight Booking Voucher</h2>
                    <p className={styles.summaryDesc}>
                      Present this voucher at airline check-in. Arrive at the airport at least 3 hours before international flights.
                    </p>
                  </div>
                  <div className={styles.ticketCard}>
                    <div className={styles.ticketTop}>
                      <span className={styles.ticketLabel}><FaHashtag size={10} /> Booking Ref</span>
                      {/* <span className={`${styles.paidBadge} ${paymentStatus !== 'paid' && paymentStatus !== 'completed' ? styles.pendingPayBadge : ''}`}>
                        {paymentStatus === 'paid' || paymentStatus === 'completed' ? 'PAID' : (voucherDetail?.payment_status || 'PENDING').toUpperCase()}
                      </span> */}
                    </div>
                    <p className={styles.ticketRef}>{bookingRef}</p>
                    <div className={styles.ticketGrid}>
                      <div className={styles.ticketItem}>
                        <FaCalendarAlt size={12} className={styles.ticketItemIcon} />
                        <div>
                          <span className={styles.ticketItemLabel}>Booking Date</span>
                          <span className={styles.ticketItemValue}>
                            {voucherDetail?.created_at ? moment(voucherDetail.created_at).format('MMM DD, YYYY') : '—'}
                          </span>
                        </div>
                      </div>
                      <div className={styles.ticketItem}>
                        <FaCheckCircle size={12} className={styles.ticketItemIcon} />
                        <div>
                          <span className={styles.ticketItemLabel}>Booking Status</span>
                          <span className={`${styles.ticketItemValue} ${styles.statusOk}`}>
                            <FaCheckCircle size={10} />
                            {bookingStatus ? bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1) : '—'}
                          </span>
                        </div>
                      </div>
                      <div className={styles.ticketItem}>
                        <FaUsers size={12} className={styles.ticketItemIcon} />
                        <div>
                          <span className={styles.ticketItemLabel}>Passengers</span>
                          <span className={styles.ticketItemValue}>{guestCount || getTotalPassengers() || '—'}</span>
                        </div>
                      </div>
                      <div className={styles.ticketItem}>
                        <MdFlight size={14} className={styles.ticketItemIcon} />
                        <div>
                          <span className={styles.ticketItemLabel}>Payment Status</span>
                          <span className={`${styles.paidBadge} ${paymentStatus !== 'paid' && paymentStatus !== 'completed' ? styles.pendingPayBadge : ''}`}>
                            {paymentStatus === 'paid' || paymentStatus === 'completed' ? 'PAID' : (voucherDetail?.payment_status || 'PENDING').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* {firstSeg && (
                  <div className={styles.dateRibbon}>
                    <div className={styles.dateSide}>
                      <span className={styles.dateSideIcon}><FaCalendarAlt size={14} /></span>
                      <div>
                        <span className={styles.dateSideLabel}>Departure</span>
                        <span className={styles.dateSideValue}>
                          {moment(firstSeg.departing_at).format('MMM DD, YYYY')}
                        </span>
                      </div>
                    </div>
                    <div className={styles.dateCenter}>
                      <span className={styles.dateCenterBadge}>{getTripTypeLabel()}</span>
                      <span className={styles.dateCenterLine} />
                    </div>
                    <div className={styles.dateSide}>
                      <span className={styles.dateSideIcon}><FaCalendarAlt size={14} /></span>
                      <div>
                        <span className={styles.dateSideLabel}>Arrival</span>
                        <span className={styles.dateSideValue}>
                          {lastSeg ? moment(lastSeg.arriving_at).format('MMM DD, YYYY') : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* 01 Flights */}
                {voucherDetail?.segments?.length > 0 && (
                  <section className={styles.section}>
                    <div className={styles.sectionTitleRow}>
                      <span className={styles.sectionNum}>01</span>
                      <span className={styles.sectionIcon}><MdFlight size={14} /></span>
                      <h3 className={styles.sectionTitle}>{getTripTypeLabel()}</h3>
                    </div>
                    <div className={styles.segmentsWrapper}>
                      {(() => {
                        const segmentGroups = getSegmentGroups()
                        return segmentGroups.map((group, groupIndex) => (
                          <div key={`leg-${groupIndex}`}>
                            {segmentGroups.length > 1 ? (
                              <p className={styles.flightLegLabel} style={{ marginBottom: 10 }}>
                                {formatLegSectionLabel(group.label)}
                              </p>
                            ) : null}
                            {group.segments.map((segment, segIndex) =>
                              renderSegmentCard(segment, `${groupIndex}-${segIndex}`)
                            )}
                          </div>
                        ))
                      })()}
                    </div>
                  </section>
                )}

                {/* 02 Booking By / Passengers */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>02</span>
                    <span className={styles.sectionIcon}><FaUser size={11} /></span>
                    <h3 className={styles.sectionTitle}>Passenger Details</h3>
                  </div>
                  <div className={styles.bookingGrid} style={{ marginBottom: 14 }}>
                    <div>
                      <span className={styles.fieldLabel}>Lead Passenger</span>
                      <div className={styles.fieldValue}>
                        {lead?.title?.toUpperCase()} {lead?.firstName} {lead?.lastName}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Trip Type</span>
                      <div className={styles.fieldValue}>{getTripTypeLabel()}</div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Passengers</span>
                      <div className={styles.fieldValue}>{getTotalPassengers() || '—'}</div>
                    </div>
                  </div>
                  <div className={styles.tableWrap}>
                    <table className={`${styles.dataTable} ${styles.navyTableHead}`}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Full Name</th>
                          <th>Type</th>
                          <th>Gender</th>
                          <th>Date of Birth</th>
                          <th>Card Type</th>
                          <th>Card Number</th>
                          <th>Card Expiry</th>
                          <th>Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voucherDetail?.passenger_details?.map((passenger, index) => {
                          const ticketNo = getPassengerTicketNo(passenger)
                          const cardType = getPassengerCardType(passenger)
                          const cardNum = getPassengerCardNum(passenger)
                          const cardExpiry = getPassengerCardExpiry(passenger)
                          const pType = String(passenger.type || '').toLowerCase()
                          return (
                            <tr key={index}>
                              <td className={styles.srCell}>{index + 1}</td>
                              <td style={{ fontWeight: 700 }}>
                                {passenger.title ? `${String(passenger.title).toUpperCase()} ` : ''}
                                {passenger.firstName} {passenger.lastName}
                                {ticketNo ? (
                                  <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#6b7280', marginTop: 2 }}>
                                    Ticket No: {ticketNo}
                                  </div>
                                ) : null}
                              </td>
                              <td>
                                <span className={`${styles.typeBadge} ${pType.includes('child') ? styles.typeBadgeChild : pType.includes('infant') ? styles.typeBadgeInfant : ''}`}>
                                  {formatPassengerType(passenger.type)}
                                </span>
                              </td>
                              <td>{formatGender(passenger.gender)}</td>
                              <td>{formatDateValue(passenger.dateOfBirth || passenger.date_of_birth || passenger.dob)}</td>
                              <td>{formatCardType(cardType)}</td>
                              <td>{cardNum || '—'}</td>
                              <td>{formatDateValue(cardExpiry)}</td>
                              <td>
                                {(passenger.email || passenger.phone) ? (
                                  <>
                                    {passenger.email ? <div>{passenger.email}</div> : null}
                                    {passenger.phone ? <div>{passenger.phone}</div> : null}
                                  </>
                                ) : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {cancellationRows.length > 0 && (
                  <section className={styles.section}>
                    <div className={styles.sectionTitleRow}>
                      <span className={styles.sectionNum}>03</span>
                      <span className={styles.sectionIcon}><FaCheckCircle size={11} /></span>
                      <h3 className={styles.sectionTitle}>Cancellation Policy</h3>
                    </div>
                    <div className={styles.tableWrap}>
                      <table className={`${styles.dataTable} ${styles.navyTableHead}`}>
                        <thead>
                          <tr>
                            <th>Passenger</th>
                            <th>Change before departure</th>
                            <th>Change after departure</th>
                            <th>Refund before departure</th>
                            <th>Refund after departure</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cancellationRows.map((row) => (
                            <tr key={row.key}>
                              <td style={{ fontWeight: 700 }}>{row.label}</td>
                              <td>{formatPenaltyLabel(row.changeBefore, penaltyCurrency)}</td>
                              <td>{formatPenaltyLabel(row.changeAfter, penaltyCurrency)}</td>
                              <td>{formatPenaltyLabel(row.refundBefore, penaltyCurrency)}</td>
                              <td>{formatPenaltyLabel(row.refundAfter, penaltyCurrency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* 04 Important */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>{cancellationRows.length > 0 ? '04' : '03'}</span>
                    <span className={styles.sectionIcon}><FaCheckCircle size={11} /></span>
                    <h3 className={styles.sectionTitle}>Important Information</h3>
                  </div>
                  <ul className={styles.infoList}>
                    <li><span className={styles.infoCheck}><FaCheckCircle size={10} /></span>Please arrive at the airport at least 3 hours before international flights and 2 hours before domestic flights.</li>
                    <li><span className={styles.infoCheck}><FaCheckCircle size={10} /></span>Valid passport and visa (if required) must be presented at check-in.</li>
                    <li><span className={styles.infoCheck}><FaCheckCircle size={10} /></span>Check-in closes 60 minutes before departure for international flights and 45 minutes for domestic flights.</li>
                    <li><span className={styles.infoCheck}><FaCheckCircle size={10} /></span>Baggage allowance is subject to airline terms and conditions.</li>
                    <li><span className={styles.infoCheck}><FaCheckCircle size={10} /></span>Flight timings are subject to change. Please confirm with the airline 24 hours before departure.</li>
                    <li><span className={styles.infoCheck}><FaCheckCircle size={10} /></span>This is an electronic ticket. No paper ticket is required for travel.</li>
                  </ul>
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
      </div>
    </div>
  )
}
