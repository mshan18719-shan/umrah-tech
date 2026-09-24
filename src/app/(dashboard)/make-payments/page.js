"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  FaCloudUploadAlt,
  FaTimesCircle,
  FaCheckCircle,
  FaHome,
  FaFileInvoice,
} from "react-icons/fa";
import { FiFileText, FiCalendar, FiHash } from "react-icons/fi";
import { BsUpcScan } from "react-icons/bs";
import { MdPayments } from "react-icons/md";
import { useSession } from "next-auth/react";
import { Select } from "@mantine/core";
import moment from "moment";
import { DateInput } from "@mantine/dates";
import { useRouter } from "next/navigation";
import Link from "next/link";

function page() {
  const { data: session } = useSession();
  const router = useRouter();
  const [invoiceNo, setInvoiceNo] = useState("");
  const [bookingref, setBookingRef] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [image, setImage] = useState(null);
  const [date, setDate] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingids, setBookingIds] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    const { email, otp } = session.user;
    if (!email || !otp) return;
    fetchinvoice();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!invoiceNo) {
      setErrorMessage("Please select an Invoice No.");
      return;
    }
    if (!transactionId) {
      setErrorMessage("Please enter a Transaction ID.");
      return;
    }
    if (!date) {
      setErrorMessage("Please select a payment date.");
      return;
    }
    if (!image) {
      setErrorMessage("Please upload payment proof before submitting.");
      return;
    }
    setIsSubmitting(true);
    const { email, otp } = session.user;
    try {
      const formtoSendData = new FormData();
      formtoSendData.append("service_id", invoiceNo);
      formtoSendData.append("service_type", serviceType);
      formtoSendData.append("booking_reference", bookingref);
      formtoSendData.append("transaction_id", transactionId);
      formtoSendData.append("invoice_snapshot", image);
      formtoSendData.append("payment_date", moment(date).format("YYYY-MM-DD"));
      formtoSendData.append("email", email);
      formtoSendData.append("otp", otp);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/payment-request/create`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formtoSendData,
        }
      );
      const data = await response.json();

      if (!data?.success && data?.message?.toLowerCase().includes("otp")) {
        router.push(
          "/login"
        );
        return;
      }

      if (response.ok) {
        setSubmitted(true);
        setInvoiceNo("");
        setServiceType("");
        setBookingRef("");
        setTransactionId("");
        setDate(null);
        handleRemoveImage();
        fetchinvoice();
      } else {
        setErrorMessage(
          data?.message || "Failed to submit payment. Please try again."
        );
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingSelect = (value) => {
    const selected = bookingids?.find((item) => item.invoice_number === value);
    setInvoiceNo(selected.id);
    setBookingRef(selected?.invoice_number || "");
    setServiceType(selected?.type || "");
  };

  const fetchinvoice = async () => {
    const { email, otp } = session.user;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/pending-bookings-ids`,
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

      setBookingIds(data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="mp-page">
      {submitted ? (
        <div className="mp-panel mp-success-panel">
          <FaCheckCircle size={52} color="#2e7d63" className="mb-3" />
          <h5 className="mp-success-title">Payment Submitted!</h5>
          <p className="mp-success-text">
            Your payment details have been received and are under review.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setInvoiceNo("");
              setTransactionId("");
              handleRemoveImage();
            }}
            className="mp-btn mp-btn-primary"
          >
            Submit Another
          </button>
        </div>
      ) : (
        <div className="mp-panel">
          <div className="mp-panel-header">
            <div className="mp-panel-header-icon">
              <MdPayments size={22} />
            </div>
            <h4 className="mp-panel-title">Payment Details</h4>
          </div>

          <form onSubmit={handleSubmit} className="mp-form">
            <div className="mp-field-card">
              <div className="mp-field-icon">
                <FiFileText />
              </div>
              <div className="mp-field-body">
                <label className="mp-field-label">
                  Invoice No <span className="mp-required">*</span>
                </label>
                <Select
                  placeholder="Enter invoice number..."
                  onChange={handleBookingSelect}
                  autoSelectOnBlur
                  searchable
                  clearable
                  classNames={{ input: "mp-mantine-input" }}
                  data={
                    bookingids
                      ?.filter((item) => item.invoice_number)
                      .map((item) => ({
                        value: item.invoice_number,
                        label: item.invoice_number + " - " + item.type,
                      })) || []
                  }
                />
              </div>
            </div>

            <div className="mp-field-card">
              <div className="mp-field-icon">
              <BsUpcScan />
              </div>
              <div className="mp-field-body">
                <label className="mp-field-label">
                  Transaction ID <span className="mp-required">*</span>
                </label>
                <input
                  type="text"
                  className="mp-text-input"
                  name="transaction_id"
                  placeholder="TXN-20240227-00123"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
            </div>

            <div className="mp-field-card">
              <div className="mp-field-icon">
                <FiCalendar />
              </div>
              <div className="mp-field-body">
                <label className="mp-field-label">
                  Select Date <span className="mp-required">*</span>
                </label>
                <DateInput
                  value={date}
                  name="date"
                  onChange={setDate}
                  valueFormat="DD-MM-YYYY"
                  placeholder="Select a date..."
                  classNames={{ input: "mp-mantine-input" }}
                />
              </div>
            </div>

            <div className="mp-upload-wrap">
              <label className="mp-field-label mb-2 d-block">
                Payment Proof <span className="mp-required">*</span>
              </label>

              {!preview ? (
                <div
                  className="mp-upload-zone"
                  onClick={() => fileRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
                  }}
                >
                  <FaCloudUploadAlt size={42} className="mp-upload-cloud" />
                  <p className="mp-upload-title">
                    Click to upload receipt / screenshot
                  </p>
                  <p className="mp-upload-hint">
                    PNG, JPG, JPEG, or PDF — max 5 MB
                  </p>
                  <button
                    type="button"
                    className="mp-btn mp-btn-primary mp-upload-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileRef.current?.click();
                    }}
                  >
                    Upload A File
                  </button>
                </div>
              ) : (
                <div className="mp-preview-wrap">
                  <img src={preview} alt="Payment proof" className="mp-preview-img" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="mp-preview-remove"
                    aria-label="Remove file"
                  >
                    <FaTimesCircle size={16} color="#c0392b" />
                  </button>
                  <div className="mp-preview-name">{image?.name}</div>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf,application/pdf"
                onChange={handleImageChange}
                style={{ display: "none" }}
                name="transaction_image"
              />
            </div>

            {errorMessage && (
              <div
                className="alert alert-danger alert-dismissible fade show mb-3"
                role="alert"
              >
                {errorMessage}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setErrorMessage("")}
                />
              </div>
            )}

            <div className="mp-form-actions">
              <Link href="/dashboard" className="mp-btn mp-btn-light">
                <FaHome size={14} />
                Back To Home
              </Link>
              <button
                type="submit"
                className="mp-btn mp-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaFileInvoice size={14} />
                    Submit Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default page;
