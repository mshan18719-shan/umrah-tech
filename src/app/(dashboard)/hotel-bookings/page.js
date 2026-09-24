"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Menu, Pagination, Popover } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { FaHotel, FaEye, FaDownload, FaMapMarkerAlt, FaUsers, FaCheckCircle, FaSearch } from "react-icons/fa";
import { FiFileText, FiCalendar } from "react-icons/fi";
import { FaChevronDown } from "react-icons/fa";
import { CgCalendar } from "react-icons/cg";
import moment from "moment";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CancelBookingModal from "@/dashboard_components/CancelBookingModal/CancelBookingModal";

function getGuestCount(booking) {
  const adults = Number(booking?.adults ?? booking?.total_adults ?? booking?.pax?.adults ?? 0);
  const children = Number(booking?.children ?? booking?.total_children ?? booking?.pax?.children ?? 0);
  if (adults || children) return adults + children;

  const rooms = booking?.rooms || booking?.hotel?.rooms || [];
  if (Array.isArray(rooms) && rooms.length) {
    return rooms.reduce((sum, room) => {
      const roomAdults = Number(room?.adults ?? 0);
      const roomChildren = Array.isArray(room?.children)
        ? room.children.length
        : Number(room?.children ?? 0);
      return sum + roomAdults + roomChildren;
    }, 0);
  }

  return null;
}

function getLocation(booking) {
  const city = booking?.hotel_details?.city || booking?.hotel_details?.destination || "";
  const country = booking?.hotel_details?.country || "";
  const short = [city, country].filter(Boolean).join(", ");
  if (short) return short;

  const address = booking?.hotel_details?.address || "";
  if (address.length > 48) return `${address.slice(0, 48).trim()}…`;
  return address || "Location not available";
}

function canCancelBooking(booking) {
  const checkIn =
    booking?.check_in ||
    booking?.booking_criteria?.check_in ||
    null;

  return (
    booking?.booking_status?.toLowerCase() === "confirmed" &&
    booking?.payment_status?.toLowerCase() === "paid" &&
    checkIn &&
    moment(checkIn).isValid() &&
    moment(checkIn).isAfter(moment(), "day")
  );
}

