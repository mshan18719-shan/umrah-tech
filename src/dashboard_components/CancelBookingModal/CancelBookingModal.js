"use client";
import React, { useState } from "react";
import { Modal } from "@mantine/core";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaExclamationTriangle } from "react-icons/fa";
export default function CancelBookingModal({
    opened,
    onClose,
    bookingReference,
    provider,
    bookingId,
    type,
    endPoint,
    onSuccess,
}) {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const handleClose = () => {
        setReason("");
        setError("");
        setLoading(false);
        setConfirmed(false);
        onClose();
    };
    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError("Please enter a reason for cancellation.");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}${endPoint}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        provider,
                        cancellation_reason: reason.trim(),
                        ...(type === 'hotel' ? { bookingReference: bookingReference , bookingId} : type === 'activity'  || type === 'package' ? { booking_reference: bookingReference , booking_id: bookingId} :  {booking_reference: bookingReference}),
                    }),
                },
            );
          
            const data = await response.json();
            if (response.ok && (data?.success !== false)) {
                setConfirmed(true);
                if (onSuccess) onSuccess(bookingReference, bookingId);
            } else {
                setError(data?.message);
            }
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <div className="cbm-modal-title">
                    <RiDeleteBin6Line size={18} color="#dc2626" />
                    <span>Cancel Booking</span>
                </div>
            }
            centered
            overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
            size="md"
        >
            {confirmed ? (
                <div className="cbm-success">
                    <div className="cbm-success-icon">✓</div>
                    <h6 className="cbm-success-title">Booking Cancelled</h6>
                    <p className="cbm-success-msg">
                        Booking <strong>{bookingReference}</strong> has been successfully
                        cancelled.
                    </p>
                    <button className="cbm-btn-primary" onClick={handleClose}>
                        Close
                    </button>
                </div>
            ) : (
                <>
                    {/* Warning banner */}
                    <div className="cbm-warning-banner">
                        <FaExclamationTriangle size={15} color="#92400e" />
                        <span>
                            This action cannot be undone. The booking{" "}
                            <strong>{bookingReference}</strong> will be permanently cancelled.
                        </span>
                    </div>

                    {/* Reason textarea */}
                    <div className="cbm-field">
                        <label className="cbm-label">
                            Cancellation Reason <span className="cbm-required">*</span>
                        </label>
                        <textarea
                            className="cbm-textarea"
                            rows={4}
                            placeholder="Please describe your reason for cancellation..."
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (error) setError("");
                            }}
                            disabled={loading}
                        />
                        {error && <p className="cbm-error">{error}</p>}
                    </div>

                    {/* Actions */}
                    <div className="cbm-actions">
                        <button
                            className="cbm-btn-secondary"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Keep Booking
                        </button>
                        <button
                            className="cbm-btn-danger"
                            onClick={handleSubmit}
                            disabled={loading || !reason.trim()}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status" />
                                    Cancelling…
                                </>
                            ) : (
                                <>
                                    <RiDeleteBin6Line size={14} />
                                    Confirm Cancellation
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
}
