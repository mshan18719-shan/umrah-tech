"use client";
import styles from "../../../hotels/voucher/[id]/Voucher.module.css";
import moment from "moment";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import HotelVoucherLoader from "@/components/Loader/HotelVoucherLoader";
import {
  FaPhone,
  FaEnvelope,
  FaCheckCircle,
  FaUser,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaPrint,
  FaDownload,
  FaCalendarAlt,
  FaFileInvoice,
  FaHome,
  FaUsers,
  FaHashtag,
} from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { IoWarningOutline } from "react-icons/io5";
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
    const adults = Number(voucherDetail?.adults || 0);
    const children = Number(voucherDetail?.children || 0);
    const parts = [];
    if (adults > 0) parts.push(`${adults} Adult${adults !== 1 ? "s" : ""}`);
    if (children > 0)
      parts.push(`${children} Child${children !== 1 ? "ren" : ""}`);
    return parts.join(", ") || "—";
  };

  const formatGuestName = (guest) => {
    if (!guest) return "";
    return `${guest.first_name || guest.firstName || ""} ${guest.last_name || guest.lastName || ""}`.trim();
  };

  const guestSlots = useMemo(() => {
    const adultsBooked = Number(voucherDetail?.adults || 0);
    const childrenBooked = Number(voucherDetail?.children || 0);
    const additionalAdults =
      voucherDetail?.other_passengers?.additional_adults || [];
    const childrenDetails =
      voucherDetail?.other_passengers?.children_details || [];

    const adultGuests = [];
    const extraAdultSlots = Math.max(
      Math.max(0, adultsBooked - 1),
      additionalAdults.length
    );
    for (let i = 0; i < extraAdultSlots; i++) {
      const guest = additionalAdults[i];
      const name = formatGuestName(guest);
      adultGuests.push({
        key: `adult-${i}`,
        label: `Adult ${i + 2}`,
        value: name
          ? `${name}${guest?.gender ? ` · ${capitalize(guest.gender)}` : ""}`
          : "Details not provided",
      });
    }

    const childGuests = [];
    const childSlots = Math.max(childrenBooked, childrenDetails.length);
    for (let i = 0; i < childSlots; i++) {
      const guest = childrenDetails[i];
      const name = formatGuestName(guest);
      childGuests.push({
        key: `child-${i}`,
        label: `Child ${i + 1}`,
        value: name
          ? `${name}${guest?.gender ? ` · ${capitalize(guest.gender)}` : ""}`
          : "Details not provided",
      });
    }

    return { adultGuests, childGuests };
  }, [voucherDetail]);

  const guestCount =
    Number(voucherDetail?.adults || 0) + Number(voucherDetail?.children || 0);

  const cancelCards = useMemo(() => {
    const policy = voucherDetail?.activity?.cancellation_policy;
    const currency = voucherDetail?.customer_currency || "";
    if (!policy) return [];
    if (
      policy.cancel_policy === "refundable" &&
      policy.cancellation_policies?.length
    ) {
      return policy.cancellation_policies.slice(0, 3).map((p) => ({
        when: `${p.time_duration} HRS BEFORE`,
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
  }, [voucherDetail]);

  const activityTime = (() => {
    const openTime =
      voucherDetail?.activity?.open_hours?.[
        moment(voucherDetail?.travel_date).format("dddd").toLowerCase()
      ]?.open;
    return openTime ? moment(openTime, "HH:mm").format("hh:mm A") : "";
  })();

  const paymentStatus = (voucherDetail?.payment_status || "").toLowerCase();
  const bookingStatus = (voucherDetail?.booking_status || "").toLowerCase();
  const refNo = voucherDetail?.booking_reference || id;
  const rating = Number(voucherDetail?.activity?.rating_stars || 0);
  const invoiceNo = voucherDetail?.invoice_number;

  const handlePrint = () => window.print();

  return (
    <div className={styles.pageWrap}>
      <div className={styles.shell}>
        {isLoading ? (
          <div className={styles.sheet}>
            <HotelVoucherLoader />
          </div>
        ) : errorMessage ? (
          <div className="alert alert-danger">{errorMessage}</div>
        ) : (
          <>
            <div className={styles.previewBar}>
              <span className={styles.previewLabel}>
                Voucher preview — {refNo}
              </span>
              <div className={styles.previewActions}>
                <Link
                  href={`/activities/invoice/${voucherDetail?.booking_reference}`}
                  className={styles.linkChip}
                >
                  <FaFileInvoice size={12} /> Invoice
                </Link>
                <Link href="/" className={styles.linkChip}>
                  <FaHome size={12} /> Home
                </Link>
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
                <div className={styles.summaryHero}>
                  <div className={styles.summaryLeft}>
                    <span className={styles.summaryBadge}>Booking Summary</span>
                    {invoiceNo && <span className={`${styles.invoBadge} mx-2`}> Invoice No: {invoiceNo}</span>}
                    <h2 className={styles.summaryTitle}>
                      Activity Booking Voucher
                    </h2>
                    <p className={styles.summaryDesc}>
                      Present this voucher on arrival at the activity location.
                      Arrive at least 15 minutes before the scheduled start time.
                    </p>
                  </div>
                  <div className={styles.ticketCard}>
                    <div className={styles.ticketTop}>
                      <span className={styles.ticketLabel}>
                        <FaHashtag size={10} /> Booking Ref
                      </span>
                    </div>
                    <p className={styles.ticketRef}>{refNo}</p>
                    <div className={styles.ticketGrid}>
                      <div className={styles.ticketItem}>
                        <FaCalendarAlt
                          size={12}
                          className={styles.ticketItemIcon}
                        />
                        <div>
                          <span className={styles.ticketItemLabel}>
                            Booking Date
                          </span>
                          <span className={styles.ticketItemValue}>
                            {voucherDetail?.created_at
                              ? moment(
                                voucherDetail.created_at,
                                "DD-MM-YYYY HH:mm:ss"
                              ).format("MMM DD, YYYY")
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.ticketItem}>
                        <FaCheckCircle
                          size={12}
                          className={styles.ticketItemIcon}
                        />
                        <div>
                          <span className={styles.ticketItemLabel}>Booking Status</span>
                          <span
                            className={`${styles.ticketItemValue} ${styles.statusOk}`}
                          >
                            <FaCheckCircle size={10} />
                            {bookingStatus
                              ? capitalize(bookingStatus)
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.ticketItem}>
                        <FaUsers size={12} className={styles.ticketItemIcon} />
                        <div>
                          <span className={styles.ticketItemLabel}>pax</span>
                          <span className={styles.ticketItemValue}>
                            {guestCount || getTotalPassengers()}
                          </span>
                        </div>
                      </div>
                      <div className={styles.ticketItem}>
                      <FaCheckCircle
                          size={12}
                          className={styles.ticketItemIcon}
                        />
                        <div>
                          <span className={styles.ticketItemLabel}>Payment Status</span>
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
                  </div>
                </div>

                {/* Date ribbon */}
                {/* <div className={styles.dateRibbon}>
                  <div className={styles.dateSide}>
                    <span className={styles.dateSideIcon}>
                      <FaCalendarAlt size={14} />
                    </span>
                    <div>
                      <span className={styles.dateSideLabel}>Activity Date</span>
                      <span className={styles.dateSideValue}>
                        {voucherDetail?.travel_date
                          ? moment(voucherDetail.travel_date).format(
                              "MMM DD, YYYY"
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.dateCenter}>
                    <span className={styles.dateCenterBadge}>
                      {voucherDetail?.travel_date
                        ? moment(voucherDetail.travel_date).format("dddd")
                        : "Activity"}
                    </span>
                    <span className={styles.dateCenterLine} />
                  </div>
                  <div className={styles.dateSide}>
                    <span className={styles.dateSideIcon}>
                      <FaCalendarAlt size={14} />
                    </span>
                    <div>
                      <span className={styles.dateSideLabel}>Time</span>
                      <span className={styles.dateSideValue}>
                        {activityTime || "—"}
                      </span>
                    </div>
                  </div>
                </div> */}

                {/* 01 Activity Details */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>01</span>
                    <span className={styles.sectionIcon}>
                      <FaStar size={11} />
                    </span>
                    <h3 className={styles.sectionTitle}>Activity Details</h3>
                  </div>

                  <div className={styles.activityHero}>
                    <h4 className={styles.activityTitle}>
                      {voucherDetail?.activity?.title || "—"}
                    </h4>
                    <div className={styles.activityLocation}>
                      <FaLocationDot size={13} />
                      <span>{voucherDetail?.activity?.address || "—"}</span>
                    </div>
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
                    <div className={styles.metaGrid}>
                      <div>
                        <span className={styles.fieldLabel}>Location</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.activity?.address || "—"}
                        </div>
                      </div>
                      <div>
                        <span className={styles.fieldLabel}>Activity Date</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.travel_date
                            ? moment(voucherDetail.travel_date).format(
                              "MMM DD, YYYY"
                            )
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <span className={styles.fieldLabel}>Day</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.travel_date
                            ? moment(voucherDetail.travel_date).format("dddd")
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <span className={styles.fieldLabel}>Pax</span>
                        <div className={styles.fieldValue}>
                          {getTotalPassengers()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {voucherDetail?.additional_services?.length > 0 && (
                    <div className={styles.serviceCard} style={{ marginTop: 14 }}>
                      <div className={styles.serviceCardHead}>
                        <span className={styles.serviceCardName}>
                          Additional Services
                        </span>
                      </div>
                      <div className={styles.tableWrap}>
                        <table className={styles.dataTable}>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Service</th>
                              <th>Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {voucherDetail.additional_services.map(
                              (item, index) => (
                                <tr key={index}>
                                  <td className={styles.srCell}>{index + 1}</td>
                                  <td>{item.name}</td>
                                  <td>{item.quantity}</td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>

                {/* 02 Booking By */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>02</span>
                    <span className={styles.sectionIcon}>
                      <FaUser size={11} />
                    </span>
                    <h3 className={styles.sectionTitle}>Booking By</h3>
                  </div>
                  <div className={styles.bookingGrid}>
                    <div>
                      <span className={styles.fieldLabel}>Full Name</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.lead_title}{" "}
                        {voucherDetail?.lead_first_name}{" "}
                        {voucherDetail?.lead_last_name}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Email</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.lead_email || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Phone</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.lead_phone || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Gender</span>
                      <div className={styles.fieldValue}>
                        {capitalize(voucherDetail?.lead_gender) || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Country</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.lead_country || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Address</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.lead_address ||
                          voucherDetail?.activity?.address ||
                          "—"}
                      </div>
                    </div>
                  </div>
                </section>

                {(guestSlots.adultGuests.length > 0 ||
                  guestSlots.childGuests.length > 0) && (
                  <section className={styles.section}>
                    <div className={styles.sectionTitleRow}>
                      <span className={styles.sectionNum}>03</span>
                      <span className={styles.sectionIcon}>
                        <FaUser size={11} />
                      </span>
                      <h3 className={styles.sectionTitle}>Guests</h3>
                    </div>
                    <div className={styles.bookingGrid}>
                      {guestSlots.adultGuests.map((guest) => (
                        <div key={guest.key}>
                          <span className={styles.fieldLabel}>{guest.label}</span>
                          <div className={styles.fieldValue}>{guest.value}</div>
                        </div>
                      ))}
                      {guestSlots.childGuests.map((guest) => (
                        <div key={guest.key}>
                          <span className={styles.fieldLabel}>{guest.label}</span>
                          <div className={styles.fieldValue}>{guest.value}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Cancellation */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>
                      {guestSlots.adultGuests.length > 0 ||
                      guestSlots.childGuests.length > 0
                        ? "04"
                        : "03"}
                    </span>
                    <span className={styles.sectionIcon}>
                      <IoWarningOutline size={13} />
                    </span>
                    <h3 className={styles.sectionTitle}>Cancellation Policy</h3>
                  </div>
                  <div className={styles.cancelGrid}>
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
                      cancelCards.map((c, i) => (
                        <div key={i} className={styles.cancelCard}>
                          <span className={styles.cancelWhen}>{c.when}</span>
                          <p className={styles.cancelAmount}>{c.amount}</p>
                          <p className={styles.cancelDesc}>{c.desc}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Special / Important */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>
                      {guestSlots.adultGuests.length > 0 ||
                      guestSlots.childGuests.length > 0
                        ? "05"
                        : "04"}
                    </span>
                    <span className={styles.sectionIcon}>
                      <FaCheckCircle size={11} />
                    </span>
                    <h3 className={styles.sectionTitle}>
                      Special Request &amp; Important Info
                    </h3>
                  </div>
                  <div className={styles.splitGrid}>
                    <div className={styles.specialBox}>
                      <span className={styles.specialBoxTitle}>
                        Special Request
                      </span>
                      <p className={styles.specialBoxText}>
                        {voucherDetail?.special_request
                          ? `"${voucherDetail.special_request}"`
                          : "No special requests recorded."}
                      </p>
                    </div>
                    <ul className={styles.infoList}>
                      <li>
                        <span className={styles.infoCheck}>
                          <FaCheckCircle size={10} />
                        </span>
                        Please present this voucher on arrival at the activity
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
                        Valid passport or photo ID must be presented at
                        check-in.
                      </li>
                      <li>
                        <span className={styles.infoCheck}>
                          <FaCheckCircle size={10} />
                        </span>
                        This voucher is valid only for the specified dates,
                        passenger, and activity.
                      </li>
                      <li>
                        <span className={styles.infoCheck}>
                          <FaCheckCircle size={10} />
                        </span>
                        Activity schedules are subject to weather conditions and
                        operator availability.
                      </li>
                    </ul>
                  </div>
                </section>

                <p className={styles.noteText}>
                  This is a computer-generated voucher and does not require a
                  physical signature.
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
