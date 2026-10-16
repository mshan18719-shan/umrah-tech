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
    const lookupId = id != null ? String(id).trim() : "";
    if (!lookupId || lookupId === "null" || lookupId === "undefined") {
      setVoucherDetail({});
      setErrorMessage("Booking not found");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      // API accepts invoice_number or booking_reference (Stripe success uses invoice_number)
      const responses = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/transfers/booking/details`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_reference: lookupId,
            invoice_number: lookupId,
          }),
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

  const formatClock = (time) => {
    if (!time) return "";
    const parsed = moment(time, ["HH:mm:ss", "HH:mm"], true);
    return parsed.isValid() ? parsed.format("hh:mm A") : String(time);
  };

  const rawTransfer =
    voucherDetail?.selected_transfers ?? voucherDetail?.transfer ?? {};
  const transfer = Array.isArray(rawTransfer)
    ? rawTransfer[0] || {}
    : rawTransfer || {};
  const criteria = voucherDetail?.booking_criteria || {};
  const vehicle =
    voucherDetail?.vehicle_details || transfer?.vehicle_details || {};
  const vehicleCategory =
    voucherDetail?.vehiclecategory || voucherDetail?.vehicle_category || {};
  const pax = transfer?.paxes_distribution || {};
  const lead = voucherDetail?.lead_passenger || {};
  const isCustom =
    String(transfer?.provider || voucherDetail?.provider || "").toLowerCase() ===
      "custom" ||
    String(transfer?.transfer_type_code || "").toUpperCase() === "CUSTOM";

  const selectedExtras = (() => {
    const fromSelectedTransfers = Array.isArray(voucherDetail?.selected_transfers)
      ? voucherDetail.selected_transfers.flatMap((t) =>
          Array.isArray(t?.selected_extras) ? t.selected_extras : []
        )
      : [];
    const candidates = [
      voucherDetail?.selected_extras,
      transfer?.selected_extras,
      fromSelectedTransfers,
      voucherDetail?.additional_services,
      transfer?.additional_services,
      voucherDetail?.extras,
    ];
    for (const list of candidates) {
      if (Array.isArray(list) && list.length) return list;
    }
    return [];
  })();

  const pickupLabel =
    voucherDetail?.exact_pickup_point ||
    criteria?.pickup_location ||
    transfer?.from?.description ||
    "Pickup";
  const dropoffLabel =
    voucherDetail?.exact_dropoff_point ||
    criteria?.dropoff_location ||
    transfer?.to?.description ||
    "Dropoff";

  const pickupDate = criteria?.pickup_date || transfer?.pickup_date;
  const pickupTime = criteria?.pickup_time || transfer?.pickup_time;
  const dropoffDate = criteria?.dropoff_date || transfer?.dropoff_date;
  const dropoffTime = criteria?.dropoff_time || transfer?.dropoff_time;

  const tripType = transfer?.trip_type || criteria?.transfer_type || "";
  const vehicleName =
    vehicle?.name ||
    transfer?.vehicle_name ||
    transfer?.vehicle?.name ||
    vehicleCategory?.name ||
    vehicle?.category ||
    "";
  const vehicleCategoryName =
    vehicleCategory?.name ||
    transfer?.vehicle_category ||
    transfer?.vehicle?.category_name ||
    vehicle?.category ||
    "";
  const passengerCapacity =
    vehicle?.passenger_capacity ??
    vehicle?.max_pax ??
    vehicleCategory?.max_capacity ??
    transfer?.service_information?.find((s) => s?.id === "MAXPAX")?.value ??
    "—";
  const luggageCapacity =
    vehicle?.luggage_capacity ??
    vehicleCategory?.luguage_capacity ??
    vehicleCategory?.luggage_capacity ??
    transfer?.service_information?.find((s) => s?.id === "LUGGAGE")?.value ??
    "—";

  const guestCount =
    pax?.total ||
    criteria?.passengers ||
    (voucherDetail?.guest_details?.length
      ? 1 + voucherDetail.guest_details.length
      : 1);

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
  const documentLinkId =
    voucherDetail?.invoice_number ||
    voucherDetail?.booking_reference ||
    (id && String(id) !== "null" ? id : null);

  const handlePrint = () => window.print();

  const isMultiTrip =
    tripType === "all-around" ||
    tripType === "all-round" ||
    tripType === "return";

  const displayCurrency =
    voucherDetail?.pricing?.display_currency ||
    voucherDetail?.pricing?.customer_currency ||
    voucherDetail?.pricing?.currency ||
    transfer?.currency ||
    "";

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
                  href={`/transfers/invoice/${documentLinkId || id}`}
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
                            {voucherDetail?.created_at ||
                            voucherDetail?.voucher?.creation_date
                              ? moment(
                                  voucherDetail?.created_at ||
                                    voucherDetail?.voucher?.creation_date
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
                          <span className={styles.ticketItemLabel}>Pax</span>
                          <span className={styles.ticketItemValue}>
                            {guestCount} Passenger
                            {Number(guestCount) !== 1 ? "s" : ""}
                            {(pax?.adults != null ||
                              pax?.children != null ||
                              pax?.infants != null) && (
                              <span style={{ display: "block", fontWeight: 500, color: "#6b7280", fontSize: 11 }}>
                                {Number(pax.adults || 0)} Adult
                                {Number(pax.adults || 0) !== 1 ? "s" : ""}
                                {Number(pax.children || 0) > 0
                                  ? `, ${pax.children} Child${
                                      Number(pax.children) !== 1 ? "ren" : ""
                                    }`
                                  : ""}
                                {Number(pax.infants || 0) > 0
                                  ? `, ${pax.infants} Infant${
                                      Number(pax.infants) !== 1 ? "s" : ""
                                    }`
                                  : ""}
                              </span>
                            )}
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
                      {capitalize(tripType) || "Transfer"}
                    </span>
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
                          {pickupDate
                            ? moment(pickupDate).format("MMM DD, YYYY")
                            : "—"}
                          {pickupTime ? ` · ${formatClock(pickupTime)}` : ""}
                        </p>
                      </div>
                      <div className={styles.routeBlock}>
                        <span className={styles.routeLabel}>Dropoff</span>
                        <p className={styles.routePlace}>{dropoffLabel}</p>
                        {dropoffDate && (
                          <p className={styles.routeWhen}>
                            {moment(dropoffDate).format("MMM DD, YYYY")}
                            {dropoffTime ? ` · ${formatClock(dropoffTime)}` : ""}
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
                              {capitalize(vehicleName) ||
                                capitalize(vehicleCategoryName) ||
                                "Transfer"}{" "}
                              × {voucherDetail?.booked_qty || 1}
                            </td>
                            <td>{capitalize(tripType) || "—"}</td>
                            <td>{passengerCapacity}</td>
                            <td>{luggageCapacity}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {(isCustom && vehicle?.transmission_type) ||
                    vehicle?.vehicle_description ? (
                      <p className={styles.policyNote} style={{ marginTop: 10 }}>
                        {isCustom && vehicle?.transmission_type ? (
                          <>
                            Transmission:{" "}
                            <strong>{vehicle.transmission_type}</strong>
                          </>
                        ) : null}
                        {isCustom &&
                        vehicle?.transmission_type &&
                        vehicle?.vehicle_description
                          ? " · "
                          : null}
                        {vehicle?.vehicle_description || null}
                      </p>
                    ) : null}
                    <div className={styles.bookingGrid} style={{ marginTop: 12 }}>
                      <div>
                        <span className={styles.fieldLabel}>Exact Pickup</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.exact_pickup_point ||
                            criteria?.pickup_location ||
                            "—"}
                        </div>
                      </div>
                      <div>
                        <span className={styles.fieldLabel}>Exact Dropoff</span>
                        <div className={styles.fieldValue}>
                          {voucherDetail?.exact_dropoff_point ||
                            criteria?.dropoff_location ||
                            "—"}
                        </div>
                      </div>
                      <div>
                        <span className={styles.fieldLabel}>Category</span>
                        <div className={styles.fieldValue}>
                          {capitalize(vehicleCategoryName) || "—"}
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

                  {selectedExtras.length > 0 && (
                    <div className={styles.serviceCard} style={{ marginTop: 14 }}>
                      <div className={styles.serviceCardHead}>
                        <span className={styles.serviceCardName}>
                          Extra Services
                        </span>
                      </div>
                      <div className={styles.additionalServicesBody}>
                        <div className={styles.serviceCardGrid}>
                          {selectedExtras.map((extra, index) => {
                            const metaParts = [
                              extra?.weight_kg,
                              extra?.age,
                            ].filter(Boolean);
                            const amount = Number(extra?.amount || 0);
                            return (
                              <div
                                key={extra?.code || index}
                                className={styles.ancillaryServiceCard}
                              >
                                {amount > 0 ? (
                                  <span className={styles.ancillaryServicePrice}>
                                    {displayCurrency}{" "}
                                    {convertToCustomerCurrency(amount)}
                                  </span>
                                ) : null}
                                <p className={styles.ancillaryServiceName}>
                                  {extra?.name ||
                                    extra?.type ||
                                    "Extra service"}
                                </p>
                                {metaParts.length > 0 ? (
                                  <p className={styles.ancillaryServiceMeta}>
                                    {metaParts.join(" · ")}
                                  </p>
                                ) : extra?.type &&
                                  extra?.name &&
                                  extra.type !== extra.name ? (
                                  <p className={styles.ancillaryServiceMeta}>
                                    {extra.type}
                                  </p>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {isMultiTrip && transfer?.locations?.length > 0 && (
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
                            {transfer.locations.map((loc, index) => (
                              <tr key={index}>
                                <td className={styles.srCell}>{index + 1}</td>
                                <td>
                                  {loc.pickup_address || loc.pickup || "—"}
                                </td>
                                <td>
                                  {loc.dropoff_address || loc.dropoff || "—"}
                                </td>
                              </tr>
                            ))}
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
                        {lead?.title} {lead?.first_name} {lead?.last_name}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Email</span>
                      <div className={styles.fieldValue}>
                        {lead?.email || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Phone</span>
                      <div className={styles.fieldValue}>
                        {lead?.phone_number || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Gender</span>
                      <div className={styles.fieldValue}>
                        {capitalize(lead?.gender) || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Country</span>
                      <div className={styles.fieldValue}>
                        {lead?.country || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={styles.fieldLabel}>Pickup Point</span>
                      <div className={styles.fieldValue}>{pickupLabel}</div>
                    </div>
                    {lead?.address ? (
                      <div>
                        <span className={styles.fieldLabel}>Address</span>
                        <div className={styles.fieldValue}>{lead.address}</div>
                      </div>
                    ) : null}
                  </div>

                  {voucherDetail?.guest_details?.length > 0 && (
                    <div className={styles.serviceCard} style={{ marginTop: 14 }}>
                      <div className={styles.serviceCardHead}>
                        <span className={styles.serviceCardName}>
                          Additional Passengers
                        </span>
                      </div>
                      <div className={styles.tableWrap}>
                        <table className={styles.dataTable}>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Name</th>
                              <th>Gender</th>
                              <th>Contact</th>
                            </tr>
                          </thead>
                          <tbody>
                            {voucherDetail.guest_details.map((guest, index) => (
                              <tr key={index}>
                                <td className={styles.srCell}>{index + 2}</td>
                                <td style={{ fontWeight: 600 }}>
                                  {guest.title ? `${guest.title} ` : ""}
                                  {guest.first_name} {guest.last_name}
                                </td>
                                <td>{capitalize(guest.gender) || "—"}</td>
                                <td>
                                  {[
                                    guest.email,
                                    guest.phone_number || guest.phone,
                                    guest.country,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
                        Additional stops or route changes may incur extra
                        charges.
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
