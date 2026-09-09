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
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaReceipt,
  FaInfoCircle,
  FaPrint,
  FaDownload,
  FaRedoAlt,
  FaHome,
  FaFileInvoice,
} from "react-icons/fa";
import Link from "next/link";

export default function Page() {
  const { id } = useParams();
  const ref = useRef();
  const [voucherDetail, setVoucherDetail] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const responses = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/activities/booking/${id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const res = await responses.json();
      setIsLoading(false);
      if (res.Success) {
        setVoucherDetail(res?.Content?.booking);
      } else {
        setErrorMessage(res?.message);
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Error fetching activity details:", err);
    }
  };

  function capitalize(text) {
    if (!text) return "";
    return String(text).charAt(0).toUpperCase() + String(text).slice(1);
  }

  function convertToCustomerCurrency(price) {
    if (!price || !voucherDetail.customer_exchange_rate)
      return Number(price || 0).toFixed(2);
    if (voucherDetail.currency_code === voucherDetail.customer_currency)
      return Number(price).toFixed(2);
    return (
      Number(price) * Number(voucherDetail.customer_exchange_rate)
    ).toFixed(2);
  }

  const getTotalPassengers = () => {
    const parts = [];
    const adults = Number(voucherDetail?.adults || 0);
    const children = Number(voucherDetail?.children || 0);
    if (adults > 0) parts.push(`${adults} Adult${adults !== 1 ? "s" : ""}`);
    if (children > 0)
      parts.push(`${children} Child${children !== 1 ? "ren" : ""}`);
    return parts.join(", ") || "—";
  };

  const handlePrint = () => window.print();

  const currency = voucherDetail?.customer_currency || "";
  const grandTotal = Number(voucherDetail?.customer_total || 0);
  const paymentStatus = (voucherDetail?.payment_status || "").toLowerCase();
  const amountPaid =
    paymentStatus === "paid" || paymentStatus === "completed"
      ? grandTotal
      : Number(voucherDetail?.amount_paid || 0);
  const remaining = Math.max(grandTotal - amountPaid, 0);

  const bookingStatus = (voucherDetail?.booking_status || "").toLowerCase();
  const statusClass =
    bookingStatus === "confirmed"
      ? styles.statusPillConfirmed
      : bookingStatus === "cancelled"
        ? styles.statusPillCancelled
        : styles.statusPillPending;

  const refNo = voucherDetail?.booking_reference || id || "—";
  const invoiceNo = voucherDetail?.invoice_number;

  const travelDay = voucherDetail?.travel_date
    ? moment(voucherDetail.travel_date).format("dddd")
    : "—";

  const activityTime = (() => {
    const openTime =
      voucherDetail?.activity?.open_hours?.[
        moment(voucherDetail?.travel_date).format("dddd").toLowerCase()
      ]?.open;
    return openTime ? moment(openTime, "HH:mm").format("hh:mm A") : "";
  })();

  const cancelCards = useMemo(() => {
    const policy = voucherDetail?.activity?.cancellation_policy;
    if (!policy) return [];
    if (
      policy.cancel_policy === "refundable" &&
      policy.cancellation_policies?.length
    ) {
      return policy.cancellation_policies.map((p) => ({
        when: `${p.time_duration} HOURS BEFORE`,
        amount:
          p.type === "percentage"
            ? `${p.value}%`
            : `${currency} ${convertToCustomerCurrency(p.value)}`,
        desc:
          p.type === "percentage"
            ? "Of total booking value"
            : "Fixed cancellation charge",
      }));
    }
    return [{ nonRefundable: true }];
  }, [voucherDetail, currency]);

  const priceRows = useMemo(() => {
    const rows = [
      {
        description: `Activity — ${voucherDetail?.activity?.title || "Activity"} (Adult)`,
        qty: Number(voucherDetail?.adults || 0),
        rate: convertToCustomerCurrency(voucherDetail?.activity?.sale_price),
        total: convertToCustomerCurrency(voucherDetail?.adult_price),
      },
    ];
    if (Number(voucherDetail?.children) > 0) {
      rows.push({
        description: `Activity — ${voucherDetail?.activity?.title || "Activity"} (Child)`,
        qty: Number(voucherDetail?.children || 0),
        rate: convertToCustomerCurrency(
          voucherDetail?.activity?.child_sale_price
        ),
        total: convertToCustomerCurrency(voucherDetail?.child_price),
      });
    }
    (voucherDetail?.additional_services || []).forEach((item) => {
      rows.push({
        description: item.name,
        qty: item.quantity,
        rate: convertToCustomerCurrency(item?.price),
        total: convertToCustomerCurrency(item?.total),
      });
    });
    return rows;
  }, [voucherDetail]);

  const rating = Number(voucherDetail?.activity?.rating_stars || 0);

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
                    href={`/activities/voucher/${voucherDetail?.booking_reference}`}
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
              <div className={styles.watermark}>
                <Image
                  src="/watermark.png"
                  width={450}
                  height={450}
                  style={{
                    objectFit: "contain",
                    width: "100%",
                    height: "100%",
                  }}
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
                        {voucherDetail?.created_at
                          ? moment(
                            voucherDetail.created_at,
                            "DD-MM-YYYY HH:mm:ss"
                          ).format("MMMM DD, YYYY")
                          : "—"}
                      </span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Booking ref</span>
                      <span className={styles.metaValue}>{refNo}</span>
                    </div>
                    {invoiceNo && <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Invoice No</span>
                      <span className={styles.metaValue}>{invoiceNo}</span>
                    </div>}
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Payment Status</span>
                      <span
                        className={`${styles.paidBadge} ${paymentStatus !== "paid" &&
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
                          {voucherDetail?.lead_title}{" "}
                          {voucherDetail?.lead_first_name}{" "}
                          {voucherDetail?.lead_last_name}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Email</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.lead_email || "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Phone</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.lead_phone || "—"}
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
                          {capitalize(voucherDetail?.lead_gender) || "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Country</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.lead_country || "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>
                          City / Address
                        </span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.lead_address ||
                            voucherDetail?.activity?.address ||
                            "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Travelers</span>
                        <div className={styles.fieldValue}>
                          {getTotalPassengers()}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Activity Details */}
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <div className={styles.sectionHeadLeft}>
                      <span className={styles.sectionIcon}>
                        <FaStar size={11} />
                      </span>
                      <h3 className={styles.sectionTitle}>Activity Details</h3>
                    </div>
                  </div>
                  <div className={styles.activityCard}>
                    <h4 className={styles.activityTitle}>
                      {voucherDetail?.activity?.title || "—"}
                    </h4>
                    {rating > 0 && (
                      <div className={styles.starsRow}>
                        {Array.from({ length: 5 }).map((_, index) => {
                          const fullStars = Math.floor(rating);
                          const hasHalfStar = rating - fullStars >= 0.5;
                          if (index < fullStars)
                            return <FaStar key={index} size={14} />;
                          if (index === fullStars && hasHalfStar)
                            return <FaStarHalfAlt key={index} size={14} />;
                          return <FaRegStar key={index} size={14} />;
                        })}
                        <span className={styles.starsScore}>
                          {rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <div className={styles.activityMeta}>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Location</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.activity?.address || "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Activity Date</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.travel_date
                            ? moment(voucherDetail.travel_date).format(
                              "MMM DD, YYYY"
                            )
                            : "—"}
                          {activityTime ? ` · ${activityTime}` : ""}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Day</span>
                        <div className={styles.fieldValue}>{travelDay}</div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Duration</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.activity?.activity_duration || "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Adults</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.adults || 0}
                          {Number(voucherDetail?.children) > 0
                            ? ` · ${voucherDetail.children} Child${Number(voucherDetail.children) !== 1 ? "ren" : ""
                            }`
                            : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Other passengers */}
                {(voucherDetail?.other_passengers?.additional_adults?.length >
                  0 ||
                  voucherDetail?.other_passengers?.children_details?.length >
                  0) && (
                    <section className={styles.section}>
                      <div className={styles.sectionHead}>
                        <div className={styles.sectionHeadLeft}>
                          <span className={styles.sectionIcon}>
                            <FaUser size={11} />
                          </span>
                          <h3 className={styles.sectionTitle}>Guests</h3>
                        </div>
                      </div>
                      <div className={styles.card}>
                        <div className={styles.fieldGrid}>
                          {voucherDetail?.other_passengers?.additional_adults?.map(
                            (adult, index) => (
                              <div key={`a-${index}`} className={styles.field}>
                                <span className={styles.fieldLabel}>
                                  Adult {index + 2}
                                </span>
                                <div className={styles.fieldValue}>
                                  {adult.first_name} {adult.last_name}
                                  {adult.gender
                                    ? ` · ${capitalize(adult.gender)}`
                                    : ""}
                                </div>
                              </div>
                            )
                          )}
                          {voucherDetail?.other_passengers?.children_details?.map(
                            (child, index) => (
                              <div key={`c-${index}`} className={styles.field}>
                                <span className={styles.fieldLabel}>
                                  Child {index + 1}
                                </span>
                                <div className={styles.fieldValue}>
                                  {child.first_name} {child.last_name}
                                  {child.gender
                                    ? ` · ${capitalize(child.gender)}`
                                    : ""}
                                </div>
                              </div>
                            )
                          )}
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
                        {priceRows.map((row, i) => (
                          <tr key={i}>
                            <td>{row.description}</td>
                            <td>{row.qty}</td>
                            <td>
                              {currency} {row.rate}
                            </td>
                            <td>
                              {currency} {row.total}
                            </td>
                          </tr>
                        ))}
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

                {voucherDetail?.special_request && (
                  <section className={styles.section}>
                    <div className={styles.sectionHead}>
                      <div className={styles.sectionHeadLeft}>
                        <span className={styles.sectionIcon}>
                          <FaInfoCircle size={11} />
                        </span>
                        <h3 className={styles.sectionTitle}>Special Request</h3>
                      </div>
                    </div>
                    <div className={styles.card}>
                      <p style={{ margin: 0 }}>
                        {voucherDetail.special_request}
                      </p>
                    </div>
                  </section>
                )}

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
                      Cancellation terms apply as per activity policy.
                    </div>
                  ) : cancelCards[0]?.nonRefundable ? (
                    <div className={styles.cancelFull}>
                      This booking is non-refundable. No refund will be issued
                      for cancellations.
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
                      Please present this invoice on arrival at the activity
                      location.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      Arrive at least 15 minutes before the scheduled activity
                      start time.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      Valid passport or photo ID must be presented at check-in.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      This invoice is valid only for the specified dates,
                      passenger, and activity.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      Activity schedules are subject to weather conditions and
                      operator availability.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      The invoice displays complete pricing inclusive of all
                      applicable taxes.
                    </li>
                  </ul>
                </section>

                <p className={styles.noteText}>
                  <b>Note:</b> This is a computer generated receipt and does not
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
