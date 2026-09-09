"use client";
import styles from "./Invoice.module.css";
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
  FaUsers,
  FaBuilding,
  FaReceipt,
  FaInfoCircle,
  FaPrint,
  FaDownload,
  FaRedoAlt,
} from "react-icons/fa";
import { FiCheckCircle } from "react-icons/fi";

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
        `${process.env.NEXT_PUBLIC_API_URL}/api/hotel/booking/details`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoice_number: id }),
        }
      );
      const res = await responses.json();
      setIsLoading(false);
      if (res.success) {
        const duration = moment(res?.data?.check_out).diff(
          moment(res?.data?.check_in),
          "days"
        );
        res.data.nights = duration;
        setVoucherDetail(res?.data);
      } else {
        setErrorMessage(res?.message);
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Error fetching hotel details:", err);
    }
  };

  const handlePrint = () => window.print();

  function convertToCustomerCurrency(price) {
    if (!price || !voucherDetail.pricing?.supplier_to_display_rate)
      return Number(price || 0).toFixed(2);
    if (
      voucherDetail.currency_code === voucherDetail.pricing?.display_currency
    ) {
      return Number(price).toFixed(2);
    }
    const convertedPrice =
      Number(price) * Number(voucherDetail.pricing?.supplier_to_display_rate);
    return convertedPrice.toFixed(2);
  }

  const currency = voucherDetail?.pricing?.display_currency || "";
  const grandTotal = Number(voucherDetail?.pricing?.booking_amount || 0);
  const paymentStatus = (
    voucherDetail?.payment_status || ""
  ).toLowerCase();
  const amountPaid =
    paymentStatus === "paid" || paymentStatus === "completed"
      ? grandTotal
      : Number(voucherDetail?.pricing?.amount_paid || 0);
  const remaining = Math.max(grandTotal - amountPaid, 0);

  const bookingStatus = (voucherDetail?.booking_status || "").toLowerCase();
  const statusClass =
    bookingStatus === "confirmed"
      ? styles.statusPillConfirmed
      : bookingStatus === "cancelled"
        ? styles.statusPillCancelled
        : styles.statusPillPending;

  const priceRows = useMemo(() => {
    const rows = [];
    voucherDetail?.rooms_details?.forEach((item) => {
      item?.rates?.forEach((rate) => {
        const qty = Number(rate?.rooms || 1);
        const total = Number(
          convertToCustomerCurrency(item?.booking_price || 0)
        );
        const rateAmt = qty ? (total / qty).toFixed(2) : total.toFixed(2);
        rows.push({
          description: `${voucherDetail?.hotel_details?.name || "Hotel"}${item?.name ? ` — ${item.name}` : ""
            }${rate?.boardName ? ` (${rate.boardName})` : ""}`,
          qty,
          rate: rateAmt,
          total: total.toFixed(2),
          policies: rate?.cancellationPolicies || [],
          refundable: rate?.rateComments === "refundable",
        });
      });
    });
    if (!rows.length && voucherDetail?.pricing?.booking_amount) {
      rows.push({
        description: voucherDetail?.hotel_details?.name || "Hotel Stay",
        qty: 1,
        rate: Number(voucherDetail.pricing.booking_amount).toFixed(2),
        total: Number(voucherDetail.pricing.booking_amount).toFixed(2),
        policies: [],
        refundable: false,
      });
    }
    return rows;
  }, [voucherDetail]);

  const cancelCards = useMemo(() => {
    const cards = [];
    voucherDetail?.rooms_details?.forEach((item) => {
      item?.rates?.forEach((rate) => {
        if (rate?.rateComments === "refundable" && rate?.cancellationPolicies?.length) {
          rate.cancellationPolicies.forEach((policy) => {
            const from = moment.utc(policy.from);
            const hours = Math.max(
              from.diff(moment(), "hours"),
              from.diff(moment(voucherDetail?.check_in), "hours")
            );
            cards.push({
              when: from.isValid()
                ? `FROM ${from.format("MMM DD, YYYY").toUpperCase()}`
                : "CANCELLATION",
              amount: `${currency} ${convertToCustomerCurrency(policy.amount)}`,
              desc: "Fixed cancellation charge",
            });
          });
        } else if (rate) {
          cards.push({
            when: "NON-REFUNDABLE",
            amount: "100%",
            desc: "Of total booking value",
            nonRefundable: true,
          });
        }
      });
    });
    // de-dupe by when+amount
    const seen = new Set();
    return cards.filter((c) => {
      const key = `${c.when}-${c.amount}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [voucherDetail, currency]);

  const roomLabel =
    voucherDetail?.rooms_details?.[0]?.name ||
    voucherDetail?.rooms_details?.[0]?.rates?.[0]?.boardName ||
    "Room";
  const boardLabel =
    voucherDetail?.rooms_details?.[0]?.rates?.[0]?.boardName || "";
    const childCount = voucherDetail?.rooms_details?.[0]?.rates?.[0]?.children || 0;
    const adultCount = voucherDetail?.rooms_details?.[0]?.rates?.[0]?.adults || 0;

  const invoiceNo =
    voucherDetail?.invoice_number || id || "—";

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

            <div ref={ref} id="voucher" className={styles.sheet}>
              <div className={styles.watermark}>
                <Image
                  src="/watermark.png"
                  width={450}
                  height={450}
                  style={{ objectFit: "contain", width: "100%", height: "100%" }}
                  alt="Watermark"
                  quality={100}
                />
              </div>

              {/* Brand header */}
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
                {/* Meta */}
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
                    </div> */}
                  </div>
                  <div className={styles.metaCols}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Date of Issue</span>
                      <span className={styles.metaValue}>
                        {voucherDetail?.created_at
                          ? moment(voucherDetail.created_at).format(
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
                          {voucherDetail?.holder_details?.name}{" "}
                          {voucherDetail?.holder_details?.surname}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Email</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.holder_details?.email || "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Phone</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.holder_details?.phone || "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Booking Status</span>
                        <div className={styles.fieldValue}>
                          <span className={styles.inlineStatus}>
                            {bookingStatus
                              ? bookingStatus.charAt(0).toUpperCase() +
                              bookingStatus.slice(1)
                              : "—"}
                          </span>
                        </div>
                      </div>
                      {/* <div className={styles.field}>
                        <span className={styles.fieldLabel}>Gender</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.holder_details?.gender || "—"}
                        </div>
                      </div> */}
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Country</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.holder_details?.country || "—"}
                        </div>
                      </div>
                      {/* <div className={styles.field}>
                        <span className={styles.fieldLabel}>City / Address</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.holder_details?.address ||
                            voucherDetail?.hotel_details?.destinationName ||
                            "—"}
                        </div>
                      </div> */}
                      {voucherDetail?.booking_reference && (
                        <div className={styles.field}>
                          <span className={styles.fieldLabel}>
                            Booking Ref
                          </span>
                          <div className={styles.fieldValue}>
                            {voucherDetail.booking_reference}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Accommodation */}
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <div className={styles.sectionHeadLeft}>
                      <span className={styles.sectionIcon}>
                        <FaBuilding size={11} />
                      </span>
                      <h3 className={styles.sectionTitle}>Accommodation</h3>
                    </div>
                    {/* <span className={styles.sectionRight}>
                      {voucherDetail?.nights}{" "}
                      {voucherDetail?.nights > 1 ? "Nights" : "Night"}
                    </span> */}
                  </div>
                  <div className={styles.hotelGrid}>
                    <article className={styles.hotelCard}>
                      <div className={styles.hotelCardTop}>
                        <span className={styles.hotelCity}>
                          {voucherDetail?.hotel_details?.destinationName ||
                            "Hotel"}
                        </span>
                        <span className={styles.nightsBadge}>
                          {voucherDetail?.nights}{" "}
                          {voucherDetail?.nights > 1 ? "Nights" : "Night"}
                        </span>
                      </div>
                      <h4 className={styles.hotelName}>
                        {voucherDetail?.hotel_details?.name || "—"}
                      </h4>
                      <div className={styles.hotelMetaRow}>
                        <div>
                          <span className={styles.fieldLabel}>Check-in</span>
                          <div className={styles.fieldValue}>
                            {voucherDetail?.check_in
                              ? moment(voucherDetail.check_in).format(
                                "MMM DD, YYYY"
                              )
                              : "—"}
                          </div>
                        </div>
                        <div>
                          <span className={styles.fieldLabel}>Check-out</span>
                          <div className={styles.fieldValue}>
                            {voucherDetail?.check_out
                              ? moment(voucherDetail.check_out).format(
                                "MMM DD, YYYY"
                              )
                              : "—"}
                          </div>
                        </div>
                        <div>
                          <span className={styles.fieldLabel}>Room</span>
                          <div className={styles.fieldValue}>{roomLabel}</div>
                        </div>
                        {voucherDetail?.hotel_confirmation_code && (
                          <div>
                            <span className={styles.fieldLabel}>HCN No</span>
                            <div className={styles.fieldValue}>
                              {voucherDetail.hotel_confirmation_code}
                            </div>
                          </div>
                        )}
                      </div>
                      {(boardLabel ||
                        voucherDetail?.hotel?.address ||
                        voucherDetail?.hotel_details?.destinationName) && (
                          <div className={styles.hotelBoard}>
                            <FiCheckCircle size={14} />
                            <span>
                              {boardLabel
                                ? `${boardLabel} included`
                                : voucherDetail?.hotel?.address ||
                                voucherDetail?.hotel_details?.destinationName}
                            </span>
                            <span>{ `, ${adultCount} Adult${adultCount > 1 ? "s" : ""}`}</span>
                            <span>{ `, ${childCount} Child${childCount > 1 ? "s" : ""}`}</span>
                          </div>
                        )}
                    </article>

                    {/* Extra room cards if multiple distinct rooms */}
                    {voucherDetail?.rooms_details?.slice(1).map((item, idx) => (
                      <article key={idx} className={styles.hotelCard}>
                        <div className={styles.hotelCardTop}>
                          <span className={styles.hotelCity}>
                            {voucherDetail?.hotel_details?.destinationName ||
                              "Hotel"}
                          </span>
                          <span className={styles.nightsBadge}>
                            {voucherDetail?.nights}{" "}
                            {voucherDetail?.nights > 1 ? "Nights" : "Night"}
                          </span>
                        </div>
                        <h4 className={styles.hotelName}>
                          {item?.name || voucherDetail?.hotel_details?.name}
                        </h4>
                        <div className={styles.hotelMetaRow}>
                          <div>
                            <span className={styles.fieldLabel}>Check-in</span>
                            <div className={styles.fieldValue}>
                              {moment(voucherDetail.check_in).format(
                                "MMM DD, YYYY"
                              )}
                            </div>
                          </div>
                          <div>
                            <span className={styles.fieldLabel}>Check-out</span>
                            <div className={styles.fieldValue}>
                              {moment(voucherDetail.check_out).format(
                                "MMM DD, YYYY"
                              )}
                            </div>
                          </div>
                          <div>
                            <span className={styles.fieldLabel}>Room</span>
                            <div className={styles.fieldValue}>
                              {item?.name || "—"}
                            </div>
                          </div>
                        </div>
                        {item?.rates?.[0]?.boardName && (
                          <div className={styles.hotelBoard}>
                            <FiCheckCircle size={14} />
                            <span>{item.rates[0].boardName} included</span>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>

                {/* Guest Details */}
                {((voucherDetail?.adults_details?.length || 0) > 0 ||
                  (voucherDetail?.children_details?.length || 0) > 0) && (
                  <section className={styles.section}>
                    <div className={styles.sectionHead}>
                      <div className={styles.sectionHeadLeft}>
                        <span className={styles.sectionIcon}>
                          <FaUsers size={11} />
                        </span>
                        <h3 className={styles.sectionTitle}>Guest Details</h3>
                      </div>
                    </div>
                    <div className={styles.card}>
                      <ul className={styles.guestList}>
                        {(voucherDetail?.adults_details || []).map((guest, index) => (
                          <li key={`adult-${index}`} className={styles.guestItem}>
                            <div className={styles.guestMain}>
                              <span className={styles.guestName}>
                                {[guest?.name, guest?.surname].filter(Boolean).join(" ") || "—"}
                              </span>
                              <span className={styles.guestTypeBadge}>Adult</span>
                            </div>
                          </li>
                        ))}
                        {(voucherDetail?.children_details || []).map((guest, index) => (
                          <li key={`child-${index}`} className={styles.guestItem}>
                            <div className={styles.guestMain}>
                              <span className={styles.guestName}>
                                {[guest?.name, guest?.surname].filter(Boolean).join(" ") || "—"}
                              </span>
                              <span className={styles.guestTypeBadge}>Child</span>
                              {guest?.age != null && guest?.age !== "" && (
                                <span className={styles.childAgeBadge}>
                                  Age {guest.age}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

                {/* Price Breakdown */}
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
                      Cancellation terms apply as per hotel policy. Please
                      contact support for details.
                    </div>
                  ) : (
                    <div className={styles.cancelGrid}>
                      {cancelCards.map((c, i) =>
                        c.nonRefundable && cancelCards.length === 1 ? (
                          <div key={i} className={styles.cancelFull}>
                            This booking is non-refundable. No refund will be
                            issued in case of cancellation.
                          </div>
                        ) : (
                          <div key={i} className={styles.cancelCard}>
                            <span className={styles.cancelWhen}>{c.when}</span>
                            <p className={styles.cancelAmount}>{c.amount}</p>
                            <p className={styles.cancelDesc}>{c.desc}</p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>

                {voucherDetail?.remark && (
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
                      <p style={{ margin: 0 }}>{voucherDetail.remark}</p>
                    </div>
                  </section>
                )}

                {/* Important Information */}
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
                      Standard Check-in time is 16:00 and Check-out time is
                      12:00.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      Early check-in and late check-out are subject to hotel
                      availability and may incur additional charges.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      For group bookings, separate cancellation policies may
                      apply as per the confirmed agreement.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      No-show bookings will be charged the full amount of the
                      reservation.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      All bookings are subject to the hotel’s standard terms and
                      local regulations.
                    </li>
                    <li>
                      <span className={styles.infoCheck}>
                        <FaCheckCircle size={10} />
                      </span>
                      This is a computer generated receipt and does not require
                      any physical signature.
                    </li>
                  </ul>
                </section>

                <p className={styles.noteText}>
                  <b>Note:</b> Account Holder: UmrahTech Ltd · Account Number:
                  58516868 · Sort Code: 309950
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
