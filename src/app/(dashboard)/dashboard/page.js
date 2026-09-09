"use client";
import React, { useState, useEffect } from "react";
import { LuHotel } from "react-icons/lu";
import {
  FaCar,
  FaCalendarCheck,
  FaSearch,
  FaFileInvoice,
  FaChevronDown,
} from "react-icons/fa";
import { MdAttractions } from "react-icons/md";
import { HiOutlineSparkles, HiArrowUpRight } from "react-icons/hi2";
import Link from "next/link";
import { FaPlane } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function page() {
  const { data: session } = useSession();
  const [dashboardCount, setDashboardCount] = useState({});
  // NOTE: arrivalList / arrivalTab / arrivalSearch power the "Arrival List"
  // table below. dashboardCount only ever contained booking totals, so this
  // state is new and starts empty — wire it up to whatever endpoint returns
  // the actual list of upcoming bookings (dates, booking id, payment method,
  // amount, status) when that's available, the same way fetchDashboardCount
  // already works below.
  const [arrivalList, setArrivalList] = useState([]);
  const [arrivalTab, setArrivalTab] = useState("all");
  const [arrivalSearch, setArrivalSearch] = useState("");
  const [arrivalStatus, setArrivalStatus] = useState("all");
  const router = useRouter();

  useEffect(() => {
    const { email, otp } = session.user;
    if (!email || !otp) return;
    fetchDashboardCount();
  }, []);

  async function fetchDashboardCount() {
    const { email, otp } = session.user;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp }),
        },
      );
      const data = await response.json();

      if (!data?.success && data?.message?.toLowerCase().includes('otp')) {
        router.push(`/verify-otp?email=${encodeURIComponent(session?.user?.email || '')}`);
        return;
      }

      setDashboardCount(data.data || {});
      // If/when the API also returns the upcoming bookings list, plug it in
      // here, e.g.: setArrivalList(data.data?.arrivals || []);
    } catch (error) {
      console.log(error);
    }
  }

  const userName = session?.user?.name || "";
  const userInitial = userName?.charAt(0)?.toUpperCase() || "U";

  const statCards = [
    {
      title: "Total Bookings",
      count: dashboardCount?.total || 0,
      href: "/my-payments",
      icon: <FaCalendarCheck size={16} />,
      label: "Total Bookings",
    },
    {
      title: "Hotel Bookings",
      count: dashboardCount?.hotel || 0,
      href: "/hotel-bookings",
      icon: <LuHotel size={16} />,
      label: "Hotel Bookings",
    },
    {
      title: "Transfer Bookings",
      count: dashboardCount?.transfers || 0,
      href: "/transfer-bookings",
      icon: <FaCar size={15} />,
      label: "Transfer Bookings",
    },
    {
      title: "Activity Bookings",
      count: dashboardCount?.activities || 0,
      href: "/activity-bookings",
      icon: <MdAttractions size={16} />,
      label: "Activity Bookings",
    },
    {
      title: "Flight Bookings",
      count: dashboardCount?.flights || 0,
      href: "/flight-bookings",
      icon: <FaPlane size={15} />,
      label: "Flight Bookings",
    },
    {
      title: "Package Bookings",
      count: dashboardCount?.packages || 0,
      href: "/package-bookings",
      icon: <HiOutlineSparkles size={16} />,
      label: "Group Packages",
    },
  ];

  const quickLinks = [
    {
      title: "Hotel Bookings",
      sub: "View your reservations",
      href: "/hotel-bookings",
      icon: <LuHotel size={19} />,
    },
    {
      title: "Transfers Bookings",
      sub: "Manage airport transfers",
      href: "/transfer-bookings",
      icon: <FaCar size={17} />,
    },
    {
      title: "Activity Bookings",
      sub: "Find your perfect stay",
      href: "/activity-bookings",
      icon: <MdAttractions size={19} />,
    },
    {
      title: "Flight Bookings",
      sub: "Track your flight itinerary",
      href: "/flight-bookings",
      icon: <FaPlane size={17} />,
    },
    {
      title: "Package Bookings",
      sub: "Review your package trips",
      href: "/package-bookings",
      icon: <HiOutlineSparkles size={19} />,
    },
  ];

  const filteredArrivals = arrivalList.filter((item) => {
    const matchesTab = arrivalTab === "all" || item.type === arrivalTab;
    const matchesSearch =
      !arrivalSearch ||
      item.description?.toLowerCase().includes(arrivalSearch.toLowerCase()) ||
      item.bookingId?.toLowerCase().includes(arrivalSearch.toLowerCase());
    const matchesStatus =
      arrivalStatus === "all" ||
      item.status?.toLowerCase() === arrivalStatus;
    return matchesTab && matchesSearch && matchesStatus;
  });

  return (
    <div className="py-2" style={{ minHeight: "100vh" }}>
      {/* ── Top Header ── */}
      <div className="dash-topbar">
        <div>
          <h4 className="dash-topbar-title">Dashboard</h4>
          <p className="dash-topbar-sub">
            Welcome back{userName ? `, ${userName}` : ""}!
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="dash-topbar-avatar">{userInitial}</div>
          {/* <FaChevronDown size={11} style={{ color: "#8a8f98" }} /> */}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="row g-3 mb-4">
        {statCards.map((card, index) => (
          <div className="col-6 col-sm-4 col-lg-2" key={card.title}>
            <div
              className={`stat-card-sm${index === 0 ? " stat-card-primary" : ""}`}
            >
              <div className="stat-card-icon-sm">{card.icon}</div>
              <div className="stat-card-count">{card.count}</div>
              <div className="stat-card-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Links ── */}
      <div className="quickLinks mb-4">
        <h5 className="section-heading">Quick Links</h5>
        <div className="row g-3">
          {quickLinks.map((link) => (
            <div className="col-12 col-sm-6 col-lg-4" key={link.title}>
              <div className="quicklink-card">
                <div className="quicklink-card-body">
                  <div className="quicklink-icon">{link.icon}</div>
                  <div>
                    <div className="quicklink-title">{link.title}</div>
                    <p className="quicklink-sub">{link.sub}</p>
                  </div>
                </div>
                <div className="quicklink-footer">
                  <Link href={link.href} className="quicklink-btn">
                    View <HiArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Arrival List ── */}
      {/* <div className="arrival-card mb-4">
        <div className="arrival-card-header">
          <h5 className="section-heading mb-0">Arrival List</h5>
          <div className="arrival-tabs">
            <span
              className={arrivalTab === "hotel" ? "active" : ""}
              onClick={() => setArrivalTab("hotel")}
            >
              Hotels
            </span>
            <span
              className={arrivalTab === "transfer" ? "active" : ""}
              onClick={() => setArrivalTab("transfer")}
            >
              Transfers
            </span>
            <span
              className={arrivalTab === "activity" ? "active" : ""}
              onClick={() => setArrivalTab("activity")}
            >
              Activity
            </span>
          </div>
        </div>

        <div className="arrival-filter-bar">
          <div className="arrival-search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by booking id, description..."
              value={arrivalSearch}
              onChange={(e) => setArrivalSearch(e.target.value)}
            />
          </div>
          <div className="arrival-status-group">
            <button
              type="button"
              className={`arrival-status-btn ${arrivalStatus === "all" ? "active" : ""}`}
              onClick={() => setArrivalStatus("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`arrival-status-btn ${arrivalStatus === "success" ? "active" : ""}`}
              onClick={() => setArrivalStatus("success")}
            >
              Success
            </button>
            <button
              type="button"
              className={`arrival-status-btn ${arrivalStatus === "pending" ? "active" : ""}`}
              onClick={() => setArrivalStatus("pending")}
            >
              Pending
            </button>
          </div>
        </div>

        <div className="arrival-table-scroll">
          <table className="arrival-table">
            <thead>
              <tr>
                <th className="arrival-th">Date</th>
                <th className="arrival-th">Description</th>
                <th className="arrival-th">Booking ID</th>
                <th className="arrival-th">Payment Method</th>
                <th className="arrival-th">Amount</th>
                <th className="arrival-th">Status</th>
                <th className="arrival-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredArrivals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="arrival-empty">
                    No upcoming bookings to show yet.
                  </td>
                </tr>
              ) : (
                filteredArrivals.map((item) => (
                  <tr className="arrival-tr" key={item.bookingId}>
                    <td className="arrival-td">{item.date}</td>
                    <td className="arrival-td">{item.description}</td>
                    <td className="arrival-td">{item.bookingId}</td>
                    <td className="arrival-td">{item.paymentMethod}</td>
                    <td className="arrival-td">{item.amount}</td>
                    <td className="arrival-td">
                      <span
                        className={`arrival-badge ${
                          item.status?.toLowerCase() === "success"
                            ? "arrival-badge-success"
                            : "arrival-badge-pending"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="arrival-td">
                      <FaFileInvoice className="me-1" /> Receipt
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div> */}
    </div>
  );
}