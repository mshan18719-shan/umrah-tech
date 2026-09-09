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

export default function FlightVoucher() {
  const voucherRef = useRef()
  const { id } = useParams()
  const [voucherDetail, setVoucherDetail] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchDetails()
  }, [id])

  const fetchDetails = async () => {
    setIsLoading(true)
    try {
      const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/booking/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_reference: id }),
      })
      const res = await responses.json()
      setIsLoading(false)
      if (res.success) {
        setVoucherDetail(res?.data)
      } else {
        setErrorMessage(res?.message)
      }
    } catch (err) {
      setIsLoading(false)
      console.error('Error fetching flight details:', err)
    }
  }

  const getAirportName = (seg) => seg?.name || seg?.iata_code || ''
  const getCityName = (seg) => seg?.city || seg?.iata_code || ''
  const getAirlineName = (airline) => airline?.name || airline?.iata_code || ''
  const formatDuration = (segment) => `${Math.floor(segment.duration / 60)}h ${segment.duration % 60}m`

  const getTripTypeLabel = () => {
    const t = voucherDetail?.flight_details?.trip_type
    if (t === 'one_way') return 'One Way Flight'
    if (t === 'return') return 'Return Flight'
    if (t === 'multi_city') return 'Multi City Flight'
    return 'Flight Details'
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

  const guestCount =
    (voucherDetail?.passenger_counts?.adults || 0) +
    (voucherDetail?.passenger_counts?.children || 0) +
    (voucherDetail?.passenger_counts?.infants || 0)

  const bookingStatus = (voucherDetail?.booking_status || '').toLowerCase()
  const paymentStatus = (voucherDetail?.payment_status || '').toLowerCase()
  const lead = voucherDetail?.passenger_details?.[0]
  const firstSeg = voucherDetail?.segments?.[0]
  const lastSeg = voucherDetail?.segments?.[voucherDetail?.segments?.length - 1]

  const handlePrint = () => window.print()

  const bookingRef = voucherDetail?.booking_reference || id;
  const invoiceNo = voucherDetail?.invoice_number;

  return (
    <div className={styles.pageWrap}>
      <div className={styles.shell}>
        {isLoading ? (
          <div className={styles.sheet}><FlightBookingDetailLoader /></div>
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
                <Link href={`/flights/invoice/${voucherDetail?.booking_reference}`} className={styles.linkChip}>
                  <FaFileInvoice size={12} /> Invoice
                </Link>
                <Link href="/" className={styles.linkChip}><FaHome size={12} /> Home</Link>
                <button type="button" className={styles.btnPrint} onClick={handlePrint}><FaPrint size={13} /> Print</button>
                {/* <button type="button" className={styles.btnPdf} onClick={handlePrint}><FaDownload size={13} /> Download PDF</button> */}
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
                      {voucherDetail.segments.map((segment, segIndex) => (
                        <div key={segIndex} className={styles.flightSegmentCard}>
                          <div className={styles.airlineRow}>
                            {segment.airline?.logo_url && (
                              <img src={segment.airline.logo_url} alt={getAirlineName(segment.airline)} className={styles.airlineLogo} />
                            )}
                            <div>
                              <p className={styles.airlineNameText}>{getAirlineName(segment.airline)}</p>
                              <p className={styles.flightNumberText}>
                                Flight: {segment.airline?.iata_code} {segment.flight_number} ·{' '}
                                {segment.cabin_class?.charAt(0).toUpperCase() + segment.cabin_class?.slice(1) || 'Economy'}
                              </p>
                            </div>
                          </div>
                          <div className={styles.flightRouteGrid}>
                            <div className={styles.flightStation}>
                              <h4 className={styles.flightCode}>{segment.origin?.iata_code || getCityName(segment.origin)}</h4>
                              <p className={styles.flightAirport}>{getAirportName(segment.origin)}</p>
                              {segment.origin?.terminal && <p className={styles.flightAirport}>Terminal {segment.origin.terminal}</p>}
                              <p className={styles.flightTime}>{moment(segment.departing_at).format('MMM DD, YYYY · HH:mm')}</p>
                            </div>
                            <div className={styles.flightArrow}>
                              <span className={styles.flightDuration}>{formatDuration(segment)}</span>
                              <div className={styles.flightArrowLine}>
                                <MdFlight className={styles.flightPlaneIcon} />
                              </div>
                            </div>
                            <div className={`${styles.flightStation} ${styles.flightStationRight}`}>
                              <h4 className={styles.flightCode}>{segment.destination?.iata_code || getCityName(segment.destination)}</h4>
                              <p className={styles.flightAirport}>{getAirportName(segment.destination)}</p>
                              {segment.destination?.terminal && <p className={styles.flightAirport}>Terminal {segment.destination.terminal}</p>}
                              <p className={styles.flightTime}>{moment(segment.arriving_at).format('MMM DD, YYYY · HH:mm')}</p>
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
                      ))}
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
                          <th>Passenger Name</th>
                          <th>Type</th>
                          <th>Gender</th>
                          <th>Date of Birth</th>
                          <th>Contact/Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voucherDetail?.passenger_details?.map((passenger, index) => (
                          <tr key={index}>
                            <td className={styles.srCell}>{index + 1}</td>
                            <td style={{ fontWeight: 700 }}>
                              {passenger.title?.toUpperCase()} {passenger.firstName} {passenger.lastName}
                            </td>
                            <td>
                              <span className={`${styles.typeBadge} ${passenger.type === 'child' ? styles.typeBadgeChild : passenger.type === 'infant' ? styles.typeBadgeInfant : ''}`}>
                                {passenger.type?.charAt(0).toUpperCase() + passenger.type?.slice(1)}
                              </span>
                            </td>
                            <td>{passenger.gender === 'm' ? 'Male' : 'Female'}</td>
                            <td>{moment(passenger.dateOfBirth).format('MMM DD, YYYY')}</td>
                            <td>{passenger.phone} <br /> {passenger.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 03 Important */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>03</span>
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
        )}
      </div>
    </div>
  )
}
