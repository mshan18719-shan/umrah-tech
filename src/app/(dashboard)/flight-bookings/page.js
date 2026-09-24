"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Menu, Pagination } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import "@mantine/dates/styles.css";
import {
  FaPlane,
  FaEye,
  FaDownload,
  FaUsers,
  FaCheckCircle,
  FaChevronDown,
  FaSearch,
} from "react-icons/fa";
import { FiFileText, FiCalendar } from "react-icons/fi";
import moment from "moment";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CancelBookingModal from "@/dashboard_components/CancelBookingModal/CancelBookingModal";
import { groupSegments } from "@/components/Flights/Checkout/flightHelpers";

const statusLabel = (status) => {
  const st = (status || "").toLowerCase();
  if (!st) return "UNKNOWN";
  return st.toUpperCase();
};

const statusTone = (status) => {
  const st = (status || "").toLowerCase();
  if (st === "confirmed" || st === "paid") return "confirmed";
  if (st === "cancelled") return "cancelled";
  if (st === "tentative" || st === "pending") return "pending";
  return "default";
};

function getEndpointCode(endpoint) {
  if (!endpoint) return "";
  if (typeof endpoint === "string") return endpoint.toUpperCase();
  return (
    endpoint?.airport_code ||
    endpoint?.iata_code ||
    endpoint?.code ||
    ""
  )
    .toString()
    .toUpperCase();
}

function getRouteTitle(booking) {
  const segments = booking?.segments || [];
  const flightLike = {
    trip_type: booking?.flight_details?.trip_type || booking?.trip_type,
    segments,
    search_criteria:
      booking?.search_criteria ||
      booking?.flight_details?.search_criteria ||
      {},
  };

  const groups = groupSegments(flightLike).filter((g) => g?.segments?.length);
  if (groups.length > 1) {
    return groups
      .map((group) => {
        const first = group.segments[0];
        const last = group.segments[group.segments.length - 1];
        const from =
          getEndpointCode(first?.departure) ||
          getEndpointCode(first?.origin) ||
          getEndpointCode(first?.departure_code) ||
          "—";
        const to =
          getEndpointCode(last?.arrival) ||
          getEndpointCode(last?.destination) ||
          getEndpointCode(last?.arrival_code) ||
          "—";
        return `${from} to ${to}`;
      })
      .join(" / ");
  }

  if (segments.length) {
    const first = segments[0];
    const last = segments[segments.length - 1];
    const from =
      getEndpointCode(first?.departure) ||
      getEndpointCode(first?.departure_code) ||
      booking?.flight_details?.departure_code ||
      "—";
    const to =
      getEndpointCode(last?.arrival) ||
      getEndpointCode(last?.arrival_code) ||
      booking?.flight_details?.arrival_code ||
      "—";
    return `${from} to ${to}`;
  }

  const dep = booking?.flight_details?.departure_code || "—";
  const arr = booking?.flight_details?.arrival_code || "—";
  return `${dep} to ${arr}`;
}

function canCancelFlightBooking(booking) {
  const departureDate =
    booking?.flight_details?.departure_date ||
    booking?.departure_date ||
    booking?.booking_criteria?.departure_date ||
    booking?.segments?.[0]?.departure_date ||
    null;

  return (
    booking?.booking_status?.toLowerCase() === "confirmed" &&
    booking?.payment_status?.toLowerCase() === "paid" &&
    departureDate &&
    moment(departureDate).isValid() &&
    moment(departureDate).isAfter(moment(), "day")
  );
}

function getFlightDateValue(booking) {
  return (
    booking?.flight_details?.departure_date ||
    booking?.departure_date ||
    booking?.booking_criteria?.departure_date ||
    booking?.segments?.[0]?.departure_date ||
    null
  );
}

