"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Modal, Pagination } from "@mantine/core";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaImage,
} from "react-icons/fa";
import { AiOutlineBars } from "react-icons/ai";
import { FiFileText, FiCalendar, FiHash } from "react-icons/fi";
import moment from "moment";
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

/** Resolve nested payload shapes from payment-requests API */
function resolvePaymentFields(p) {
  const nested = Array.isArray(p?.data) ? p.data[0] : (p?.data && typeof p.data === "object" ? p.data : null);
  const source = nested || p || {};
  return {
    amount: source.amount ?? p?.amount ?? p?.payment_amount ?? null,
    currency:
      source.currency ||
      source.currency_code ||
      source.customer_currency ||
      p?.currency ||
      p?.currency_code ||
      p?.customer_currency ||
      "",
    bookingReference: source.booking_reference ?? p?.booking_reference ?? null,
    snapshotUrl:
      source.invoice_snapshot_url ||
      source.invoice_snapshot ||
      p?.invoice_snapshot_url ||
      p?.invoice_snapshot ||
      null,
    transactionId: source.transaction_id ?? p?.transaction_id ?? null,
    paymentDate: source.payment_date ?? p?.payment_date ?? p?.created_at ?? null,
    bookingType: source.booking_type ?? p?.booking_type ?? source.service_type ?? p?.service_type ?? null,
    invoiceNumber: source.invoice_number ?? p?.invoice_number ?? null,
    email: source.email ?? p?.email ?? p?.name ?? null,
  };
}

function page() {
  const { data: session } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [activePage, setActivePage] = useState(1);
  const [snapshotModal, setSnapshotModal] = useState({ opened: false, url: "", title: "" });

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
          "/login"
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

  const openSnapshot = (url, title) => {
    if (!url) return;
    setSnapshotModal({ opened: true, url, title: title || "Payment Proof" });
  };

  const closeSnapshot = () => {
    setSnapshotModal({ opened: false, url: "", title: "" });
  };

  return (
    <div className="hb-page">
      <Modal
        opened={snapshotModal.opened}
        onClose={closeSnapshot}
        title={snapshotModal.title || "Payment Proof"}
        centered
        size="lg"
        radius="md"
        padding="md"
      >
        <div style={{ textAlign: "center" }}>
          {snapshotModal.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={snapshotModal.url}
              alt="Payment proof snapshot"
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
          ) : (
            <p className="text-muted mb-0">No snapshot available.</p>
          )}
          {snapshotModal.url && (
            <div className="mt-3">
              <a
                href={snapshotModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hb-btn hb-btn-primary"
                style={{ display: "inline-flex", textDecoration: "none" }}
              >
                Open in new tab
              </a>
            </div>
          )}
        </div>
      </Modal>

      <div className="dash-topbar">
        <div>
          <h4 className="dash-topbar-title">My Payments</h4>
          <p className="dash-topbar-sub">
            Welcome back{userName ? `, ${userName}` : ""}!
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="dash-topbar-avatar">{userInitial}</div>
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
              const fields = resolvePaymentFields(p);
              const dateValue = fields.paymentDate
                ? moment(fields.paymentDate).format("MMM DD, YYYY")
                : "—";
              const amountDisplay =
                fields.amount != null && fields.amount !== ""
                  ? `${fields.currency ? `${fields.currency} ` : ""}${fields.amount}`
                  : "-";

              return (
                <article key={p?.id || i} className="hb-card">
                  <div className="hb-card-top">
                    <div className="hb-card-top-left">
                      <div className="hb-hotel-icon">
                        <AiOutlineBars size={18} />
                      </div>
                      <div>
                        <h6 className="hb-hotel-name">
                          {fields.invoiceNumber || "Payment Request"}
                          {fields.bookingType ? ` — ${fields.bookingType}` : ""}
                        </h6>
                        <p className="hb-hotel-location">
                          <span>
                            {fields.email || "Payment submission"}
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
                        {fields.bookingReference ? (
                          <strong>{fields.bookingReference}</strong>
                        ) : fields.snapshotUrl ? (
                          <button
                            type="button"
                            className="hb-btn hb-btn-light"
                            style={{
                              padding: "4px 10px",
                              fontSize: "0.78rem",
                              marginTop: 2,
                            }}
                            onClick={() =>
                              openSnapshot(
                                fields.snapshotUrl,
                                fields.invoiceNumber || "Payment Proof"
                              )
                            }
                          >
                            <FaImage size={12} />
                            View Snapshot
                          </button>
                        ) : (
                          <strong>—</strong>
                        )}
                      </div>
                    </div>
                    <div className="hb-meta-item">
                      <span className="hb-meta-icon">
                        <FiHash />
                      </span>
                      <div>
                        <span className="hb-meta-label">Transaction ID</span>
                        <strong>{fields.transactionId || "—"}</strong>
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
                        <strong>{fields.bookingType || "—"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="hb-card-footer">
                    <div>
                      <span className="hb-amount-label">Total Amount</span>
                      <div className="hb-amount">{amountDisplay}</div>
                    </div>

                    {fields.snapshotUrl && fields.bookingReference && (
                      <div className="hb-card-actions">
                        <button
                          type="button"
                          className="hb-btn hb-btn-light"
                          onClick={() =>
                            openSnapshot(
                              fields.snapshotUrl,
                              fields.invoiceNumber || "Payment Proof"
                            )
                          }
                        >
                          <FaImage size={13} />
                          View Snapshot
                        </button>
                      </div>
                    )}
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
