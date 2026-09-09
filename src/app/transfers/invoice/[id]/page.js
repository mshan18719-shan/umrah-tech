"use client";
import styles from "../../../hotels/invoice/[id]/Invoice.module.css";
import moment from "moment";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import HotelInvoiceLoader from "@/components/Loader/HotelInvoiceLoader";
import {
  FaPhone,
  FaEnvelope,
  FaCheckCircle,
  FaUser,
  FaCar,
  FaReceipt,
  FaInfoCircle,
  FaPrint,
  FaDownload,
  FaRedoAlt,
  FaMapMarkerAlt,
  FaHome,
  FaFileInvoice,
} from "react-icons/fa";
import Link from "next/link";

export default function Page() {
  const { id } = useParams();
  const ref = useRef();
  const [invoiceDetail, setInvoiceDetail] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const responses = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transfers/booking/details`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking_reference: id }),
        }
      );
      const res = await responses.json();
      setIsLoading(false);
      if (res.success) {
        setInvoiceDetail(res?.data);
      } else {
        setErrorMessage(res?.message);
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Error fetching transfer details:", err);
    }
  };

  function capitalize(text) {
    if (!text) return "";
    const s = String(text);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function convertToCustomerCurrency(price) {
    if (!price || !invoiceDetail.pricing?.supplier_to_display_rate)
      return Number(price || 0).toFixed(2);
    if (
      invoiceDetail.pricing?.supplier_currency ===
      invoiceDetail.pricing?.display_currency
    ) {
      return Number(price).toFixed(2);
    }
    const convertedPrice =
      Number(price) * Number(invoiceDetail.pricing?.supplier_to_display_rate);
    return convertedPrice.toFixed(2);
  }

  function PerTransferPrice(price, qty) {
    if (!price || !qty) return Number(price || 0).toFixed(2);
    const perTransferPrice = Number(price) / Number(qty);
    return perTransferPrice % 1 === 0
      ? perTransferPrice.toFixed(0)
      : perTransferPrice.toFixed(2);
  }

  const handlePrint = () => window.print();

  const currency =
    invoiceDetail?.pricing?.currency ||
    invoiceDetail?.pricing?.display_currency ||
    "";
  const grandTotal = Number(invoiceDetail?.pricing?.amount_after_exchange || 0);
  const paymentStatus = (invoiceDetail?.payment_status || "").toLowerCase();
  const amountPaid =
    paymentStatus === "paid" || paymentStatus === "completed"
      ? grandTotal
      : Number(invoiceDetail?.pricing?.amount_paid || 0);
  const remaining = Math.max(grandTotal - amountPaid, 0);

  const bookingStatus = (invoiceDetail?.booking_status || "").toLowerCase();
  const statusClass =
    bookingStatus === "confirmed"
      ? styles.statusPillConfirmed
      : bookingStatus === "cancelled"
        ? styles.statusPillCancelled
        : styles.statusPillPending;

  const invoiceNo = invoiceDetail?.invoice_number || id || "—";
  const bookingReference = invoiceDetail?.booking_reference || id || "—";

  const pickupLabel =
    invoiceDetail?.exact_pickup_point ||
    invoiceDetail?.booking_criteria?.pickup_location ||
    "Pickup";
  const dropoffLabel =
    invoiceDetail?.exact_dropoff_point ||
    invoiceDetail?.booking_criteria?.dropoff_location ||
    "Dropoff";

  const pickupWhen = invoiceDetail?.booking_criteria?.pickup_date
    ? `${moment(invoiceDetail.booking_criteria.pickup_date).format("MMM DD, YYYY")}${invoiceDetail?.booking_criteria?.pickup_time
      ? ` · ${moment(invoiceDetail.booking_criteria.pickup_time, "HH:mm:ss").format("hh:mm A")}`
      : ""
    }`
    : "—";

  const dropoffWhen = invoiceDetail?.booking_criteria?.dropoff_date
    ? `${moment(invoiceDetail.booking_criteria.dropoff_date).format("MMM DD, YYYY")}${invoiceDetail?.booking_criteria?.dropoff_time
      ? ` · ${moment(invoiceDetail.booking_criteria.dropoff_time, "HH:mm:ss").format("hh:mm A")}`
      : ""
    }`
    : "";

  const timelineStops = useMemo(() => {
    const multi =
      invoiceDetail?.transfer?.trip_type === "all-around" ||
      invoiceDetail?.transfer?.trip_type === "all-round" ||
      invoiceDetail?.transfer?.trip_type === "return";

    if (multi && invoiceDetail?.transfer?.locations?.length) {
      const stops = [];
      invoiceDetail.transfer.locations.forEach((loc, index) => {
        stops.push({
          city: loc.pickup_address || `Stop ${index + 1} Pickup`,
          when: "",
        });
        stops.push({
          city: loc.dropoff_address || `Stop ${index + 1} Dropoff`,
          when: "",
        });
      });
      return stops;
    }

    const stops = [{ city: pickupLabel, when: pickupWhen }];
    if (dropoffLabel) {
      stops.push({ city: dropoffLabel, when: dropoffWhen });
    }
    return stops;
  }, [invoiceDetail, pickupLabel, dropoffLabel, pickupWhen, dropoffWhen]);

  const cancelCards = useMemo(() => {
    const policy = invoiceDetail?.cancellation_policies;
    if (!policy) return [];
    if (policy.cancel_policy !== "refundable") {
      return [{ nonRefundable: true }];
    }
    return (policy.policies || []).map((p) => ({
      when: `FROM ${moment(p.from).format("MMM DD, YYYY").toUpperCase()}`,
      amount: `${invoiceDetail?.pricing?.display_currency || currency} ${convertToCustomerCurrency(p.amount)}`,
      desc: "Fixed cancellation charge",
    }));
  }, [invoiceDetail, currency]);

  const qty = Number(invoiceDetail?.booked_qty || 1);
  const unitRate = PerTransferPrice(
    invoiceDetail?.pricing?.amount_after_exchange,
    qty
  );

  const locationPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < timelineStops.length; i += 2) {
      if (timelineStops[i + 1]) {
        pairs.push({
          pickup: timelineStops[i].city,
          dropoff: timelineStops[i + 1].city,
        });
      }
    }
    return pairs;
  }, [timelineStops]);

  return (
    <div className={styles.pageWrap}>
      <div className={styles.shell}>
        {isLoading ? (
          <div className={styles.sheet}>
            <HotelInvoiceLoader />
          </div>
        ) : errorMessage ? (
          <div className="alert alert-danger">{errorMessage}</div>
        ) : (
          <>
            <div className={styles.previewBar}>
              <span className={styles.previewLabel}>
                Invoice preview — {invoiceNo}
              </span>
              <div className={styles.previewActions}>
                <div className={styles.extraActions}>
                  <Link
                    href={`/transfers/voucher/${invoiceDetail?.booking_reference}`}
                    className={styles.linkChip}
                  >
                    <FaFileInvoice size={12} /> Voucher
                  </Link>
                  <Link href="/" className={styles.linkChip}>
                    <FaHome size={12} /> Home
                  </Link>
                </div>
                <button
                  type="button"
                  className={styles.btnPrint}
                  onClick={handlePrint}
                >
                  <FaPrint size={13} /> Print
                </button>
                {/* <button
                  type="button"
                  className={styles.btnPdf}
                  onClick={handlePrint}
                >
                  <FaDownload size={13} /> Download PDF
                </button> */}
              </div>
            </div>

            <div ref={ref} id="invoice" className={styles.sheet}>
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
                <div className={styles.metaRow}>
                  <div className={styles.metaLeft}>
                    <h2 className={styles.invoiceTitle}>Invoice</h2>
                    {/* <div className={styles.statusRow}>
                      <span className={`${styles.statusPill} ${statusClass}`}>
                        <FaCheckCircle size={11} />
                        {bookingStatus
                          ? bookingStatus.toUpperCase()
                          : "PENDING"}
                      </span>
                      <span className={styles.invoiceId}>{invoiceNo}</span>
                    </div> */}
                  </div>
                  <div className={styles.metaCols}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Date of Issue</span>
                      <span className={styles.metaValue}>
                        {invoiceDetail?.created_at
                          ? moment(invoiceDetail.created_at).format(
                            "MMMM DD, YYYY"
                          )
                          : "—"}
                      </span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Invoice</span>
                      <span className={styles.metaValue}>{invoiceNo}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Booking Ref</span>
                      <span className={styles.metaValue}>{bookingReference}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Payment Status</span>
                      <span
                        className={`${styles.statusPill} ${statusClass} ${paymentStatus !== "paid" &&
                          paymentStatus !== "completed"
                          ? styles.pendingPayBadge
                          : ""
                          }`}
                      >
                        {paymentStatus === "paid" ||
                          paymentStatus === "completed"
                          ? "PAID"
                          : (voucherDetail?.payment_status || "PENDING").toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lead Traveler */}
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <div className={styles.sectionHeadLeft}>
                      <span className={styles.sectionIcon}>
                        <FaUser size={11} />
                      </span>
                      <h3 className={styles.sectionTitle}>Lead Traveler</h3>
                    </div>
                  </div>
                  <div className={styles.card}>
                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Name</span>
                        <div className={styles.fieldValue}>
                          {invoiceDetail?.lead_passenger?.title &&
                            `${invoiceDetail.lead_passenger.title} `}
                          {invoiceDetail?.lead_passenger?.first_name}{" "}
                          {invoiceDetail?.lead_passenger?.last_name}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Email</span>
                        <div className={styles.fieldValue}>
                          {invoiceDetail?.lead_passenger?.email || "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Phone</span>
                        <div className={styles.fieldValue}>
                          {invoiceDetail?.lead_passenger?.phone_number || "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Booking Status</span>
                        <div className={styles.fieldValue}>
                          <span className={styles.inlineStatus}>
                            {bookingStatus
                              ? capitalize(bookingStatus)
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Gender</span>
                        <div className={styles.fieldValue}>
                          {capitalize(invoiceDetail?.lead_passenger?.gender) ||
                            "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Country</span>
                        <div className={styles.fieldValue}>
                          {invoiceDetail?.lead_passenger?.country || "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>
                          City / Pickup
                        </span>
                        <div className={styles.fieldValue}>{pickupLabel}</div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Pax</span>
                        <div className={styles.fieldValue}>
                          {invoiceDetail?.guest_details?.length
                            ? `${1 + invoiceDetail.guest_details.length}`
                            : "1"}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Transport */}
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <div className={styles.sectionHeadLeft}>
                      <span className={styles.sectionIcon}>
                        <FaCar size={11} />
                      </span>
                      <h3 className={styles.sectionTitle}>Transport</h3>
                    </div>
                  </div>
                  <div className={styles.transportGrid}>
                    <div>
                      <span className={styles.fieldLabel}>Service</span>
                      <h4 className={styles.serviceName}>
                        {capitalize(invoiceDetail?.transfer?.vehicle_name) ||
                          capitalize(
                            invoiceDetail?.booking_criteria?.transfer_type
                          ) ||
                          "Ground Transport"}
                      </h4>
                      <div className={styles.routeLine}>
                        <FaMapMarkerAlt size={14} />
                            <span>
                              {pickupLabel} → {dropoffLabel}
                            </span>
                        <span> {pickupWhen} → {dropoffWhen}</span>
                      </div>
                      {invoiceDetail?.special_request && (
                        <p className={styles.serviceNote}>
                          Special request: {invoiceDetail.special_request}
                        </p>
                      )}
                      {invoiceDetail?.flight_number && (
                        <p className={styles.serviceNote}>
                          Flight Number: {invoiceDetail.flight_number}
                        </p>
                      )}
                      <div className={styles.vehicleChips}>
                        <span className={styles.chip}>
                          Qty: {invoiceDetail?.booked_qty || 1}
                        </span>
                        <span className={styles.chip}>
                          {capitalize(invoiceDetail?.transfer?.trip_type) ||
                            "Transfer"}
                        </span>
                        {invoiceDetail?.vehicle_details?.passenger_capacity && (
                          <span className={styles.chip}>
                            Pax:{" "}
                            {invoiceDetail.vehicle_details.passenger_capacity}
                          </span>
                        )}
                        {invoiceDetail?.vehicle_details?.luggage_capacity && (
                          <span className={styles.chip}>
                            Luggage:{" "}
                            {invoiceDetail.vehicle_details.luggage_capacity}
                          </span>
                        )}
                      </div>
                    </div>
                    {locationPairs.length > 1 ? null : (
                      <div className={styles.timeline}>
                        {timelineStops.map((stop, i) => (
                          <div key={i} className={styles.timelineItem}>
                            <div className={styles.timelineDotWrap}>
                              <span className={styles.timelineDot} />
                              <span className={styles.timelineLine} />
                            </div>
                            <div>
                              <p className={styles.timelineCity}>{stop.city}</p>
                              {stop.when ? (
                                <p className={styles.timelineWhen}>{stop.when}</p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {locationPairs.length > 1 && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: "14px 16px",
                        background: "#f8f9fb",
                        border: "1px solid #e0e3e8",
                        borderRadius: 6,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#02245E",
                          marginBottom: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        Multiple Locations
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        {locationPairs.map((pair, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              flexWrap: "wrap",
                              rowGap: 4,
                              columnGap: 8,
                              fontSize: 12.5,
                              padding: "8px 0",
                              borderBottom:
                                i === locationPairs.length - 1
                                  ? "none"
                                  : "1px solid #e8eaed",
                            }}
                          >
                            <span
                              style={{
                                color: "#888",
                                fontWeight: 600,
                                minWidth: 16,
                                flexShrink: 0,
                              }}
                            >
                              {i + 1}.
                            </span>
                            <span
                              style={{
                                color: "#222",
                                fontWeight: 600,
                                minWidth: 0,
                              }}
                            >
                              {pair.pickup}
                            </span>
                            <span
                              style={{
                                color: "#02245E",
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              →
                            </span>
                            <span
                              style={{
                                color: "#222",
                                fontWeight: 600,
                                minWidth: 0,
                              }}
                            >
                              {pair.dropoff}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Guests (extra passengers) */}
                {invoiceDetail?.guest_details?.length > 0 && (
                  <section className={styles.section}>
                    <div className={styles.sectionHead}>
                      <div className={styles.sectionHeadLeft}>
                        <span className={styles.sectionIcon}>
                          <FaUser size={11} />
                        </span>
                        <h3 className={styles.sectionTitle}>
                          Additional Passengers
                        </h3>
                      </div>
                    </div>
                    <div className={styles.card}>
                      <div className={styles.fieldGrid}>
                        {invoiceDetail.guest_details.map((guest, index) => (
                          <div key={index} className={styles.field}>
                            <span className={styles.fieldLabel}>
                              Passenger {index + 2}
                            </span>
                            <div className={styles.fieldValue}>
                              {guest.first_name} {guest.last_name}
                              {guest.gender
                                ? ` · ${capitalize(guest.gender)}`
                                : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* Price */}
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <div className={styles.sectionHeadLeft}>
                      <span className={styles.sectionIcon}>
                        <FaReceipt size={11} />
                      </span>
                      <h3 className={styles.sectionTitle}>Price Breakdown</h3>
                    </div>
                  </div>
                  <div className={styles.priceTableWrap}>
                    <table className={styles.priceTable}>
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Qty</th>
                          <th>Rate</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            {capitalize(invoiceDetail?.transfer?.vehicle_name) ||
                              "Transfer"}{" "}
                            —{" "}
                            {capitalize(
                              invoiceDetail?.booking_criteria?.transfer_type
                            ) || "Service"}
                          </td>
                          <td>{qty}</td>
                          <td>
                            {currency} {unitRate}
                          </td>
                          <td>
                            {currency} {Number(grandTotal).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.totals}>
                    <div className={styles.totalsRow}>
                      <span>Subtotal</span>
                      <strong>
                        {currency} {Number(grandTotal).toFixed(2)}
                      </strong>
                    </div>
                    <div className={styles.grandTotal}>
                      <span>GRAND TOTAL</span>
                      <strong>
                        {currency} {Number(grandTotal).toFixed(2)}
                      </strong>
                    </div>
                    {/* <div className={styles.totalsRow}>
                      <span>Amount Paid</span>
                      <strong>
                        {currency} {Number(amountPaid).toFixed(2)}
                      </strong>
                    </div>
                    <div className={styles.remainingBar}>
                      <span>Remaining Balance</span>
                      <strong>
                        {currency} {Number(remaining).toFixed(2)}
                      </strong>
                    </div> */}
                  </div>
                </section>

                {/* Cancellation */}
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <div className={styles.sectionHeadLeft}>
                      <span className={styles.sectionIcon}>
                        <FaRedoAlt size={11} />
                      </span>
                      <h3 className={styles.sectionTitle}>
                        Cancellation Policy
                      </h3>
                    </div>
                  </div>
                  {cancelCards.length === 0 ? (
                    <div className={styles.cancelFull}>
                      Cancellation terms apply as per transfer policy.
                    </div>
                  ) : cancelCards[0]?.nonRefundable ? (
                    <div className={styles.cancelFull}>
                      This transfer is non-refundable. No refund will be issued
                      in case of cancellation.
                    </div>
                  ) : (
                    <div className={styles.cancelGrid}>
                      {cancelCards.map((c, i) => (
                        <div key={i} className={styles.cancelCard}>
                          <span className={styles.cancelWhen}>{c.when}</span>
                          <p className={styles.cancelAmount}>{c.amount}</p>
                          <p className={styles.cancelDesc}>{c.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Important */}
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <div className={styles.sectionHeadLeft}>
                      <span className={styles.sectionIcon}>
                        <FaInfoCircle size={11} />
                      </span>
                      <h3 className={styles.sectionTitle}>
                        Important Information
                      </h3>
                    </div>
                  </div>
                  <ul className={styles.infoGrid}>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      Please be ready at the pickup location at least 15 minutes
                      before the scheduled pickup time.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      Ensure your contact details are accurate so the driver can
                      reach you.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      The driver will wait up to 30 minutes after the scheduled
                      pickup time.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      Luggage allowance is subject to the vehicle capacity
                      confirmed at the time of booking.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      This booking confirmation is non-transferable and must be
                      presented to the driver.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      This is an electronic confirmation. No paper copy is
                      required.
                    </li>
                  </ul>
                </section>

                <p className={styles.noteText}>
                  <b>Note:</b> This is a computer generated invoice and does not
                  require any physical signature.
                </p>
              </div>

              <footer className={styles.footerBar}>
                <p className={styles.footerThanks}>
                  Thanks for Choosing Umrah Tech
                </p>
                <div className={styles.footerContact}>
                  <span>
                    <FaPhone size={11} /> 01217772522
                  </span>
                  <span>
                    <FaEnvelope size={11} /> info@umrahtech.net
                  </span>
                </div>
              </footer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}