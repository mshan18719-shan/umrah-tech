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
import { getDisplayQuestionAnswers } from "@/util/activityQuestionAnswers";
import { getCancellationDisplay } from "@/components/Activities/Detail/cancellationPolicyUtils";

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
    if (price == null || price === "") return Number(0).toFixed(2);
    if (!voucherDetail.customer_exchange_rate)
      return Number(price || 0).toFixed(2);
    if (voucherDetail.currency_code === voucherDetail.customer_currency)
      return Number(price).toFixed(2);
    return (
      Number(price) * Number(voucherDetail.customer_exchange_rate)
    ).toFixed(2);
  }

  function formatChildUnderLabel(age) {
    if (age == null || age === "") return "Child";
    return `Children (under ${age})`;
  }

  function getChildrenAgeSummary() {
    const details = voucherDetail?.other_passengers?.children_details || [];
    if (!details.length) {
      const count = Number(voucherDetail?.children || 0);
      return count > 0 ? [{ label: "Children", count }] : [];
    }
    const counts = {};
    details.forEach((child) => {
      const label = formatChildUnderLabel(child?.age);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, count]) => ({ label, count }));
  }

  function getModalityName() {
    return (
      voucherDetail?.modality?.name ||
      voucherDetail?.voucher?.modality?.name ||
      ""
    );
  }

  function getStartTime() {
    const modalityName = getModalityName();
    const timeMatch = String(modalityName).match(/(\d{1,2}:\d{2})/);
    if (timeMatch) {
      const parsed = moment(timeMatch[1], ["HH:mm", "H:mm"], true);
      if (parsed.isValid()) return parsed.format("hh:mm A");
    }
    const session =
      voucherDetail?.modality?.session?.name ||
      voucherDetail?.modality?.session?.code ||
      voucherDetail?.modality?.session;
    if (session) {
      const parsed = moment(session, ["HH:mm", "H:mm", "hh:mm A"], true);
      if (parsed.isValid()) return parsed.format("hh:mm A");
      return String(session);
    }
    return "";
  }

  function getLanguageLabel() {
    const langs =
      voucherDetail?.languages || voucherDetail?.voucher?.languages || [];
    if (!langs.length) {
      const modalityLang =
        voucherDetail?.modality?.language?.description ||
        voucherDetail?.modality?.language?.code;
      if (modalityLang) return String(modalityLang);
      const modalityName = getModalityName().toLowerCase();
      if (modalityName.includes("english") || modalityName.includes("eng"))
        return "English";
      return "";
    }
    return langs
      .map((l) =>
        l.description || (l.code === "en" ? "English" : String(l.code || "").toUpperCase())
      )
      .filter(Boolean)
      .join(", ");
  }

  function getCancellationPolicy() {
    return (
      voucherDetail?.cancellation_policy ||
      voucherDetail?.cancellation_policies ||
      voucherDetail?.activity?.cancellation_policy ||
      null
    );
  }

  function parseContractRemarks() {
    const remarks =
      voucherDetail?.contract_remarks ||
      voucherDetail?.voucher?.contract_remarks ||
      voucherDetail?.voucher?.comments ||
      [];
    const text = remarks.map((r) => r?.text).filter(Boolean).join(" ");
    if (!text.trim()) return [];

    return text
      .split("//")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const sepIdx = part.indexOf(":");
        if (sepIdx === -1) return { label: "", value: part };
        return {
          label: part.slice(0, sepIdx).trim(),
          value: part.slice(sepIdx + 1).trim(),
        };
      })
      .filter((item) => item.value);
  }

  const SUPPLIER_REMARK_LABELS = [
    "supplier name",
    "supplier emergency phone",
    "supplier",
    "voucher type",
    "meeting point instructions",
    "start/opening time",
    "end/closing time",
  ];

  function getVisibleContractRemarks() {
    return parseContractRemarks().filter(
      (item) =>
        !SUPPLIER_REMARK_LABELS.includes(String(item.label || "").toLowerCase())
    );
  }

  const getTotalPassengers = () => {
    const parts = [];
    const adults = Number(voucherDetail?.adults || 0);
    if (adults > 0) parts.push(`${adults} Adult${adults !== 1 ? "s" : ""}`);
    getChildrenAgeSummary().forEach((item) => {
      parts.push(`${item.count} ${item.label}`);
    });
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
      const agePart =
        guest?.age != null && guest?.age !== ""
          ? ` · under ${guest.age}`
          : "";
      childGuests.push({
        key: `child-${i}`,
        label: `Child ${i + 1}`,
        value: name
          ? `${name}${guest?.gender ? ` · ${capitalize(guest.gender)}` : ""}${agePart}`
          : guest?.age != null
            ? `Under ${guest.age}`
            : "Details not provided",
      });
    }

    return { adultGuests, childGuests };
  }, [voucherDetail]);

  const guestCount =
    Number(voucherDetail?.adults || 0) + Number(voucherDetail?.children || 0);

  const modalityName = getModalityName();
  const startTimeFromModality = getStartTime();
  const languageLabel = getLanguageLabel();
  const contractRemarkItems = getVisibleContractRemarks();
  const allContractRemarks = parseContractRemarks();
  const meetingPointRemark = allContractRemarks.find(
    (item) => String(item.label || "").toLowerCase() === "meeting point"
  )?.value;
  const durationRemark = allContractRemarks.find(
    (item) => String(item.label || "").toLowerCase() === "duration"
  )?.value;
  const childrenAgeSummary = getChildrenAgeSummary();
  const activityDuration =
    voucherDetail?.activity?.activity_duration || durationRemark || "";

  const cancelCards = useMemo(() => {
    const policy = getCancellationPolicy();
    const currency =
      voucherDetail?.customer_currency ||
      voucherDetail?.currency_code ||
      "";
    if (!policy) return [];

    const cancelPolicy = String(
      policy.cancel_policy || policy.cancelPolicy || ""
    ).toLowerCase();
    const policies = Array.isArray(policy?.cancellation_policies)
      ? policy.cancellation_policies
      : Array.isArray(policy)
        ? policy
        : [];

    if (cancelPolicy === "non-refundable" || cancelPolicy === "non_refundable") {
      return [{ nonRefundable: true }];
    }

    if (policies.length) {
      return policies.slice(0, 3).map((p) => {
        const fromRaw = p?.from || p?.dateFrom;
        const from = fromRaw ? moment(fromRaw) : null;
        const when = from?.isValid()
          ? `FROM ${from.format("MMM DD, YYYY").toUpperCase()}`
          : p?.time_duration != null
            ? `${p.time_duration} HRS BEFORE`
            : "CANCELLATION";
        const feeValue = Number(p?.amount ?? p?.value ?? p?.fee ?? 0);
        const isFree =
          feeValue === 0 ||
          (p?.type === "percentage" && Number(p.value) === 0);
        return {
          when,
          amount: isFree ? "Free" : "Non refundable",
          desc: isFree
            ? "Full refund. No cancellation fee."
            : "This booking is non refundable after this point.",
        };
      });
    }

    if (cancelPolicy === "refundable") return [];
    return [{ nonRefundable: true }];
  }, [voucherDetail]);

  const additionalInfoItems = getDisplayQuestionAnswers(voucherDetail);

  const cancellationDisplay = useMemo(() => {
    const policy = getCancellationPolicy();
    if (!policy) return null;
    const normalized = Array.isArray(policy)
      ? { cancel_policy: "refundable", cancellation_policies: policy }
      : policy;
    return getCancellationDisplay(normalized, voucherDetail?.travel_date);
  }, [voucherDetail]);

  const activityTime = (() => {
    if (startTimeFromModality) return startTimeFromModality;
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
                    <FaPhone size={12} /> +1234567890
                  </span>
                  <span className={styles.brandContactItem}>
                    <FaEnvelope size={12} /> info@Umrahtech.com
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
                    {voucherDetail?.provider_reference && (
                      <p className={styles.summaryDesc} style={{ marginTop: 4, marginBottom: 0 }}>
                        Provider ref: {voucherDetail.provider_reference}
                      </p>
                    )}
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
                            {getTotalPassengers() || guestCount || "—"}
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
                    {modalityName && (
                      <p className={styles.summaryDesc} style={{ marginTop: 4 }}>
                        {modalityName}
                      </p>
                    )}
                    <div className={styles.activityLocation}>
                      <FaLocationDot size={13} />
                      <span>
                        {meetingPointRemark ||
                          voucherDetail?.activity?.address ||
                          "—"}
                      </span>
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
                      {modalityName && (
                        <div>
                          <span className={styles.fieldLabel}>Package</span>
                          <div className={styles.fieldValue}>{modalityName}</div>
                        </div>
                      )}
                      <div>
                        <span className={styles.fieldLabel}>
                          {meetingPointRemark ? "Meeting Point" : "Location"}
                        </span>
                        <div className={styles.fieldValue}>
                          {meetingPointRemark ||
                            voucherDetail?.activity?.address ||
                            "—"}
                        </div>
                      </div>
                      {meetingPointRemark && voucherDetail?.activity?.address && (
                        <div>
                          <span className={styles.fieldLabel}>Address</span>
                          <div className={styles.fieldValue}>
                            {voucherDetail.activity.address}
                          </div>
                        </div>
                      )}
                      <div>
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
                      {activityTime && (
                        <div>
                          <span className={styles.fieldLabel}>Start Time</span>
                          <div className={styles.fieldValue}>{activityTime}</div>
                        </div>
                      )}
                      {languageLabel && (
                        <div>
                          <span className={styles.fieldLabel}>Language</span>
                          <div className={styles.fieldValue}>{languageLabel}</div>
                        </div>
                      )}
                      <div>
                        <span className={styles.fieldLabel}>Day</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.travel_date
                            ? moment(voucherDetail.travel_date).format("dddd")
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <span className={styles.fieldLabel}>Duration</span>
                        <div className={styles.fieldValue}>
                          {activityDuration || "—"}
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

                  {contractRemarkItems.length > 0 && (
                    <div className={styles.serviceCard} style={{ marginTop: 14 }}>
                      <div className={styles.serviceCardHead}>
                        <span className={styles.serviceCardName}>
                          Activity Information
                        </span>
                      </div>
                      <div className={styles.bookingGrid} style={{ padding: 14 }}>
                        {contractRemarkItems.map((item, index) => (
                          <div key={index}>
                            <span className={styles.fieldLabel}>
                              {item.label || "Detail"}
                            </span>
                            <div className={styles.fieldValue}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                        {[voucherDetail?.lead_phone_code, voucherDetail?.lead_phone]
                          .filter(Boolean)
                          .join(" ") || "—"}
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

                {additionalInfoItems.length > 0 && (
                  <section className={styles.section}>
                    <div className={styles.sectionTitleRow}>
                      <span className={styles.sectionNum}>
                        {guestSlots.adultGuests.length > 0 ||
                        guestSlots.childGuests.length > 0
                          ? "04"
                          : "03"}
                      </span>
                      <span className={styles.sectionIcon}>
                        <FaFileInvoice size={11} />
                      </span>
                      <h3 className={styles.sectionTitle}>
                        Additional Information
                      </h3>
                    </div>
                    <div className={styles.bookingGrid}>
                      {additionalInfoItems.map((item) => (
                        <div key={item.code}>
                          <span className={styles.fieldLabel}>{item.label}</span>
                          <div className={styles.fieldValue}>{item.answer}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Cancellation */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>
                      {(guestSlots.adultGuests.length > 0 ||
                        guestSlots.childGuests.length > 0) &&
                      additionalInfoItems.length > 0
                        ? "05"
                        : guestSlots.adultGuests.length > 0 ||
                            guestSlots.childGuests.length > 0 ||
                            additionalInfoItems.length > 0
                          ? "04"
                          : "03"}
                    </span>
                    <span className={styles.sectionIcon}>
                      <IoWarningOutline size={13} />
                    </span>
                    <h3 className={styles.sectionTitle}>Cancellation Policy</h3>
                  </div>
                  <div className={styles.cancelGrid}>
                    {cancellationDisplay && (
                      <div
                        className={styles.cancelFull}
                        style={
                          cancellationDisplay.kind === "free"
                            ? {
                                background: "#eef6f2",
                                color: "#166534",
                                border: "1px solid #bbf7d0",
                              }
                            : {
                                background: "#fef2f2",
                                color: "#991b1b",
                                border: "1px solid #fecaca",
                              }
                        }
                      >
                        {cancellationDisplay.kind === "free" ? (
                          <>
                            This activity is fully refundable.
                            {cancellationDisplay.deadlineLabel ? (
                              <>
                                {" "}
                                Free cancellation before{" "}
                                <strong>
                                  {cancellationDisplay.deadlineLabel}
                                </strong>
                                .
                              </>
                            ) : null}
                          </>
                        ) : (
                          <>
                            This booking is non-refundable. No refund will be
                            issued for cancellations.
                          </>
                        )}
                      </div>
                    )}
                    {cancelCards.length === 0 && !cancellationDisplay ? (
                      <div className={styles.cancelFull}>
                        Cancellation terms apply as per activity policy.
                      </div>
                    ) : cancelCards[0]?.nonRefundable ? null : (
                      cancelCards.map((c, i) =>
                        c.nonRefundable ? null : (
                          <div key={i} className={styles.cancelCard}>
                            <span className={styles.cancelWhen}>{c.when}</span>
                            <p className={styles.cancelAmount}>{c.amount}</p>
                            <p className={styles.cancelDesc}>{c.desc}</p>
                          </div>
                        )
                      )
                    )}
                  </div>
                </section>

                {/* Special / Important */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>
                      {(guestSlots.adultGuests.length > 0 ||
                        guestSlots.childGuests.length > 0) &&
                      additionalInfoItems.length > 0
                        ? "06"
                        : guestSlots.adultGuests.length > 0 ||
                            guestSlots.childGuests.length > 0 ||
                            additionalInfoItems.length > 0
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
                    <FaPhone size={11} /> +1234567890
                  </span>
                  <span>
                    <FaEnvelope size={11} /> info@Umrahtech.com
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
