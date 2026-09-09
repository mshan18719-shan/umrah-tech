'use client'
import React, { useRef, useEffect, useState } from 'react'
import styles from '../../../hotels/invoice/[id]/Invoice.module.css'
import moment from 'moment'
import { FaUser, FaFileInvoice, FaHome, FaPhone, FaEnvelope, FaPrint, FaDownload, FaCheckCircle, FaReceipt, FaInfoCircle } from 'react-icons/fa'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import FlightBookingDetailLoader from '@/components/Loader/FlightBookinfDetailLoader'
import Image from 'next/image'
import { MdFlight, MdLuggage } from 'react-icons/md'

export default function page() {
  const voucherRef = useRef()
  const { id } = useParams()
  const [voucherDetail, setVoucherDetail] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => { fetchDetails() }, [id])

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

  const getCityName = (seg) => seg?.city || seg?.iata_code || ''
  const getAirlineName = (airline) => airline?.name || airline?.iata_code || ''
  const getAirportName = (seg) => seg?.name || seg?.iata_code || ''

  const getTotalPassengers = () => {
    if (!voucherDetail?.passenger_counts) return ''
    const { adults = 0, children = 0, infants = 0 } = voucherDetail.passenger_counts
    const parts = []
    if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`)
    if (children > 0) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`)
    if (infants > 0) parts.push(`${infants} Infant${infants > 1 ? 's' : ''}`)
    return parts.join(', ')
  }

  function convertToCustomerCurrency(price) {
    if (!price || !voucherDetail?.pricing?.supplier_to_display_rate) return Number(price || 0).toFixed(2)
    return (Number(price) * Number(voucherDetail?.pricing?.supplier_to_display_rate)).toFixed(2)
  }

  const formatDuration = (segment) => `${Math.floor(segment.duration / 60)}h ${segment.duration % 60}m`

  const getTripTypeLabel = () => {
    const t = voucherDetail?.flight_details?.trip_type
    if (t === 'one_way') return 'One Way Flight'
    if (t === 'return') return 'Return Flight'
    if (t === 'multi_city') return 'Multi City Flight'
    return 'Flight Details'
  }

  const leadPassenger = voucherDetail?.passenger_details?.[0]
  const bookingStatus = (voucherDetail?.booking_status || '').toLowerCase()
  const paymentStatus = (voucherDetail?.payment_status || '').toLowerCase()
  const statusClass =
    bookingStatus === 'confirmed' ? styles.statusPillConfirmed
      : bookingStatus === 'cancelled' ? styles.statusPillCancelled
        : styles.statusPillPending

  const currency = voucherDetail?.pricing?.display_currency || ''
  const grandTotal = Number(voucherDetail?.pricing?.amount || 0)
  const baseFare = Number(voucherDetail?.pricing?.base_amount || 0) + Number(voucherDetail?.pricing?.total_markup_amount || 0)
  const taxAmt = Number(voucherDetail?.pricing?.tax_amount || 0)
  const amountPaid = paymentStatus === 'paid' || paymentStatus === 'completed' ? grandTotal : 0
  const remaining = Math.max(grandTotal - amountPaid, 0)
  const refNo = voucherDetail?.booking_reference || id;
  const invoiceNo = voucherDetail?.invoice_number;

  const handlePrint = () => window.print()

  if (isLoading) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.shell}>
          <div className={`${styles.sheet} p-3`}><FlightBookingDetailLoader /></div>
        </div>
      </div>
    )
  }

  if (errorMessage || !voucherDetail) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.shell}>
          <div className="alert alert-danger">{errorMessage || 'Failed to load invoice details'}</div>
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
            <Link href={`/flights/voucher/${voucherDetail.booking_reference}`} className={styles.linkChip}>
              <FaFileInvoice size={12} /> Voucher
            </Link>
            <Link href="/" className={styles.linkChip}><FaHome size={12} /> Home</Link>
            <button type="button" className={styles.btnPrint} onClick={handlePrint}><FaPrint size={13} /> Print</button>
            {/* <button type="button" className={styles.btnPdf} onClick={handlePrint}><FaDownload size={13} /> Download PDF</button> */}
          </div>
        </div>

        <div ref={voucherRef} id="invoice" className={styles.sheet}>
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
                    {voucherDetail?.created_at ? moment(voucherDetail.created_at).format('MMMM DD, YYYY') : '—'}
                  </span>
                </div>
                {invoiceNo && <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Invoice No</span>
                  <span className={styles.metaValue}>{invoiceNo}</span>
                </div>}
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Booking Ref</span>
                  <span className={styles.metaValue}>{refNo}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Payment Status</span>
                  <span className={`${styles.paidBadge} ${paymentStatus !== 'paid' && paymentStatus !== 'completed' ? styles.pendingPayBadge : ''}`} >
                    {paymentStatus === 'paid' || paymentStatus === 'completed' ? 'PAID' : (voucherDetail?.payment_status || 'PENDING').toUpperCase()}
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
                      {leadPassenger?.title && `${leadPassenger.title}. `}
                      {leadPassenger?.firstName} {leadPassenger?.lastName}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Email</span>
                    <div className={styles.fieldValue}>{voucherDetail?.email || leadPassenger?.email || '—'}</div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Phone</span>
                    <div className={styles.fieldValue}>{leadPassenger?.phone || '—'}</div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Booking Status</span>
                    <div className={styles.fieldValue}>
                      <span className={styles.inlineStatus}>
                        {bookingStatus ? bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1) : '—'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Gender</span>
                    <div className={styles.fieldValue}>{leadPassenger?.gender === 'm' ? 'Male' : leadPassenger?.gender === 'f' ? 'Female' : '—'}</div>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Passengers</span>
                    <div className={styles.fieldValue}>{getTotalPassengers() || '—'}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Flight Details */}
            {voucherDetail?.segments?.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionHeadLeft}>
                    <span className={styles.sectionIcon}><MdFlight size={14} /></span>
                    <h3 className={styles.sectionTitle}>Flight Details</h3>
                  </div>
                  <span className={styles.sectionRight}>{getTripTypeLabel()}</span>
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

            {/* Passengers */}
            {voucherDetail?.passenger_details?.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionHeadLeft}>
                    <span className={styles.sectionIcon}><FaUser size={11} /></span>
                    <h3 className={styles.sectionTitle}>Passenger Details</h3>
                  </div>
                  <span className={styles.sectionRight}>{getTotalPassengers()}</span>
                </div>
                <div className={styles.priceTableWrap}>
                  <table className={styles.priceTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Full Name</th>
                        <th>Type</th>
                        <th>Gender</th>
                        <th>Date of Birth</th>
                        <th>Contact/Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voucherDetail.passenger_details.map((passenger, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td><strong>{passenger.title?.toUpperCase()} {passenger.firstName} {passenger.lastName}</strong></td>
                          <td>{passenger.type?.charAt(0).toUpperCase() + passenger.type?.slice(1)}</td>
                          <td>{passenger.gender === 'm' ? 'Male' : 'Female'}</td>
                          <td>{moment(passenger.dateOfBirth).format('DD-MM-YYYY')}</td>
                          <td>
                            {passenger.email && <div>{passenger.email}</div>}
                            {passenger.phone && <div>{passenger.phone}</div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Price */}
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionHeadLeft}>
                  <span className={styles.sectionIcon}><FaReceipt size={11} /></span>
                  <h3 className={styles.sectionTitle}>Price Breakdown</h3>
                </div>
              </div>
              <div className={styles.priceTableWrap}>
                <table className={styles.priceTable}>
                  <thead>
                    <tr>
                      <th>Description</th>
                      {/* <th>Rate</th> */}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Base Fare</td>
                      {/* <td>{currency} {convertToCustomerCurrency(baseFare)}</td> */}
                      <td>{currency} {convertToCustomerCurrency(baseFare)}</td>
                    </tr>
                    <tr>
                      <td>Taxes &amp; Fees</td>
                      {/* <td>{currency} {convertToCustomerCurrency(taxAmt)}</td> */}
                      <td>{currency} {convertToCustomerCurrency(taxAmt)}</td>
                    </tr>
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
                {/* <div className={styles.totalsRow}>
                  <span>Amount Paid</span>
                  <strong>{currency} {Number(amountPaid).toFixed(2)}</strong>
                </div>
                <div className={styles.remainingBar}>
                  <span>Remaining Balance</span>
                  <strong>{currency} {Number(remaining).toFixed(2)}</strong>
                </div> */}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionHeadLeft}>
                  <span className={styles.sectionIcon}><FaInfoCircle size={11} /></span>
                  <h3 className={styles.sectionTitle}>Important Information</h3>
                </div>
              </div>
              <ul className={styles.infoGrid}>
                <li><span className={styles.infoCheck}><FaCheckCircle size={10} /></span>Please arrive at the airport at least 3 hours before international flights and 2 hours before domestic flights.</li>
                <li><span className={styles.infoCheck}><FaCheckCircle size={10} /></span>Valid passport and visa (if required) must be presented at check-in.</li>
                <li><span className={styles.infoCheck}><FaCheckCircle size={10} /></span>Check-in closes 60 minutes before departure for international flights and 45 minutes for domestic flights.</li>
                <li><span className={styles.infoCheck}><FaCheckCircle size={10} /></span>Baggage allowance is subject to airline terms and conditions.</li>
                <li><span className={styles.infoCheck}><FaCheckCircle size={10} /></span>Flight timings are subject to change. Please confirm with the airline 24 hours before departure.</li>
                <li><span className={styles.infoCheck}><FaCheckCircle size={10} /></span>This is an electronic ticket. No paper ticket is required for travel.</li>
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