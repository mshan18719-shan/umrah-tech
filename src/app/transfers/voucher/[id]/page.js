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
  FaCar,
  FaPrint,
  FaDownload,
  FaCalendarAlt,
  FaFileInvoice,
  FaHome,
  FaUsers,
  FaHashtag,
  FaMapMarkerAlt,
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
    setErrorMessage("");
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
      if (res.success && res?.data) {
        setVoucherDetail(res.data);
      } else {
        setVoucherDetail({});
        setErrorMessage(res?.message || "Failed to load voucher details");
      }
    } catch (err) {
      console.error("Error fetching transfer details:", err);
      setVoucherDetail({});
      setErrorMessage("Failed to load voucher details");
    } finally {
      setIsLoading(false);
    }
  };

  function capitalize(text) {
    if (!text) return "";
    return String(text).charAt(0).toUpperCase() + String(text).slice(1);
  }

  function convertToCustomerCurrency(price) {
    if (!price || !voucherDetail?.pricing?.supplier_to_display_rate)
      return Number(price || 0).toFixed(2);
    if (
      voucherDetail?.pricing?.supplier_currency ===
      voucherDetail?.pricing?.display_currency
    ) {
      return Number(price).toFixed(2);
    }
    return (
      Number(price) * Number(voucherDetail?.pricing?.supplier_to_display_rate)
    ).toFixed(2);
  }

  const pickupLabel =
    voucherDetail?.exact_pickup_point ||
    voucherDetail?.booking_criteria?.pickup_location ||
    "Pickup";
  const dropoffLabel =
    voucherDetail?.exact_dropoff_point ||
    voucherDetail?.booking_criteria?.dropoff_location ||
    "Dropoff";

  const guestCount = voucherDetail?.guest_details?.length
    ? 1 + voucherDetail.guest_details.length
    : 1;

  const cancelCards = useMemo(() => {
    const policy = voucherDetail?.cancellation_policies;
    const displayCurrency =
      voucherDetail?.pricing?.display_currency ||
      voucherDetail?.pricing?.currency ||
      "";
    const topLevelCancel = String(
      voucherDetail?.cancel_policy ||
        policy?.cancel_policy ||
        policy?.cancelPolicy ||
        ""
    ).toLowerCase();

    if (!policy && !topLevelCancel) return [{ nonRefundable: true }];

    if (Array.isArray(policy)) {
      if (!policy.length) {
        return topLevelCancel === "refundable"
          ? []
          : [{ nonRefundable: true }];
      }
      return policy.slice(0, 3).map((p, idx) => {
        const from = moment(p?.from);
        return {
          when: from.isValid()
            ? `FROM ${from.format("MMM DD, YYYY").toUpperCase()}`
            : `${72 - idx * 24} HRS BEFORE`,
          amount: `${displayCurrency} ${convertToCustomerCurrency(p?.amount)}`,
          desc: "Fixed cancellation charge",
        };
      });
    }

    const cancelPolicy = String(
      policy?.cancel_policy || policy?.cancelPolicy || topLevelCancel || ""
    ).toLowerCase();

    if (
      !cancelPolicy ||
      cancelPolicy === "non-refundable" ||
      cancelPolicy === "non_refundable" ||
      cancelPolicy !== "refundable"
    ) {
      return [{ nonRefundable: true }];
    }

    const policies = policy?.policies || policy?.cancellation_policies || [];
    if (!Array.isArray(policies) || !policies.length) {
      return [];
    }

    return policies.slice(0, 3).map((p, idx) => {
      const from = moment(p?.from);
      return {
        when: from.isValid()
          ? `FROM ${from.format("MMM DD, YYYY").toUpperCase()}`
          : `${72 - idx * 24} HRS BEFORE`,
        amount: `${displayCurrency} ${convertToCustomerCurrency(p?.amount)}`,
        desc: "Fixed cancellation charge",
      };
    });
  }, [voucherDetail]);

  const paymentStatus = (voucherDetail?.payment_status || "").toLowerCase();
  const bookingStatus = (voucherDetail?.booking_status || "").toLowerCase();
  const refNo = voucherDetail?.booking_reference || id;
  const invoiceNo = voucherDetail?.invoice_number;

  const handlePrint = () => window.print();

  const isMultiTrip =
    voucherDetail?.transfer?.trip_type === "all-around" ||
    voucherDetail?.transfer?.trip_type === "all-round" ||
    voucherDetail?.transfer?.trip_type === "return";

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
                  href={`/transfers/invoice/${voucherDetail?.booking_reference}`}
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
                      Transfer Booking Voucher
                    </h2>
                    <p className={styles.summaryDesc}>
                      Present this voucher to your driver. Please be ready at
                      the pickup location at least 15 minutes before the
                      scheduled time.
                    </p>
                  </div>
                  <div className={styles.ticketCard}>
                    <div className={styles.ticketTop}>
                      <span className={styles.ticketLabel}>
                        <FaHashtag size={10} /> Booking Ref
                      </span>
                      {/* <span
                        className={`${styles.paidBadge} ${
                          paymentStatus !== "paid" &&
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
                            Booking Date
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
                              ? capitalize(bookingStatus)
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className={styles.ticketItem}>
                        <FaUsers size={12} className={styles.ticketItemIcon} />
                        <div>
                          <span className={styles.ticketItemLabel}>Pax</span>
                          <span className={styles.ticketItemValue}>
                            {guestCount} Passenger
                            {guestCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
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

                {/* Date ribbon */}
                {/* <div className={styles.dateRibbon}>
                  <div className={styles.dateSide}>
                    <span className={styles.dateSideIcon}>
                      <FaCalendarAlt size={14} />
                    </span>
                    <div>
                      <span className={styles.dateSideLabel}>Pickup Date</span>
                      <span className={styles.dateSideValue}>
                        {voucherDetail?.booking_criteria?.pickup_date
                          ? moment(
                            voucherDetail.booking_criteria.pickup_date
                          ).format("MMM DD, YYYY")
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.dateCenter}>
                    <span className={styles.dateCenterBadge}>
                      {capitalize(
                        voucherDetail?.booking_criteria?.transfer_type
                      ) || "Transfer"}
                    </span>
                    <span className={styles.dateCenterLine} />
                  </div>
                  <div className={styles.dateSide}>
                    <span className={styles.dateSideIcon}>
                      <FaCalendarAlt size={14} />
                    </span>
                    <div>
                      <span className={styles.dateSideLabel}>
                        {voucherDetail?.booking_criteria?.dropoff_date
                          ? "Dropoff Date"
                          : "Service"}
                      </span>
                      <span className={styles.dateSideValue}>
                        {voucherDetail?.booking_criteria?.dropoff_date
                          ? moment(
                            voucherDetail.booking_criteria.dropoff_date
                          ).format("MMM DD, YYYY")
                          : dropoffLabel}
                      </span>
                    </div>
                  </div>
                </div> */}

                {/* 01 Transfer Details */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>01</span>
                    <span className={styles.sectionIcon}>
                      <FaCar size={11} />
                    </span>
                    <h3 className={styles.sectionTitle}>Transfer Details</h3>
                  </div>

                  <div className={styles.typeBadges}>
                    <span className={styles.typeBadge}>
                      {capitalize(voucherDetail?.transfer?.trip_type) ||
                        "Transfer"}
                    </span>
                    {/* <span className={`${styles.typeBadge} ${styles.typeBadgeAccent}`}>
                      {capitalize(
                        voucherDetail?.booking_criteria?.transfer_type
                      ) || "Private"}
                    </span> */}
                    {voucherDetail?.booked_qty > 1 && (
                      <span className={styles.typeBadge}>
                        Qty: {voucherDetail.booked_qty}
                      </span>
                    )}
                  </div>

                  <div className={styles.serviceCard}>
                    <div className={styles.transferRoute}>
                      <div className={styles.routeBlock}>
                        <span className={styles.routeLabel}>Pickup</span>
                        <p className={styles.routePlace}>{pickupLabel}</p>
                        <p className={styles.routeWhen}>
                          {voucherDetail?.booking_criteria?.pickup_date
                            ? moment(
                              voucherDetail.booking_criteria.pickup_date
                            ).format("MMM DD, YYYY")
                            : "—"}
                          {voucherDetail?.booking_criteria?.pickup_time
                            ? ` · ${moment(voucherDetail.booking_criteria.pickup_time, "HH:mm:ss").format("hh:mm A")}`
                            : ""}
                        </p>
                      </div>
                      <div className={styles.routeBlock}>
                        <span className={styles.routeLabel}>Dropoff</span>
                        <p className={styles.routePlace}>{dropoffLabel}</p>
                        {voucherDetail?.booking_criteria?.dropoff_date && (
                          <p className={styles.routeWhen}>
                            {moment(
                              voucherDetail.booking_criteria.dropoff_date
                            ).format("MMM DD, YYYY")}
                            {voucherDetail?.booking_criteria?.dropoff_time
                              ? ` · ${moment(voucherDetail.booking_criteria.dropoff_time, "HH:mm:ss").format("hh:mm A")}`
                              : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={styles.tableWrap}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th>Vehicle</th>
                            <th>Transfer Type</th>
                            <th>Pax</th>
                            <th>Luggage</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ fontWeight: 700 }}>
                              {capitalize(voucherDetail?.transfer?.vehicle_name) ||
                                capitalize(voucherDetail?.vehicle_details?.category) ||
                                "Transfer"}{" "}
                              × {voucherDetail?.booked_qty || 1}
                            </td>
                            <td>
                              {capitalize(voucherDetail?.transfer?.trip_type) ||
                                capitalize(
                                  voucherDetail?.booking_criteria?.transfer_type
                                ) ||
                                "—"}
                            </td>
                            <td>
                              {voucherDetail?.vehicle_details
                                ?.passenger_capacity || "—"}
                            </td>
                            <td>
                              {voucherDetail?.vehicle_details
                                ?.luggage_capacity || "—"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className={styles.bookingGrid} style={{ marginTop: 12 }}>
                      <div>
                        <span className={styles.fieldLabel}>Exact Pickup</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.exact_pickup_point ||
                            voucherDetail?.booking_criteria?.pickup_location ||
                            "—"}
                        </div>
                      </div>
                      <div>
                        <span className={styles.fieldLabel}>Exact Dropoff</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.exact_dropoff_point ||
                            voucherDetail?.booking_criteria?.dropoff_location ||
                            "—"}
                        </div>
                      </div>
                      <div>
                        <span className={styles.fieldLabel}>Category</span>
                        <div className={styles.fieldValue}>
                          {capitalize(voucherDetail?.vehicle_details?.category) ||
                            "—"}
                        </div>
                      </div>
                    </div>
                    {(voucherDetail?.flight_number ||
                      voucherDetail?.special_request) && (
                        <p className={styles.policyNote}>
                          {voucherDetail?.flight_number && (
                            <>
                              Flight: <strong>{voucherDetail.flight_number}</strong>
                            </>
                          )}
                          {voucherDetail?.flight_number &&
                            voucherDetail?.special_request &&
                            " · "}
                          {voucherDetail?.special_request && (
                            <>
                              Special request: {voucherDetail.special_request}
                            </>
                          )}
                        </p>
                      )}
                  </div>

                  {isMultiTrip && voucherDetail?.transfer?.locations?.length > 0 && (
                    <div className={styles.serviceCard}>
                      <div className={styles.serviceCardHead}>
                        <span className={styles.serviceCardName}>
                          Multiple Locations
                        </span>
                      </div>
                      <div className={styles.tableWrap}>
                        <table className={styles.dataTable}>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Pickup</th>
                              <th>Dropoff</th>
                            </tr>
                          </thead>
                          <tbody>
                            {voucherDetail.transfer.locations.map(
                              (loc, index) => (
                                <tr key={index}>
                                  <td className={styles.srCell}>{index + 1}</td>
                                  <td>{loc.pickup_address}</td>
                                  <td>{loc.dropoff_address}</td>
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
                        {voucherDetail?.lead_passenger?.title}{" "}
                        {voucherDetail?.lead_passenger?.first_name}{" "}
                        {voucherDetail?.lead_passenger?.last_name}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Email</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.lead_passenger?.email || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Phone</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.lead_passenger?.phone_number || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Gender</span>
                      <div className={styles.fieldValue}>
                        {capitalize(voucherDetail?.lead_passenger?.gender) ||
                          "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Country</span>
                      <div className={styles.fieldValue}>
                        {voucherDetail?.lead_passenger?.country || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Pickup Point</span>
                      <div className={styles.fieldValue}>{pickupLabel}</div>
                    </div>
                  </div>
                </section>

                {/* 03 Cancellation */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>03</span>
                    <span className={styles.sectionIcon}>
                      <IoWarningOutline size={13} />
                    </span>
                    <h3 className={styles.sectionTitle}>Cancellation Policy</h3>
                  </div>
                  <div className={styles.cancelGrid}>
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

                {/* 04 */}
                <section className={styles.section}>
                  <div className={styles.sectionTitleRow}>
                    <span className={styles.sectionNum}>04</span>
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
                        Please be at the pickup location at least 15 minutes
                        before the scheduled pickup time.
                      </li>
                      <li>
                        <span className={styles.infoCheck}>
                          <FaCheckCircle size={10} />
                        </span>
                        The driver will wait for a maximum of 30 minutes from
                        the scheduled pickup time.
                      </li>
                      <li>
                        <span className={styles.infoCheck}>
                          <FaCheckCircle size={10} />
                        </span>
                        This voucher must be presented to the driver on the day
                        of travel.
                      </li>
                      <li>
                        <span className={styles.infoCheck}>
                          <FaCheckCircle size={10} />
                        </span>
                        Luggage allowance is subject to the vehicle capacity
                        confirmed at booking.
                      </li>
                      <li>
                        <span className={styles.infoCheck}>
                          <FaCheckCircle size={10} />
                        </span>
                        This voucher is valid only for the specified travel
                        date, passenger(s), and vehicle.
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
