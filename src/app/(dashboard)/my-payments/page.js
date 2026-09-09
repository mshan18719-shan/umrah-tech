"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Pagination } from "@mantine/core";
import {
  FaCheckCircle,
  FaChevronDown,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
import { AiOutlineBars } from "react-icons/ai";
import { FiFileText, FiCalendar, FiHash } from "react-icons/fi";
import moment from "moment";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

const statusLabel = (status) => {
  const st = (status || "").toLowerCase();
  if (!st) return "UNKNOWN";
  return st.toUpperCase();
};

const statusTone = (status) => {
  const st = (status || "").toLowerCase();
  if (st === "confirmed" || st === "paid" || st === "approved") return "confirmed";
  if (st === "rejected" || st === "cancelled" || st === "failed") return "cancelled";
  if (st === "pending") return "pending";
  return "default";
};

function page() {
  const { data: session } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [activePage, setActivePage] = useState(1);

  const userName = session?.user?.name || "";
  const userInitial = userName?.charAt(0)?.toUpperCase() || "U";

  useEffect(() => {
    const { email, otp } = session.user;
    if (!email || !otp) return;
    fetchPayments();
  }, []);

  async function fetchPayments() {
    const { email, otp } = session.user;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/payment-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp }),
        }
      );
      const data = await response.json();
      if (!data?.success && data?.message?.toLowerCase().includes("otp")) {
        router.push(
          `/verify-otp?email=${encodeURIComponent(session?.user?.email || "")}`
        );
        return;
      }
      setPayments(data?.data || data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const getStatus = (p) => (p?.status || p?.payment_status || "").toLowerCase();

  const tabCounts = useMemo(() => {
    const all = payments.length;
    const confirmed = payments.filter((p) =>
      ["confirmed", "paid", "approved"].includes(getStatus(p))
    ).length;
    const pending = payments.filter((p) => getStatus(p) === "pending").length;
    const rejected = payments.filter((p) =>
      ["rejected", "cancelled", "failed"].includes(getStatus(p))
    ).length;
    return { all, confirmed, pending, rejected };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const st = getStatus(p);
      if (activeTab === "confirmed")
        return ["confirmed", "paid", "approved"].includes(st);
      if (activeTab === "pending") return st === "pending";
      if (activeTab === "rejected")
        return ["rejected", "cancelled", "failed"].includes(st);
      return true;
    });
  }, [payments, activeTab]);

  useEffect(() => {
    setActivePage(1);
  }, [activeTab]);

  const totalPages = Math.ceil(filteredPayments.length / PAGE_SIZE) || 1;
  const pagedPayments = filteredPayments.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE
  );

  return (
    <div className="hb-page">
      <div className="dash-topbar">
        <div>
          <h4 className="dash-topbar-title">My Payments</h4>
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
        <h5 className="hb-details-title">Payment Details</h5>

        <div className="hb-tabs">
          <button
            type="button"
            className={`hb-tab ${activeTab === "all" ? "hb-tab-active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Payments ({tabCounts.all})
          </button>
          <button
            type="button"
            className={`hb-tab ${activeTab === "confirmed" ? "hb-tab-active" : ""}`}
            onClick={() => setActiveTab("confirmed")}
          >
            Confirmed ({tabCounts.confirmed})
          </button>
          <button
            type="button"
            className={`hb-tab ${activeTab === "pending" ? "hb-tab-active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending ({tabCounts.pending})
          </button>
          <button
            type="button"
            className={`hb-tab ${activeTab === "rejected" ? "hb-tab-active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            Rejected ({tabCounts.rejected})
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
          ) : pagedPayments.length === 0 ? (
            <div className="hb-empty">
              {activeTab === "all"
                ? "You have no payment records yet."
                : "No payments found for this filter."}
            </div>
          ) : (
            pagedPayments.map((p, i) => {
              const st = getStatus(p);
              const tone = statusTone(st);
              const dateValue =
                p?.payment_date || p?.created_at
                  ? moment(p?.payment_date || p?.created_at).format("MMM DD, YYYY")
                  : "—";

              return (
                <article key={p?.id || i} className="hb-card">
                  <div className="hb-card-top">
                    <div className="hb-card-top-left">
                      <div className="hb-hotel-icon">
                        <AiOutlineBars size={18} />
                      </div>
                      <div>
                        <h6 className="hb-hotel-name">
                          {p?.invoice_number || "Payment Request"}
                          {p?.booking_type ? ` — ${p.booking_type}` : ""}
                        </h6>
                        <p className="hb-hotel-location">
                          <span>
                            {p?.name || p?.email || "Payment submission"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className={`hb-status hb-status-${tone}`}>
                      {tone === "confirmed" && <FaCheckCircle size={14} />}
                      {tone === "pending" && <FaClock size={13} />}
                      {tone === "cancelled" && <FaTimesCircle size={14} />}
                      <span>{statusLabel(st)}</span>
                    </div>
                  </div>

                  <div className="hb-card-meta hb-card-meta-4">
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <FiFileText />
                      </span>
                      <div>
                        <span className="hb-meta-label">Booking Ref</span>
                        <strong>{p?.booking_reference || "—"}</strong>
                      </div>
                    </div>
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <FiHash />
                      </span>
                      <div>
                        <span className="hb-meta-label">Transaction ID</span>
                        <strong>{p?.transaction_id || "—"}</strong>
                      </div>
                    </div>
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <FiCalendar />
                      </span>
                      <div>
                        <span className="hb-meta-label">Payment Date</span>
                        <strong>{dateValue}</strong>
                      </div>
                    </div>
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <AiOutlineBars />
                      </span>
                      <div>
                        <span className="hb-meta-label">Booking Type</span>
                        <strong>{p?.booking_type || "—"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="hb-card-footer">
                    <div>
                      <span className="hb-amount-label">Total Amount</span>
                      <div className="hb-amount">
                        {p?.customer_currency || ""} {p?.amount ?? "-"}
                      </div>
                      {/* <div className={`hb-status hb-status-${tone}`}>
                        Payment:{" "}
                        {p?.payment_status
                          ? p.payment_status.charAt(0).toUpperCase() +
                          p.payment_status.slice(1)
                          : "-"}
                      </div> */}
                    </div>

                    {/* <div className="hb-card-actions">
                        <Link
                          href={voucherHref}
                          target="_blank"
                          className="hb-btn hb-btn-light"
                        >
                          <FaEye size={13} />
                          Voucher
                        </Link>
                        <Link
                          href={invoiceHref}
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
                      </div> */}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {!loading && filteredPayments.length > PAGE_SIZE && (
          <div className="hb-pagination">
            <span>
              Showing {(activePage - 1) * PAGE_SIZE + 1}–
              {Math.min(activePage * PAGE_SIZE, filteredPayments.length)} of{" "}
              {filteredPayments.length}
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

export default page;