function toMomentDate(value) {
  if (!value) return null;
  if (moment.isMoment(value) && value.isValid()) return value;
  if (typeof value?.toDate === "function") {
    const fromDayjs = moment(value.toDate());
    if (fromDayjs.isValid()) return fromDayjs;
  }
  if (value instanceof Date) {
    const fromDate = moment(value);
    return fromDate.isValid() ? fromDate : null;
  }
  const parsed = moment(value);
  return parsed.isValid() ? parsed : null;
}

function formatFilterDate(value) {
  const m = toMomentDate(value);
  return m ? m.format("MMM DD, YYYY") : null;
}

function formatTripTypeLabel(tripType) {
  const t = String(tripType || "")
    .toLowerCase()
    .replace(/[_\s-]+/g, "");
  if (t === "oneway") return "One Way";
  if (t === "return" || t === "roundtrip") return "Return";
  if (t === "multicity") return "Multi City";
  if (!tripType || tripType === "—") return "—";
  return String(tripType)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FlightBookingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cancelModal, setCancelModal] = useState({
    opened: false,
    bookingReference: "",
    provider: "",
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [activePage, setActivePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [dateMenuOpened, setDateMenuOpened] = useState(false);
  const PAGE_SIZE = 10;

  const userName = session?.user?.name || "";
  const userInitial = userName?.charAt(0)?.toUpperCase() || "U";

  async function fetchBookings() {
    const email = session?.user?.email;
    const otp = session?.user?.otp;
    if (!email || !otp) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/flight/bookings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            email: String(email).trim().toLowerCase(),
            otp,
          }),
        }
      );
      const data = await response.json();
      if (!data?.success && data?.message?.toLowerCase().includes("otp")) {
        router.push("/login");
        return;
      }
      setBookings(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!session?.user?.email || !session?.user?.otp) return;
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email, session?.user?.otp]);

  const tabCounts = useMemo(() => {
    const all = bookings.length;
    const active = bookings.filter((b) =>
      ["confirmed", "paid"].includes(b?.booking_status?.toLowerCase())
    ).length;
    const pending = bookings.filter((b) =>
      ["pending", "tentative", "failed"].includes(b?.booking_status?.toLowerCase())
    ).length;
    const cancelled = bookings.filter(
      (b) => b?.booking_status?.toLowerCase() === "cancelled"
    ).length;
    return { all, active, pending, cancelled };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const st = booking?.booking_status?.toLowerCase() || "";

      if (activeTab === "active" && !["confirmed", "paid"].includes(st))
        return false;
      if (
        activeTab === "pending" &&
        !["pending", "tentative", "failed"].includes(st)
      )
        return false;
      if (activeTab === "cancelled" && st !== "cancelled") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const lead = booking?.passenger_details?.[0];
        const haystack = [
          booking?.booking_reference,
          lead?.firstName,
          lead?.lastName,
          booking?.flight_details?.airline_name,
          booking?.flight_details?.airline,
          booking?.flight_details?.departure_code,
          booking?.flight_details?.arrival_code,
          booking?.email,
          booking?.customer_email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (dateRange[0] || dateRange[1]) {
        const departureDateRaw = getFlightDateValue(booking);
        const departureMoment = toMomentDate(departureDateRaw);
        if (!departureMoment) return false;
        const rangeStart = toMomentDate(dateRange[0]);
        const rangeEnd = toMomentDate(dateRange[1]);
        if (rangeStart && departureMoment.isBefore(rangeStart, "day"))
          return false;
        if (rangeEnd && departureMoment.isAfter(rangeEnd, "day"))
          return false;
      }

      return true;
    });
  }, [bookings, activeTab, searchQuery, dateRange]);

  useEffect(() => {
    setActivePage(1);
  }, [activeTab, searchQuery, dateRange]);

  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE) || 1;
  const paginatedBookings = filteredBookings.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE
  );

  const hasDateFilter = Boolean(dateRange[0] || dateRange[1]);
  const dateButtonLabel = hasDateFilter
    ? `${formatFilterDate(dateRange[0]) || "Any"} - ${
        formatFilterDate(dateRange[1]) || "Any"
      }`
    : "Departure Date Range";

  return (
    <div className="hb-page">
      <CancelBookingModal
        opened={cancelModal.opened}
        onClose={() =>
          setCancelModal({ opened: false, bookingReference: "", provider: "" })
        }
        bookingReference={cancelModal.bookingReference}
        provider={cancelModal.provider}
        type="flight"
        endPoint="/api/flights/booking/cancel"
        onSuccess={() => fetchBookings()}
      />

      <div className="dash-topbar">
        <div>
          <h4 className="dash-topbar-title">Flight Bookings</h4>
          <p className="dash-topbar-sub">
            Welcome back{userName ? `, ${userName}` : ""}!
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="dash-topbar-avatar">{userInitial}</div>
          {/* <FaChevronDown size={11} style={{ color: "#8a8f98" }} /> */}
        </div>
      </div>

      <section className="hb-details-panel">
        <div className="hb-details-panel-header">
          <h5 className="hb-details-title">Bookings Details</h5>

          <div className="hb-filter-bar">
            <div className="hb-search">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by name, reference or activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Menu
              opened={dateMenuOpened}
              onChange={setDateMenuOpened}
              position="bottom-end"
              shadow="md"
            >
              <Menu.Target>
                <button
                  type="button"
                  className={`hb-date-btn${hasDateFilter ? " hb-date-btn-active" : ""}`}
                  onClick={() => setDateMenuOpened((o) => !o)}
                >
                  <FiCalendar size={13} />
                  {dateButtonLabel}
                  <FaChevronDown size={9} />
                </button>
              </Menu.Target>
              <Menu.Dropdown>
                <div style={{ padding: "10px 12px" }}>
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#1B3B6F",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Filter by departure date
                  </p>
                  <DatePicker
                    type="range"
                    value={dateRange}
                    onChange={setDateRange}
                    numberOfColumns={2}
                    allowSingleDateInRange
                  />
                </div>
                {hasDateFilter && (
                  <div className="hb-date-clear-wrapper">
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: "0.8rem",
                        color: "#5b6577",
                        textAlign: "center",
                      }}
                    >
                      Selected: {dateButtonLabel}
                    </p>
                    <button
                      type="button"
                      className="hb-date-clear-btn"
                      onClick={() => setDateRange([null, null])}
                    >
                      Clear Dates
                    </button>
                  </div>
                )}
              </Menu.Dropdown>
            </Menu>

            <span className="hb-results-count">
              {filteredBookings.length} of {bookings.length} results
            </span>
          </div>
        </div>

        <div className="hb-tabs">
          <button
            type="button"
            className={`hb-tab ${activeTab === "all" ? "hb-tab-active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Bookings ({tabCounts.all})
          </button>
          <button
            type="button"
            className={`hb-tab ${activeTab === "active" ? "hb-tab-active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Confirm Bookings ({tabCounts.active})
          </button>
          <button
            type="button"
            className={`hb-tab ${activeTab === "pending" ? "hb-tab-active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Bookings ({tabCounts.pending})
          </button>
          <button
            type="button"
            className={`hb-tab ${activeTab === "cancelled" ? "hb-tab-active" : ""}`}
            onClick={() => setActiveTab("cancelled")}
          >
            Cancelled Bookings ({tabCounts.cancelled})
          </button>
        </div>

        <div className="hb-cards">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="hb-card hb-card-skeleton">
                <div className="hb-skeleton-line hb-skeleton-lg" />
                <div className="hb-skeleton-line" />
                <div className="hb-skeleton-line hb-skeleton-md" />
              </div>
            ))
          ) : paginatedBookings.length === 0 ? (
            <div className="hb-empty">No bookings found for this filter.</div>
          ) : (
            paginatedBookings.map((booking, index) => {
              const st = booking?.booking_status?.toLowerCase();
              const tone = statusTone(st);
              const routeTitle = getRouteTitle(booking);
              const passengers = Array.isArray(booking?.passenger_details)
                ? booking.passenger_details.length
                : null;
              const lead = booking?.passenger_details?.[0];
              const tripType = formatTripTypeLabel(
                booking?.flight_details?.trip_type
              );
              const dateValue = booking?.flight_details?.departure_date
                ? moment(booking.flight_details.departure_date).format(
                  "MMM DD, YYYY"
                )
                : moment(booking?.created_at).format("MMM DD, YYYY");
              const canCancel = canCancelFlightBooking(booking);

              return (
                <article
                  key={booking?.booking_reference || index}
                  className="hb-card"
                >
                  <div className="hb-card-top">
                    <div className="hb-card-top-left">
                      <div className="hb-hotel-icon">
                        <FaPlane size={16} />
                      </div>
                      <div>
                        <h6 className="hb-hotel-name">{routeTitle}</h6>
                      </div>
                    </div>
                    <div className={`hb-status hb-status-${tone}`}>
                      {tone === "confirmed" && <FaCheckCircle size={14} />}
                      <span>{statusLabel(st)}</span>
                    </div>
                  </div>

                  <div className="hb-card-meta hb-card-meta-4">
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <FiFileText />
                      </span>
                      <div>
                        <span className="hb-meta-label">Booking ID</span>
                        <strong>{booking?.booking_reference || "—"}</strong>
                      </div>
                    </div>
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <FiCalendar />
                      </span>
                      <div>
                        <span className="hb-meta-label">Departure Date</span>
                        <strong>{dateValue}</strong>
                      </div>
                    </div>
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <FaUsers />
                      </span>
                      <div>
                        <span className="hb-meta-label">Pax</span>
                        <strong>
                          {passengers
                            ? `${lead?.firstName || "Guest"} ${lead?.lastName || ""
                              }`.trim()
                            : `${lead?.firstName || "Guest"} ${lead?.lastName || ""
                              }`.trim()}
                        </strong>
                      </div>
                    </div>
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <FaPlane />
                      </span>
                      <div>
                        <span className="hb-meta-label">Trip Type</span>
                        <strong>{tripType}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="hb-card-footer">
                    <div>
                      <span className="hb-amount-label">Total Amount</span>
                      <div className="hb-amount">
                        {booking?.pricing?.display_currency || ""}{" "}
                        {booking?.pricing?.amount ?? "-"}
                      </div>
                      <div className={`hb-status hb-status-${tone}`}>
                        Payment:{" "}
                        {booking?.payment_status
                          ? String(booking.payment_status).charAt(0).toUpperCase() +
                          String(booking.payment_status).slice(1)
                          : "-"}
                      </div>
                    </div>

                    <div className="hb-card-actions">
                      <Link
                        href={`/flights/voucher/${booking?.booking_reference}`}
                        target="_blank"
                        className="hb-btn hb-btn-light"
                      >
                        <FaEye size={13} />
                        Voucher
                      </Link>
                      <Link
                        href={`/flights/invoice/${booking?.booking_reference}`}
                        target="_blank"
                        className="hb-btn hb-btn-primary"
                      >
                        <FaDownload size={13} />
                        Invoice
                      </Link>
                      {canCancel && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() =>
                              setCancelModal({
                                opened: true,
                                bookingReference: booking?.booking_reference,
                                provider: booking?.provider,
                              })
                            }
                          >
                            Cancel Booking
                          </button>
                        )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="hb-pagination">
            <span>
              Showing {(activePage - 1) * PAGE_SIZE + 1}–
              {Math.min(activePage * PAGE_SIZE, filteredBookings.length)} of{" "}
              {filteredBookings.length}
            </span>
            <Pagination
              total={totalPages}
              value={activePage}
              onChange={setActivePage}
              size="sm"
              color="#1B3B6F"
              withEdges
            />
          </div>
        )}
      </section>
    </div>
  );
}