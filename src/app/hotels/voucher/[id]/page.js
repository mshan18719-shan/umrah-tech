"use client";
import styles from "./Voucher.module.css";
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
  FaBuilding,
  FaPrint,
  FaDownload,
  FaCalendarAlt,
  FaFileInvoice,
  FaHome,
  FaUsers,
  FaClock,
  FaHashtag,
} from "react-icons/fa";
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
        setVoucherDetail(res?.data);
      } else {
        setErrorMessage(res?.message);
      }
    } catch (err) {
      setIsLoading(false);
      console.error("Error fetching hotel details:", err);
    }
  };

  function convertToCustomerCurrency(price) {
    if (!price || !voucherDetail.pricing?.supplier_to_display_rate)
      return Number(price || 0).toFixed(2);
    if (
      voucherDetail.currency_code === voucherDetail.pricing?.display_currency
    ) {
      return Number(price).toFixed(2);
    }
    return (
      Number(price) * Number(voucherDetail.pricing.supplier_to_display_rate)
    ).toFixed(2);
  }

  const nights = useMemo(() => {
    if (!voucherDetail?.check_in || !voucherDetail?.check_out) return 0;
    return moment(voucherDetail.check_out).diff(
      moment(voucherDetail.check_in),
      "days"
    );
  }, [voucherDetail]);

  const guestCount = useMemo(() => {
    const adults = voucherDetail?.adults_details?.length || 1;
    return adults;
  }, [voucherDetail]);

  const cancelCards = useMemo(() => {
    const cards = [];
    const displayCurrency = voucherDetail?.pricing?.display_currency || "";

    const pushPolicy = (policy, roomName = "") => {
      if (!policy) return;
      const from = moment(policy.from || policy.from_date || policy.start_date);
      const amountVal = policy.amount ?? policy.original_amount ?? policy.penalty_amount;
      if (amountVal == null && !from.isValid()) return;
      cards.push({
        when: from.isValid()
          ? `FROM ${from.format("MMM DD, YYYY").toUpperCase()}`
          : "CANCELLATION",
        amount: `${displayCurrency} ${convertToCustomerCurrency(amountVal || 0)}`.trim(),
        desc: roomName
          ? `${roomName} — Fixed cancellation charge`
          : "Fixed cancellation charge",
      });
    };

    const topLevel =
      voucherDetail?.cancellation_policies ||
      voucherDetail?.cancellationPolicies ||
      [];

    if (Array.isArray(topLevel) && topLevel.length) {
      topLevel.forEach((roomPolicy) => {
        const roomName =
          roomPolicy?.name ||
          roomPolicy?.room_name ||
          roomPolicy?.roomName ||
          "";
        const policies =
          roomPolicy?.policies ||
          roomPolicy?.cancellationPolicies ||
          roomPolicy?.cancellation_policies ||
          null;

        if (Array.isArray(policies) && policies.length) {
          policies.forEach((policy) => pushPolicy(policy, roomName));
        } else if (roomPolicy?.amount != null || roomPolicy?.from) {
          pushPolicy(roomPolicy, roomName);
        }
      });
    }

    if (!cards.length) {
      voucherDetail?.rooms_details?.forEach((item) => {
        item?.rates?.forEach((rate) => {
          const policies =
            rate?.cancellationPolicies ||
            rate?.cancellation_policies ||
            [];
          if (Array.isArray(policies) && policies.length) {
            policies.forEach((policy) =>
              pushPolicy(policy, item?.name || rate?.boardName || "")
            );
          }
        });
      });
    }

    const seen = new Set();
    const unique = cards.filter((c) => {
      const key = `${c.when}-${c.amount}-${c.desc}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!unique.length) {
      return [{ nonRefundable: true }];
    }
    return unique;
  }, [voucherDetail]);

  const paymentStatus = (voucherDetail?.payment_status || "").toLowerCase();
  const bookingStatus = (voucherDetail?.booking_status || "").toLowerCase();
  const refNo =
    voucherDetail?.booking_reference ||
    voucherDetail?.invoice_number ||
    id;

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
                  href={`/hotels/invoice/${voucherDetail?.invoice_number}`}
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
                {/* Summary hero */}
                <div className={styles.summaryHero}>
                  <div className={styles.summaryLeft}>
                    <span className={styles.summaryBadge}>Booking Summary</span>
                    <h2 className={styles.summaryTitle}>
                      Hotel Booking Voucher
                    </h2>
                    <p className={styles.summaryDesc}>
                      Present this voucher at check-in. Standard check-in is
                      16:00 and check-out is 12:00 unless otherwise confirmed.
                    </p>
                  </div>
                  <div className={styles.ticketCard}>
                    <div className={styles.ticketTop}>
                      <span className={styles.ticketLabel}>
                        <FaHashtag size={10} /> Booking Ref
                      </span>
                      {/* <span
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
                      </span> */}
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
                            Issue Date
                          </span>
                          <span className={styles.ticketItemValue}>
                            {voucherDetail?.created_at
                              ? moment(voucherDetail.created_at).format(
                                "MMM DD, YYYY"
                              )
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
                              ? bookingStatus.charAt(0).toUpperCase() +
                              bookingStatus.slice(1)
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.ticketItem}>
                        <FaUsers size={12} className={styles.ticketItemIcon} />
                        <div>
                          <span className={styles.ticketItemLabel}>Guests</span>
                          <span className={styles.ticketItemValue}>
                            {guestCount} Guest{guestCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className={styles.ticketItem}>
                        <FaCheckCircle
                          size={12}
                          className={styles.ticketItemIcon}
                        />
                        <div>
                          <span className={styles.ticketItemLabel}>
                            Payment Status
                          </span>
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
                      {/* <div className={styles.ticketItem}>
                        <FaClock size={12} className={styles.ticketItemIcon} />
                        <div>
                          <span className={styles.ticketItemLabel}>
                            Duration
                          </span>
                          <span className={styles.ticketItemValue}>
                            {nights} Night{nights !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div> */}
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
                      <span className={styles.dateSideLabel}>Start Date</span>
                      <span className={styles.dateSideValue}>
                        {voucherDetail?.check_in
                          ? moment(voucherDetail.check_in).format(
                              "MMM DD, YYYY"
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.dateCenter}>
                    <span className={styles.dateCenterBadge}>
                      {nights} Night{nights !== 1 ? "s" : ""}
                    </span>
                    <span className={styles.dateCenterLine} />
                  </div>
                  <div className={styles.dateSide}>
                    <span className={styles.dateSideIcon}>
                      <FaCalendarAlt size={14} />
                    </span>
                    <div>
                      <span className={styles.dateSideLabel}>End Date</span>
                      <span className={styles.dateSideValue}>
                        {voucherDetail?.check_out
                          ? moment(voucherDetail.check_out).format(
                              "MMM DD, YYYY"
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div> */}

                {/* 01 Accommodation */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>01</span>
                    <span className={styles.sectionIcon}>
                      <FaBuilding size={11} />
                    </span>
                    <h3 className={styles.sectionTitle}>Accommodation Details</h3>
                    {/* <span className={styles.sectionRight}>
                      {nights} Night{nights !== 1 ? "s" : ""}
                    </span> */}
                  </div>

                  <div className={styles.serviceCard}>
                    <div className={styles.serviceCardHead}>
                      <div className={styles.serviceCardHeadLeft}>
                        <span className={styles.serviceCardCity}>
                          {voucherDetail?.hotel_details?.destinationName ||
                            "Hotel"}
                        </span>
                        <h4 className={styles.serviceCardName}>
                          {voucherDetail?.hotel_details?.name || "—"}
                        </h4>
                        <p className={styles.serviceCardMeta}>
                          {voucherDetail?.check_in
                            ? moment(voucherDetail.check_in).format(
                              "MMM DD, YYYY"
                            )
                            : "—"}{" "}
                          –{" "}
                          {voucherDetail?.check_out
                            ? moment(voucherDetail.check_out).format(
                              "MMM DD, YYYY"
                            )
                            : "—"}
                        </p>
                      </div>
                      <span className={styles.nightsBadge}>
                        {nights} Night{nights !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className={styles.tableWrap}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Room</th>
                            <th>Meal / View</th>
                            <th>Adults</th>
                            <th>Children</th>
                          </tr>
                        </thead>
                        <tbody>
                          {voucherDetail?.rooms_details?.map((item, index) =>
                            item?.rates?.map((rate, rateIndex) => (
                              <tr key={`${index}-${rateIndex}`}>
                                <td className={styles.srCell}>{index + 1}</td>
                                <td>{item.name}</td>
                                <td>{rate.boardName || "—"}</td>
                                <td>{rate.adults ?? "—"}</td>
                                <td>{rate.children ?? 0}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {voucherDetail?.hotel_confirmation_code && (
                      <p className={styles.policyNote}>
                        HCN No: <strong>{voucherDetail.hotel_confirmation_code}</strong>
                        {" · "}
                        {voucherDetail?.hotel?.address ||
                          voucherDetail?.hotel_details?.destinationName}
                      </p>
                    )}
                  </div>
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
                        {voucherDetail?.holder_details?.title}{" "}
                        {voucherDetail?.holder_details?.name}{" "}
                        {voucherDetail?.holder_details?.surname}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Email</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.holder_details?.email || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Phone</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.holder_details?.phone || "—"}
                      </div>
                    </div>
                    {/* <div>
                      <span className={styles.fieldLabel}>Gender</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.holder_details?.gender || "—"}
                      </div>
                    </div> */}
                    <div>
                      <span className={styles.fieldLabel}>Country</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.holder_details?.country || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Invoice No</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.invoice_number || "—"}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 03 Guest Details */}
                {((voucherDetail?.adults_details?.length || 0) > 0 ||
                  (voucherDetail?.children_details?.length || 0) > 0) && (
                  <section className={styles.section}>
                    <div className={styles.sectionTitleRow}>
                      <span className={styles.sectionNum}>03</span>
                      <span className={styles.sectionIcon}>
                        <FaUsers size={11} />
                      </span>
                      <h3 className={styles.sectionTitle}>Guest Details</h3>
                    </div>
                    <div className={styles.guestCard}>
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

                {/* 04 Cancellation */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>04</span>
                    <span className={styles.sectionIcon}>
                      <IoWarningOutline size={13} />
                    </span>
                    <h3 className={styles.sectionTitle}>Cancellation Policy</h3>
                  </div>
                  <div className={styles.cancelGrid}>
                    {cancelCards[0]?.nonRefundable ? (
                      <div className={styles.cancelFull}>
                        This booking is non-refundable. No refund will be issued
                        in case of cancellation.
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

                {/* 05 Special + Important */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>05</span>
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
                        {voucherDetail?.remark
                          ? `"${voucherDetail.remark}"`
                          : "No special requests recorded."}
                      </p>
                    </div>
                    <ul className={styles.infoList}>
                      <li>
                        <span className={styles.infoCheck}>
                          <FaCheckCircle size={10} />
                        </span>
                        This voucher must be presented upon arrival.
                      </li>
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
                        availability.
                      </li>
                      <li>
                        <span className={styles.infoCheck}>
                          <FaCheckCircle size={10} />
                        </span>
                        Any extras not mentioned are payable directly to the
                        hotel.
                      </li>
                      <li>
                        <span className={styles.infoCheck}>
                          <FaCheckCircle size={10} />
                        </span>
                        This voucher is valid only for the specified dates and
                        guests.
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
