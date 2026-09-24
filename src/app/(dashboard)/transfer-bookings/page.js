"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Menu, Pagination, Popover } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import "@mantine/dates/styles.css";
import {
  FaCar,
  FaEye,
  FaDownload,
  FaMapMarkerAlt,
  FaUsers,
  FaCheckCircle,
  FaChevronDown,
  FaSearch,
} from "react-icons/fa";
import { FiFileText, FiCalendar } from "react-icons/fi";
import { CgCalendar } from "react-icons/cg";
import moment from "moment";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter as useNextRouter } from "next/navigation";
import CancelBookingModal from "@/dashboard_components/CancelBookingModal/CancelBookingModal";

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

function getRouteTitle(booking) {
  const pickup = booking?.booking_criteria?.pickup_location || "";
  const dropoff =
    booking?.booking_criteria?.dropoff_location ||
    booking?.booking_criteria?.drop_off_location ||
    booking?.booking_criteria?.destination ||
    "";
  if (pickup && dropoff) {
    const shortPickup = pickup.split(",")[0]?.trim();
    const shortDrop = dropoff.split(",")[0]?.trim();
    return `${shortPickup} to ${shortDrop}`;
  }
  return booking?.transfer?.vehicle_name || "Transfer Booking";
}

function getParticipants(booking) {
  const adults = Number(
    booking?.booking_criteria?.adults ??
    booking?.adults ??
    booking?.pax?.adults ??
    0
  );
  const children = Number(
    booking?.booking_criteria?.children ??
    booking?.children ??
    booking?.pax?.children ??
    0
  );
  if (adults || children) return adults + children;
  return null;
}

function canCancelTransferBooking(booking) {
  const pickupDate =
    booking?.booking_criteria?.pickup_date ||
    booking?.pickup_date ||
    booking?.travel_date ||
    null;

  return (
    booking?.booking_status?.toLowerCase() === "confirmed" &&
    booking?.payment_status?.toLowerCase() === "paid" &&
    pickupDate &&
    moment(pickupDate).isValid() &&
    moment(pickupDate).isAfter(moment(), "day")
  );
}