export default function HotelBookingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cancelModal, setCancelModal] = useState({
    opened: false,
    bookingReference: "",
    provider: "",
    bookingId: "",
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [activePage, setActivePage] = useState(1);
  const [calendarColumns, setCalendarColumns] = useState(2);
  const ITEMS_PER_PAGE = 7;

  useEffect(() => {
    const update = () => setCalendarColumns(window.innerWidth < 768 ? 1 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const userName = session?.user?.name || "";
  const userInitial = userName?.charAt(0)?.toUpperCase() || "U";

  async function fetchBookings() {
    const email = session?.user?.email;
    const otp = session?.user?.otp;
    if (!email || !otp) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/hotel/bookings`,
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
        booking?.holder_name?.toLowerCase().includes(q) ||
        booking?.holder_surname?.toLowerCase().includes(q) ||
        booking?.holder_email?.toLowerCase().includes(q) ||
        booking?.hotel_details?.name?.toLowerCase().includes(q);

      // Date range filter (by check-in date)
      let matchesDateRange = true;
      if (dateRange[0] && dateRange[1]) {
        const checkIn = booking?.check_in || booking?.booking_criteria?.check_in;
        const checkInDate = moment(checkIn);
        matchesDateRange =
          checkInDate.isValid() &&
          checkInDate.isSameOrAfter(moment(dateRange[0]), "day") &&
          checkInDate.isSameOrBefore(moment(dateRange[1]), "day");
      }

      return matchesTab && matchesSearch && matchesDateRange;
    });
  }, [bookings, activeTab, searchQuery, dateRange]);

  useEffect(() => {
    setActivePage(1);
  }, [activeTab, searchQuery, dateRange]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE) || 1;
  const paginatedBookings = filteredBookings.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE
  );

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

  return (
    <>
      <CancelBookingModal
        opened={cancelModal.opened}
        onClose={() =>
          setCancelModal({ opened: false, bookingReference: "", provider: "", bookingId: "" })
        }
        bookingReference={cancelModal.bookingReference}
        provider={cancelModal.provider}
        type="hotel"
        bookingId={cancelModal.bookingId}
        endPoint="/api/hotel/cancel-booking"
        onSuccess={() => fetchBookings()}
      />

      <div className="hb-page">
        <div className="dash-topbar">
          <div>
            <h4 className="dash-topbar-title">Hotel Bookings</h4>
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
                  placeholder="Search by name, email or invoice..."
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
                      : "Check-in Date Range"}
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
            ) : paginatedBookings.length === 0 ? (
              <div className="hb-empty">No bookings found for this filter.</div>
            ) : (
              paginatedBookings.map((booking, index) => {
                const st = booking?.booking_status?.toLowerCase();
                const tone = statusTone(st);
                const guests = getGuestCount(booking);
                const bookingId =
                  booking?.booking_reference ||
                  booking?.invoice_number ||
                  `HTL-${booking?.id || index}`;
                const stayDate = booking?.check_in
                  ? moment(booking.check_in).format("MMM DD, YYYY")
                  : moment(booking?.created_at, "DD-MM-YYYY HH:mm:ss").format("MMM DD, YYYY");
                const checkOutDate = booking?.check_out
                  ? moment(booking.check_out).format("MMM DD, YYYY")
                  : moment(booking?.created_at, "DD-MM-YYYY HH:mm:ss").format("MMM DD, YYYY");

                return (
                  <article key={booking?.id || booking?.invoice_number || index} className="hb-card">
                    <div className="hb-card-top">
                      <div className="hb-card-top-left">
                        <div className="hb-hotel-icon">
                          <FaHotel size={16} />
                        </div>
                        <div className="hb-hotel-info">
                          <h6 className="hb-hotel-name">
                            {booking?.hotel_details?.name || "Hotel Booking"}
                          </h6>
                          <p className="hb-hotel-location">
                            <FaMapMarkerAlt size={11} />
                            <span>{getLocation(booking)}</span>
                          </p>
                        </div>
                      </div>

                      <div className={`hb-status hb-status-${tone}`}>
                        {(tone === "confirmed") && <FaCheckCircle size={14} />}
                        <span>{statusLabel(st)}</span>
                      </div>
                    </div>

                    <div className="hb-card-meta">
                      <div className="hb-meta-item">
                        <div className="hb-meta-icon">
                          <FiFileText />
                        </div>
                        <div>
                          <span className="hb-meta-label">Booking ID</span>
                          <strong>{bookingId}</strong>
                        </div>
                      </div>
                      <div className="hb-meta-item">
                        <div className="hb-meta-icon">
                          <FiCalendar />
                        </div>
                        <div>
                          <span className="hb-meta-label">Check-in Date</span>
                          <strong>{stayDate}</strong>
                        </div>
                      </div>
                      <div className="hb-meta-item">
                        <div className="hb-meta-icon">
                          <FiCalendar />
                        </div>
                        <div>
                          <span className="hb-meta-label">Check-out Date</span>
                          <strong>{checkOutDate}</strong>
                        </div>
                      </div>
                      <div className="hb-meta-item">
                        <div className="hb-meta-icon">
                          <FaUsers />
                        </div>
                        <div>
                          <span className="hb-meta-label">Guests</span>
                          <strong>
                            {guests
                              ? `${booking?.holder_name || "Guest"} ${booking?.holder_surname || ""}`.trim()
                              : `${booking?.holder_name || "Guest"} ${booking?.holder_surname || ""}`.trim()}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="hb-card-footer">
                      <div>
                        <span className="hb-amount-label">Total Amount</span>
                        <div className="hb-amount">
                          {booking?.display_currency || booking?.currency || ""}{" "}
                          {booking?.booking_amount ?? "-"}
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
                          href={`/hotels/voucher/${booking?.invoice_number}`}
                          target="_blank"
                          className="hb-btn hb-btn-light"
                        >
                          <FaEye size={13} />
                          Voucher
                        </Link>
                        <Link
                          href={`/hotels/invoice/${booking?.invoice_number}`}
                          target="_blank"
                          className="hb-btn hb-btn-primary"
                        >
                          <FaDownload size={13} />
                          Invoice
                        </Link>

                        {canCancelBooking(booking) && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() =>
                              setCancelModal({
                                opened: true,
                                bookingReference: booking?.booking_reference,
                                provider: booking?.provider,
                                bookingId: booking?.id || "",
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

          {!loading && filteredBookings.length > ITEMS_PER_PAGE && (
            <div className="hb-pagination">
              <span>
                Showing {(activePage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(activePage * ITEMS_PER_PAGE, filteredBookings.length)} of{" "}
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
    </>
  );
}