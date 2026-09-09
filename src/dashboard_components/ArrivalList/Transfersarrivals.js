import React, { useState, useEffect, useMemo } from "react";
import { Menu, Popover, Pagination } from "@mantine/core";
import { CgCalendar } from "react-icons/cg";
import { DatePicker } from "@mantine/dates";
import { LiaAngleDownSolid } from "react-icons/lia";
import { IoMdCheckmark } from "react-icons/io";
import styles from "../../app/(dashboard)/Bookings.module.css";
import { FaEye } from "react-icons/fa";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ArrivalListSkeleton from "./ArrivalListSkeleton";
import moment from "moment";
const paymentStatusConfig = {
  paid: { bg: "#d1fae5", color: "#065f46" },
  confirmed: { bg: "#d1fae5", color: "#065f46" },
  tentative: { bg: "#dbeafe", color: "#1e40af" },
  pending: { bg: "#fef3c7", color: "#92400e" },
  unpaid: { bg: "#fef3c7", color: "#92400e" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
  failed: { bg: "#fee2e2", color: "#991b1b" },
  refunded: { bg: "#ede9fe", color: "#5b21b6" },
};

function getPaymentStatusStyle(status) {
  const key = status?.toLowerCase();
  return paymentStatusConfig[key] || { bg: "#f3f4f6", color: "#374151" };
}

function Transfersarrivals({ activetab }) {
  const { data: session, status } = useSession();
  const [transferArrivals, setTransferArrivals] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [activePage, setActivePage] = useState(1);
  const PAGE_SIZE = 10;

  async function transferarrivals(page = 1) {
    if (!session?.user?.apiToken) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2b/dashboard/transfer-arrival-list?page=${page}&per_page=${PAGE_SIZE}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.apiToken}`,
          },
        },
      );
      const data = await response.json();
      setTransferArrivals(data?.data || []);
      setMeta(data?.meta || {});
      setActivePage(data?.meta?.current_page || 1);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user?.apiToken &&
      activetab === "transfers"
    ) {
      transferarrivals();
    }
  }, [status, activetab]);

  const filteredTransfers = useMemo(() => {
    const [startDate, endDate] = dateRange;
    return transferArrivals.filter((booking) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        booking?.booking_reference?.toLowerCase().includes(q) ||
        booking?.lead_passenger?.first_name?.toLowerCase().includes(q) ||
        booking?.lead_passenger?.last_name?.toLowerCase().includes(q) ||
        booking?.lead_passenger?.email?.toLowerCase().includes(q) ||
        booking?.transfer?.vehicle_name?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        booking?.payment_status?.toLowerCase() === statusFilter;

      let matchesDate = true;
      if (startDate && endDate) {
        const d = moment(booking?.created_at);
        matchesDate =
          d.isSameOrAfter(moment(startDate), "day") &&
          d.isSameOrBefore(moment(endDate), "day");
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [transferArrivals, searchQuery, statusFilter, dateRange]);

  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || dateRange[0];

  // const totalPages = Math.ceil(filteredTransfers.length / PAGE_SIZE);
  // const pagedTransfers = filteredTransfers.slice(
  //   (activePage - 1) * PAGE_SIZE,
  //   activePage * PAGE_SIZE,
  // );

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "confirmed", label: "Confirmed" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const dateLabel =
    dateRange[0] && dateRange[1]
      ? `${moment(dateRange[0]).format("MMM DD")} – ${moment(dateRange[1]).format("MMM DD, YYYY")}`
      : "Date Range";

  return (
    <div>
      <div className={styles.content}>
        <h5 className="mb-3">Transfer Arrival List</h5>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by Invoice No or Passenger Name"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Menu shadow="md" position="bottom-end" width="target">
            <Menu.Target>
              <button
                className={styles.filterBtn}
                style={
                  statusFilter !== "all"
                    ? { borderColor: "#4f46e5", color: "#4f46e5" }
                    : {}
                }
              >
                {statusOptions.find((o) => o.value === statusFilter)?.label ||
                  "All Status"}{" "}
                <LiaAngleDownSolid />
              </button>
            </Menu.Target>
            <Menu.Dropdown>
              {statusOptions.map((opt) => (
                <Menu.Item
                  key={opt.value}
                  leftSection={
                    statusFilter === opt.value ? (
                      <IoMdCheckmark size={14} />
                    ) : (
                      <span style={{ width: 14 }} />
                    )
                  }
                  onClick={() => setStatusFilter(opt.value)}
                >
                  {opt.label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <Popover width="auto" position="bottom-end" withArrow shadow="md">
            <Popover.Target>
              <button
                className={styles.filterBtn}
                style={
                  dateRange[0]
                    ? { borderColor: "#4f46e5", color: "#4f46e5" }
                    : {}
                }
              >
                <CgCalendar size={15} /> {dateLabel}
              </button>
            </Popover.Target>
            <Popover.Dropdown>
              <DatePicker
                type="range"
                numberOfColumns={2}
                value={dateRange}
                onChange={setDateRange}
              />
              {dateRange[0] && (
                <div style={{ textAlign: "right", padding: "8px 8px 4px" }}>
                  <button
                    onClick={() => setDateRange([null, null])}
                    style={{
                      fontSize: "12px",
                      color: "#ef4444",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Clear dates
                  </button>
                </div>
              )}
            </Popover.Dropdown>
          </Popover>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setDateRange([null, null]);
              }}
              style={{
                fontSize: "12px",
                color: "#ef4444",
                background: "none",
                border: "1px solid #ef4444",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Clear All
            </button>
          )}
        </div>
        <div className="table-responsive">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Guest Name</th>
                <th>Vehicle / Pickup</th>
                <th>Trip Type</th>
                <th>Booking Date</th>
                <th>Status</th>
                {/* <th>Amount</th> */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <ArrivalListSkeleton columns={6} rows={6} />
              ) : filteredTransfers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "48px 16px",
                      color: "#9ca3af",
                    }}
                  >
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>
                      {hasActiveFilters ? "🔍" : "🚌"}
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#6b7280",
                      }}
                    >
                      {hasActiveFilters
                        ? "No matching arrivals"
                        : "No arrivals found"}
                    </div>
                    <div style={{ fontSize: "13px", marginTop: "4px" }}>
                      {hasActiveFilters
                        ? "Try adjusting your search or filters."
                        : "There are no transfer arrivals to display yet."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((booking) => (
                  <tr key={booking.id}>
                    <td className={styles.bookingId}>
                      {booking?.booking_reference}
                    </td>
                    <td>
                      <div className={styles.guestInfo}>
                        <span className={styles.guestName}>
                          {booking?.lead_passenger?.first_name}{" "}
                          {booking?.lead_passenger?.last_name}
                        </span>
                        <span className={styles.guestEmail}>
                          {booking?.lead_passenger?.email}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#1a1a1a",
                        }}
                      >
                        {booking?.transfer?.vehicle_name}
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6c757d",
                            marginTop: "2px",
                          }}
                        >
                          {moment(
                            booking?.booking_criteria?.pickup_date,
                          ).format("DD MMM YYYY")}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span>{booking?.transfer?.trip_type}</span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: "13px",
                        color: "#495057",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {/* {moment(booking?.booking_criteria?.pickup_date).format(
                        "MMM DD, YYYY",
                      )} */}
                        { moment(booking?.created_at).format("DD MMM YYYY")}
                    </td>
                    <td>
                      <span
                        style={{
                          backgroundColor: getPaymentStatusStyle(
                            booking?.payment_status,
                          ).bg,
                          color: getPaymentStatusStyle(booking?.payment_status)
                            .color,
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textTransform: "capitalize",
                          whiteSpace: "nowrap",
                          display: "inline-block",
                        }}
                      >
                        {booking?.payment_status || "—"}
                      </span>
                    </td>
                    {/* <td className={styles.amount}>{booking.amount}</td> */}
                    <td>
                      <button className={styles.actionsBtn}>
                        <Menu shadow="md" position="bottom-end" width={200}>
                          <Menu.Target>
                            <span>⋯</span>
                          </Menu.Target>

                          <Menu.Dropdown>
                            <Menu.Item leftSection={<FaEye size={14} />}>
                              <Link
                                href={`/transfers/voucher/${booking?.booking_reference}`}
                                target="_blank"
                                className="text-dark"
                              >
                                View Voucher
                              </Link>
                            </Menu.Item>
                            <Menu.Item leftSection={<FaEye size={14} />}>
                              <Link
                                href={`/transfers/invoice/${booking?.booking_reference}`}
                                target="_blank"
                                className="text-dark"
                              >
                                View Invoice
                              </Link>
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && meta?.last_page > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "16px",
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <Pagination
              total={meta?.last_page || 1}
              value={activePage}
              onChange={(p) => transferarrivals(p)}
              size="sm"
              color="#9b8357"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Transfersarrivals;