export default function TransferBookingsPage() {
  const { data: session } = useSession();
  const router = useNextRouter();
  const [cancelModal, setCancelModal] = useState({
    opened: false,
    bookingReference: "",
    provider: "",
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [activePage, setActivePage] = useState(1);
  const [calendarColumns, setCalendarColumns] = useState(2);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const update = () => setCalendarColumns(window.innerWidth < 768 ? 1 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const userName = session?.user?.name || "";
  const userInitial = userName?.charAt(0)?.toUpperCase() || "U";

  useEffect(() => {
    if (!session?.user?.email || !session?.user?.otp) return;
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email, session?.user?.otp]);

  async function fetchBookings() {
    const email = session?.user?.email;
    const otp = session?.user?.otp;
    if (!email || !otp) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/transfer/bookings`,
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
        router.push(
          "/login"
        );
        return;
      }
      setBookings(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

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

      // Tab filter
      let matchesTab = true;
      if (activeTab === "active") matchesTab = ["confirmed", "paid"].includes(st);
      else if (activeTab === "pending") matchesTab = ["pending", "tentative", "failed"].includes(st);
      else if (activeTab === "cancelled") matchesTab = st === "cancelled";

      // Search filter
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        booking?.invoice_number?.toLowerCase().includes(q) ||
        booking?.booking_reference?.toLowerCase().includes(q) ||
        booking?.lead_passenger?.first_name?.toLowerCase().includes(q) ||
        booking?.lead_passenger?.last_name?.toLowerCase().includes(q) ||
        booking?.lead_passenger?.email?.toLowerCase().includes(q) ||
        booking?.transfer?.vehicle_name?.toLowerCase().includes(q) ||
        booking?.booking_criteria?.pickup_location?.toLowerCase().includes(q) ||
        booking?.booking_criteria?.dropoff_location?.toLowerCase().includes(q);

      // Date range filter (by pickup date)
      let matchesDateRange = true;
      if (dateRange[0] && dateRange[1]) {
        const pickupDate =
          booking?.booking_criteria?.pickup_date ||
          booking?.pickup_date ||
          booking?.travel_date;
        const pickupMoment = moment(pickupDate);
        matchesDateRange =
          pickupMoment.isValid() &&
          pickupMoment.isSameOrAfter(moment(dateRange[0]), "day") &&
          pickupMoment.isSameOrBefore(moment(dateRange[1]), "day");
      }

      return matchesTab && matchesSearch && matchesDateRange;
    });
  }, [bookings, activeTab, searchQuery, dateRange]);

  useEffect(() => {
    setActivePage(1);
  }, [activeTab, searchQuery, dateRange]);

  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE) || 1;
  const pagedBookings = filteredBookings.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE
  );

  return (
    <div className="hb-page">
      <CancelBookingModal
        opened={cancelModal.opened}
        onClose={() =>
          setCancelModal({ opened: false, bookingReference: "", provider: "" })
        }
        bookingReference={cancelModal.bookingReference}
        provider={cancelModal.provider}
        type="transfer"
        endPoint="/api/transfers/booking/cancel"
        onSuccess={() => fetchBookings()}
      />

      <div className="dash-topbar">
        <div>
          <h4 className="dash-topbar-title">Transfer Bookings</h4>
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
            <Popover width="auto" position="bottom-end" withArrow shadow="md">
              <Popover.Target>
                <button type="button" className="hb-date-btn">
                  <CgCalendar size={15} />
                  {dateRange[0] && dateRange[1]
                    ? `${moment(dateRange[0]).format("MMM DD")} - ${moment(dateRange[1]).format("MMM DD")}`
                    : "Pickup Date Range"}
                </button>
              </Popover.Target>
              <Popover.Dropdown>
                <DatePicker
                  type="range"
                  numberOfColumns={calendarColumns}
                  value={dateRange}
                  onChange={setDateRange}
                />
                {dateRange[0] && dateRange[1] && (
                  <div className="hb-date-clear-wrapper">
                    <button
                      type="button"
                      className="hb-date-clear-btn"
                      onClick={() => setDateRange([null, null])}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </Popover.Dropdown>
            </Popover>
            <span className="hb-results-count">
              {filteredBookings.length} of {bookings.length} result
              {bookings.length !== 1 ? "s" : ""}
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
          ) : pagedBookings.length === 0 ? (
            <div className="hb-empty">No bookings found for this filter.</div>
          ) : (
            pagedBookings.map((booking, index) => {
              const st = booking?.booking_status?.toLowerCase();
              const tone = statusTone(st);
              const guests = getParticipants(booking);
              const bookingId =
                booking?.booking_reference ||
                booking?.invoice_number ||
                `TRF-${booking?.id || index}`;
              const dateValue = booking?.booking_criteria?.pickup_date
                ? moment(booking.booking_criteria.pickup_date).format("MMM DD, YYYY")
                : booking?.pickup_date
                  ? moment(booking.pickup_date).format("MMM DD, YYYY")
                  : moment(booking?.created_at).format("MMM DD, YYYY");
              const location =
                booking?.booking_criteria?.pickup_location ||
                booking?.transfer?.trip_type ||
                "Pickup location not available";
              const canCancel = canCancelTransferBooking(booking);

              return (
                <article
                  key={booking?.id || booking?.invoice_number || index}
                  className="hb-card"
                >
                  <div className="hb-card-top">
                    <div className="hb-card-top-left">
                      <div className="hb-hotel-icon">
                        <FaCar size={16} />
                      </div>
                      <div>
                        <h6 className="hb-hotel-name">{booking?.transfer?.vehicle_name}</h6>
                        <p className="hb-hotel-location">
                          <FaMapMarkerAlt size={11} />
                          <span>{location}</span>
                        </p>
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
                        <strong>{bookingId}</strong>
                      </div>
                    </div>
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <FiCalendar />
                      </span>
                      <div>
                        <span className="hb-meta-label">Pickup Date</span>
                        <strong>{dateValue}</strong>
                      </div>
                    </div>
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <FaUsers />
                      </span>
                      <div>
                        <span className="hb-meta-label">Passengers</span>
                        <strong>
                          {guests
                            ? `${guests} ${guests === 1 ? "Person" : "People"}`
                            : `${booking?.lead_passenger?.first_name || "Guest"} ${booking?.lead_passenger?.last_name || ""
                              }`.trim()}
                        </strong>
                      </div>
                    </div>
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <FaCar />
                      </span>
                      <div>
                        <span className="hb-meta-label">Trip Type</span>
                        <strong>
                          {booking?.transfer?.trip_type ||
                            "—"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="hb-card-footer">
                    <div>
                      <span className="hb-amount-label">Total Amount</span>
                      <div className="hb-amount">
                        {booking?.pricing?.display_currency || ""}{" "}
                        {booking?.pricing?.amount_after_exchange ?? "-"}
                      </div>
                      <div className={`hb-status hb-status-${tone}`}>
                        Payment:{" "}
                        {booking?.payment_status
                          ? booking.payment_status.charAt(0).toUpperCase() +
                          booking.payment_status.slice(1)
                          : "-"}
                      </div>
                    </div>

                    <div className="hb-card-actions">
                      <Link
                        href={`/transfers/voucher/${booking?.booking_reference}`}
                        target="_blank"
                        className="hb-btn hb-btn-light"
                      >
                        <FaEye size={13} />
                        Voucher
                      </Link>
                      <Link
                        href={`/transfers/invoice/${booking?.booking_reference}`}
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

        {!loading && filteredBookings.length > PAGE_SIZE && (
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