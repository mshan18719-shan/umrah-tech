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

  const handlePrint = () => window.print();

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

  const currency =
    voucherDetail?.customer_currency ||
    voucherDetail?.currency_code ||
    voucherDetail?.currency_symbol ||
    voucherDetail?.currency ||
    voucherDetail?.client_currency ||
    "";
  const grandTotal = Number(
    voucherDetail?.customer_total ?? voucherDetail?.grand_total ?? 0
  );
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
    if (startTimeFromModality) return startTimeFromModality;
    const openTime =
      voucherDetail?.activity?.open_hours?.[
        moment(voucherDetail?.travel_date).format("dddd").toLowerCase()
      ]?.open;
    return openTime ? moment(openTime, "HH:mm").format("hh:mm A") : "";
  })();

  const activityDuration =
    voucherDetail?.activity?.activity_duration || durationRemark || "";

  const cancelCards = useMemo(() => {
    const policy = getCancellationPolicy();
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
      return policies.map((p) => {
        const fromRaw = p?.from || p?.dateFrom;
        const from = fromRaw ? moment(fromRaw) : null;
        const when = from?.isValid()
          ? `FROM ${from.format("MMM DD, YYYY").toUpperCase()}`
          : p?.time_duration != null
            ? `${p.time_duration} HOURS BEFORE`
            : "CANCELLATION";
        const amountValue =
          p?.amount ?? p?.value ?? p?.fee ?? 0;
        const amount =
          p?.type === "percentage"
            ? `${p.value}%`
            : `${currency} ${convertToCustomerCurrency(amountValue)}`;
        return {
          when,
          amount,
          desc:
            p?.type === "percentage"
              ? "Of total booking value"
              : "Fixed cancellation charge",
        };
      });
    }

    if (cancelPolicy === "refundable") return [];
    return [{ nonRefundable: true }];
  }, [voucherDetail, currency]);

  const priceRows = useMemo(() => {
    const formatMoney = (price) => convertToCustomerCurrency(price);
    const title = voucherDetail?.activity?.title || "Activity";
    const rows = [];
    const adults = Number(voucherDetail?.adults || 0);
    if (adults > 0) {
      rows.push({
        description: `Activity — ${title} (Adult)`,
        qty: adults,
        rate: formatMoney(voucherDetail?.activity?.sale_price),
        total: formatMoney(voucherDetail?.adult_price),
      });
    }

    const childUnit = Number(voucherDetail?.activity?.child_sale_price || 0);
    const childPriceField = Number(voucherDetail?.child_price || 0);
    if (childrenAgeSummary.length > 0) {
      childrenAgeSummary.forEach((band) => {
        const qty = Number(band.count || 0);
        if (qty <= 0) return;
        const bandTotal =
          childrenAgeSummary.length === 1 && childPriceField > 0
            ? childPriceField
            : childUnit * qty;
        rows.push({
          description: `Activity — ${title} (${band.label})`,
          qty,
          rate: formatMoney(childUnit || (qty ? bandTotal / qty : 0)),
          total: formatMoney(bandTotal),
        });
      });
    } else if (Number(voucherDetail?.children) > 0) {
      const childQty = Number(voucherDetail?.children || 0);
      const childTotal =
        childPriceField > 0 &&
        childUnit > 0 &&
        childPriceField === childUnit
          ? childUnit * childQty
          : childPriceField || childUnit * childQty;
      rows.push({
        description: `Activity — ${title} (Child)`,
        qty: childQty,
        rate: formatMoney(childUnit || (childQty ? childTotal / childQty : 0)),
        total: formatMoney(childTotal),
      });
    }

    (voucherDetail?.additional_services || []).forEach((item) => {
      rows.push({
        description: item.name,
        qty: item.quantity,
        rate: formatMoney(item?.price),
        total: formatMoney(item?.total),
      });
    });
    return rows;
  }, [voucherDetail, childrenAgeSummary]);

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
                    {voucherDetail?.provider_reference && (
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Provider ref</span>
                        <span className={styles.metaValue}>
                          {voucherDetail.provider_reference}
                        </span>
                      </div>
                    )}
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
                          {[voucherDetail?.lead_phone_code, voucherDetail?.lead_phone]
                            .filter(Boolean)
                            .join(" ") || "—"}
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
                      {modalityName && (
                        <div className={styles.field}>
                          <span className={styles.fieldLabel}>Package</span>
                          <div className={styles.fieldValue}>{modalityName}</div>
                        </div>
                      )}
                      <div className={styles.field}>
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
                        <div className={styles.field}>
                          <span className={styles.fieldLabel}>Address</span>
                          <div className={styles.fieldValue}>
                            {voucherDetail.activity.address}
                          </div>
                        </div>
                      )}
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
                      {activityTime && (
                        <div className={styles.field}>
                          <span className={styles.fieldLabel}>Start Time</span>
                          <div className={styles.fieldValue}>{activityTime}</div>
                        </div>
                      )}
                      {languageLabel && (
                        <div className={styles.field}>
                          <span className={styles.fieldLabel}>Language</span>
                          <div className={styles.fieldValue}>{languageLabel}</div>
                        </div>
                      )}
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Day</span>
                        <div className={styles.fieldValue}>{travelDay}</div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Duration</span>
                        <div className={styles.fieldValue}>
                          {activityDuration || "—"}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Adults</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.adults || 0}
                        </div>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Children</span>
                        <div className={styles.fieldValue}>
                          {childrenAgeSummary.length > 0
                            ? childrenAgeSummary
                                .map((b) => `${b.count} ${b.label}`)
                                .join(", ")
                            : voucherDetail?.children || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {contractRemarkItems.length > 0 && (
                  <section className={styles.section}>
                    <div className={styles.sectionHead}>
                      <div className={styles.sectionHeadLeft}>
                        <span className={styles.sectionIcon}>
                          <FaInfoCircle size={11} />
                        </span>
                        <h3 className={styles.sectionTitle}>
                          Activity Information
                        </h3>
                      </div>
                    </div>
                    <div className={styles.card}>
                      <div className={styles.fieldGrid}>
                        {contractRemarkItems.map((item, index) => (
                          <div key={index} className={styles.field}>
                            <span className={styles.fieldLabel}>
                              {item.label || "Detail"}
                            </span>
                            <div className={styles.fieldValue}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* Guests — pad slots to match booked counts */}
                {(guestSlots.adultGuests.length > 0 ||
                  guestSlots.childGuests.length > 0) && (
                    <section className={styles.section}>
                      <div className={styles.sectionHead}>
                        <div className={styles.sectionHeadLeft}>
                          <span className={styles.sectionIcon}>
                            <FaUser size={11} />
                          </span>
                          <h3 className={styles.sectionTitle}>Guests</h3>
                        </div>
                        <span className={styles.sectionRight}>
                          {getTotalPassengers()}
                        </span>
                      </div>
                      <div className={styles.card}>
                        <div className={styles.fieldGrid}>
                          {guestSlots.adultGuests.map((guest) => (
                            <div key={guest.key} className={styles.field}>
                              <span className={styles.fieldLabel}>
                                {guest.label}
                              </span>
                              <div className={styles.fieldValue}>
                                {guest.value}
                              </div>
                            </div>
                          ))}
                          {guestSlots.childGuests.map((guest) => (
                            <div key={guest.key} className={styles.field}>
                              <span className={styles.fieldLabel}>
                                {guest.label}
                              </span>
                              <div className={styles.fieldValue}>
                                {guest.value}
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
                    <div className={styles.grandTotal}>
                      <span>GRAND TOTAL</span>
                      <strong>
                        {currency} {Number(grandTotal).toFixed(2)}
                      </strong>
                    </div>
                    <p className={styles.taxNote}>VAT and Taxes included</p>
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
