"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Menu, Pagination } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import "@mantine/dates/styles.css";
import {
  FaEye,
  FaDownload,
  FaMapMarkerAlt,
  FaUsers,
  FaCheckCircle,
  FaChevronDown,
  FaSearch,
  FaMailBulk
} from "react-icons/fa";
import { MdAttractions } from "react-icons/md";
import { FiFileText, FiCalendar } from "react-icons/fi";
import moment from "moment";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

function getActivityGuests(booking) {
  const adults = Number(
    booking?.total_adults ??
    booking?.adults ??
    booking?.pax?.adults ??
    booking?.activity_details?.adults ??
    0
  );
  const children = Number(
    booking?.total_children ??
    booking?.children ??
    booking?.pax?.children ??
    booking?.activity_details?.children ??
    0
  );
  if (adults || children) return adults + children;
  return null;
}

function getActivityLocation(booking) {
  const city = booking?.activity_details?.city;
  const country = booking?.activity_details?.country;
  if (city && country) return `${city}, ${country}`;
  return country || city || booking?.activity_details?.activityDuration || "Activity location";
}

function getTravelDateValue(booking) {
  return (
    booking?.travel_date ||
    booking?.booking_criteria?.travel_date ||
    null
  );
}

export default function ActivityBookingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState({
    opened: false,
    bookingReference: "",
    provider: "",
    bookingId: "",
  });
  const [activeTab, setActiveTab] = useState("all");
  const [activePage, setActivePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [dateMenuOpened, setDateMenuOpened] = useState(false);
  const PAGE_SIZE = 10;

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
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/activity/bookings`,
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
          `/verify-otp?email=${encodeURIComponent(session?.user?.email || "")}`
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
        const haystack = [
          booking?.activity_details?.title,
          booking?.booking_reference,
          booking?.lead_first_name,
          booking?.lead_last_name,
          booking?.email,
          booking?.customer_email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (dateRange[0] || dateRange[1]) {
        const travelDateRaw = getTravelDateValue(booking);
        if (!travelDateRaw || !moment(travelDateRaw).isValid()) return false;
        const travelMoment = moment(travelDateRaw);
        if (dateRange[0] && travelMoment.isBefore(moment(dateRange[0]), "day"))
          return false;
        if (dateRange[1] && travelMoment.isAfter(moment(dateRange[1]), "day"))
          return false;
      }

      return true;
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

  const dateButtonLabel =
    dateRange[0] || dateRange[1]
      ? `${dateRange[0] ? moment(dateRange[0]).format("MMM DD, YYYY") : "Any"} - ${dateRange[1] ? moment(dateRange[1]).format("MMM DD, YYYY") : "Any"
      }`
      : "Travel Date Range";

  return (
    <div className="hb-page">
      <CancelBookingModal
        opened={cancelModal.opened}
        onClose={() =>
          setCancelModal({
            opened: false,
            bookingReference: "",
            provider: "",
            bookingId: "",
          })
        }
        bookingReference={cancelModal.bookingReference}
        provider={cancelModal.provider}
        type="activity"
        bookingId={cancelModal.bookingId}
        endPoint="/api/activities/cancel-booking"
        onSuccess={() => fetchBookings()}
      />

      <div className="dash-topbar">
        <div>
          <h4 className="dash-topbar-title">Activity Bookings</h4>
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
                  className="hb-date-btn"
                  onClick={() => setDateMenuOpened((o) => !o)}
                >
                  <FiCalendar size={13} />
                  {dateButtonLabel}
                  <FaChevronDown size={9} />
                </button>
              </Menu.Target>
              <Menu.Dropdown>
                <div style={{ padding: "10px 12px" }}>
                  <DatePicker
                    type="range"
                    value={dateRange}
                    onChange={setDateRange}
                    numberOfColumns={2}
                    allowSingleDateInRange
                  />
                </div>
                {dateRange[0] && dateRange[1] && (
                  <div className="hb-date-clear-wrapper">
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
          ) : pagedBookings.length === 0 ? (
            <div className="hb-empty">No bookings found for this filter.</div>
          ) : (
            pagedBookings.map((booking, index) => {
              const st = booking?.booking_status?.toLowerCase();
              const tone = statusTone(st);
              const guests = getActivityGuests(booking);
              const travelDateRaw =
                booking?.travel_date ||
                booking?.booking_criteria?.travel_date ||
                null;
              const dateValue = travelDateRaw
                ? moment(travelDateRaw).format("MMM DD, YYYY")
                : moment(booking?.created_at).format("MMM DD, YYYY");
              const canCancel =
                st === "confirmed" &&
                booking?.payment_status?.toLowerCase() === "paid" &&
                travelDateRaw &&
                moment(travelDateRaw).isValid() &&
                moment(travelDateRaw).isAfter(moment(), "day");

              return (
                <article
                  key={booking?.id || booking?.booking_reference || index}
                  className="hb-card"
                >
                  <div className="hb-card-top">
                    <div className="hb-card-top-left">
                      <div className="hb-hotel-icon">
                        <MdAttractions size={18} />
                      </div>
                      <div>
                        <h6 className="hb-hotel-name">
                          {booking?.activity_details?.title || "Activity Booking"}
                        </h6>
                        <p className="hb-hotel-location">
                          <FaMapMarkerAlt size={11} />
                          <span>{getActivityLocation(booking)}</span>
                        </p>
                      </div>
                    </div>
                    <div className={`hb-status hb-status-${tone}`}>
                      {tone === "confirmed" && <FaCheckCircle size={14} />}
                      <span>{statusLabel(st)}</span>
                    </div>
                  </div>

                  <div className="hb-card-meta">
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
                        <span className="hb-meta-label">Travel Date</span>
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
                          {guests
                            ? `${booking?.lead_name || "Guest"}`
                            : `${booking?.lead_first_name || "Guest"} ${booking?.lead_last_name || ""
                              }`.trim()}
                        </strong>
                      </div>
                    </div>
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <FaMailBulk />
                      </span>
                      <div>
                        <span className="hb-meta-label">Mail</span>
                        <strong>
                          {booking?.lead_email || "yourmail@company.com"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="hb-card-footer">
                    <div>
                      <span className="hb-amount-label">Total Amount</span>
                      <div className="hb-amount">
                        {booking?.customer_currency || ""}{" "}
                        {booking?.customer_total ?? "-"}
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
                        href={`/activities/voucher/${booking?.booking_reference}`}
                        target="_blank"
                        className="hb-btn hb-btn-light"
                      >
                        <FaEye size={13} />
                        Voucher
                      </Link>
                      <Link
                        href={`/activities/invoice/${booking?.booking_reference}`}
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