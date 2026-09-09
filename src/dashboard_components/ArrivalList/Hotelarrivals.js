import React, { useState, useEffect, useMemo } from "react";
import { Menu, Popover, Pagination } from "@mantine/core";
import { CgCalendar } from "react-icons/cg";
import { DatePicker } from "@mantine/dates";
import { LiaAngleDownSolid } from "react-icons/lia";
import { IoMdCheckmark } from "react-icons/io";
import styles from "../../app/(dashboard)/Bookings.module.css";
import { FaEye, FaHotel, FaArrowRight } from "react-icons/fa";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ArrivalListSkeleton from "./ArrivalListSkeleton";
import moment from "moment";
import { MdCancel } from "react-icons/md";
import { Modal } from "@mantine/core";
import { Textarea } from "@mantine/core";
const paymentStatusConfig = {
  confirmed: { bg: "#d1fae5", color: "#065f46" },
  tentative: { bg: "#dbeafe", color: "#1e40af" },
  pending: { bg: "#fef3c7", color: "#92400e" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
};

function getPaymentStatusStyle(status) {
  const key = status?.toLowerCase();
  return paymentStatusConfig[key] || { bg: "#f3f4f6", color: "#374151" };
}

function Hotelarrivals({ activetab }) {
  const { data: session, status } = useSession();
  const [hotelArrivals, setHotelArrivals] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [activePage, setActivePage] = useState(1);
  const [opened, setOpened] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationError, setCancellationError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const PAGE_SIZE = 10;

  async function hotelarrivals(page = 1) {
    if (!session?.user?.apiToken) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2b/dashboard/hotel-arrival-list?page=${page}&per_page=${PAGE_SIZE}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.apiToken}`,
          },
        },
      );
      const data = await response.json();
      setHotelArrivals(data?.data || data || []);
      setMeta(data?.meta || {});
      setActivePage(data?.meta?.current_page || 1);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }
  const handleOpen = (invoice) => {
    setSelectedInvoice(invoice);
    setCancellationReason("");
    setCancellationError(null);
    setOpened(true);
  };
  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user?.apiToken &&
      activetab === "hotels"
    ) {
      hotelarrivals();
    }
  }, [status, activetab]);

  const filteredHotels = useMemo(() => {
    const [startDate, endDate] = dateRange;
    return hotelArrivals.filter((booking) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        booking?.invoice_number?.toLowerCase().includes(q) ||
        booking?.holder_name?.toLowerCase().includes(q) ||
        booking?.holder_surname?.toLowerCase().includes(q) ||
        booking?.holder_email?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        booking?.booking_status?.toLowerCase() === statusFilter;

      let matchesDate = true;
      if (startDate && endDate) {
        const d = moment(
          booking?.check_in || booking?.hotel?.check_in || booking?.created_at,
        );
        matchesDate =
          d.isSameOrAfter(moment(startDate), "day") &&
          d.isSameOrBefore(moment(endDate), "day");
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [hotelArrivals, searchQuery, statusFilter, dateRange]);

  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || dateRange[0];

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

  const submitreason = () => {
    if (!cancellationReason.trim()) {
      setCancellationError("Please enter a reason for cancellation.");
      return;
    }
    const requestData = {
      reason: cancellationReason,
      invoice_number: selectedInvoice,
    };
  };
  return (
    <div>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Request Cancellation"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <div>
          <Textarea
            size="sm"
            radius="md"
            label="Enter Request Cancellation Reason"
            withAsterisk
            name="cancellationReason"
            value={cancellationReason}
            onChange={(event) =>
              setCancellationReason(event.currentTarget.value)
            }
          />
          {cancellationError && (
            <div style={{ color: "red", marginTop: "8px", fontSize: "13px" }}>
              {cancellationError}
            </div>
          )}
          <div className="d-flex justify-content-end mt-3">
            <button className="btn btn-primary" onClick={submitreason}>
              Submit
            </button>
          </div>
        </div>
      </Modal>
      <div className={styles.content}>
        <h5 className="mb-3">Hotel Arrival List</h5>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by Invoice No or Guest Name"
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
                <th>Hotel / Dates</th>
                <th>Booking Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <ArrivalListSkeleton columns={7} rows={6} />
              ) : filteredHotels.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "48px 16px",
                      color: "#9ca3af",
                    }}
                  >
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>
                      {hasActiveFilters ? "🔍" : "🏨"}
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
                        : "There are no hotel arrivals to display yet."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHotels.map((booking) => (
                  <tr key={booking?.id || booking?.booking_reference}>
                    <td className={styles.bookingId}>
                      {booking?.invoice_number || booking?.id}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#1a1a1a",
                        }}
                      >
                        {booking?.holder_name} {booking?.holder_surname}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6c757d",
                          marginTop: "2px",
                        }}
                      >
                        {booking?.holder_email}
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
                        {booking?.hotel?.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6c757d",
                          marginTop: "2px",
                        }}
                      >
                        {moment(booking?.check_in).format("MMM DD")}{" "}
                        <FaArrowRight size={9} />{" "}
                        {moment(booking?.check_out).format("MMM DD, YYYY")}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: "13px",
                        color: "#495057",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {/* {moment(booking?.date).format("MMM DD, YYYY")} */}
                      {moment(booking?.created_at, "DD-MM-YYYY HH:mm:ss").format("DD MMM YYYY")}
                    </td>
                    <td>
                      <span
                        style={{
                          backgroundColor: getPaymentStatusStyle(
                            booking?.booking_status,
                          ).bg,
                          color: getPaymentStatusStyle(booking?.booking_status)
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
                        {booking?.booking_status || "—"}
                      </span>
                    </td>
                    <td>
                      <button className={styles.actionsBtn}>
                        <Menu shadow="md" position="bottom-end" width={200}>
                          <Menu.Target>
                            <span>⋯</span>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<FaEye size={14} />}>
                              <Link
                                href={`/hotels/voucher/${booking?.invoice_number}`}
                                target="_blank"
                                className="text-dark"
                              >
                                View Voucher
                              </Link>
                            </Menu.Item>
                            <Menu.Item leftSection={<FaEye size={14} />}>
                              <Link
                                href={`/hotels/invoice/${booking?.invoice_number}`}
                                target="_blank"
                                className="text-dark"
                              >
                                View Invoice
                              </Link>
                            </Menu.Item>
                            {booking?.booking_status?.toLowerCase() ===
                              "confirmed" &&
                              moment(booking?.check_in).isAfter(
                                moment(),
                                "day",
                              ) && (
                                <Menu.Item
                                  leftSection={<MdCancel size={13} />}
                                  color="red"
                                  variant="default"
                                  onClick={() =>
                                    handleOpen(booking?.invoice_number)
                                  }
                                >
                                  Request Cancellation
                                </Menu.Item>
                              )}
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
              onChange={(p) => hotelarrivals(p)}
              size="sm"
              color="#9b8357"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Hotelarrivals;
