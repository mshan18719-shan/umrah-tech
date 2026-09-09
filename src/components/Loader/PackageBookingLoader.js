"use client";
import React, { useState, useEffect } from "react";
import {
    FaMapMarkerAlt,
    FaCreditCard,
    FaTimes,
    FaCheck,
    FaCalendarCheck
} from "react-icons/fa";
import "./BookingLoader.css";

export default function PackageBookingLoader({
    showLoader,
    confirmStatus = "pending", // "pending" | "booking" | "payment" | "success" | "error"
    errorMessage,
    componentName
}) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [failedStep, setFailedStep] = useState(null);


    const steps = [
        { id: "validate", label: "Validating Details", icon: <FaMapMarkerAlt /> },
        { id: "reserve", label: `Reserving Your ${componentName}`, icon: <FaCalendarCheck /> },
        { id: "payment", label: "Generating Payment Link", icon: <FaCreditCard /> },
    ];

    // ✅ Control step movement based on confirmStatus
    useEffect(() => {
        if (confirmStatus === "pending") {
            setCurrentStep(0);
        }
         if (confirmStatus === "validate") {
            setCurrentStep(1);
        }
        if (confirmStatus === "reserve") {
            setCurrentStep(2);
        }
        if (confirmStatus === "payment") {
            setCurrentStep(3);
        }
        if (confirmStatus === "success") {
            setIsComplete(true);
        }
        if (confirmStatus === "error") {
            setFailedStep(currentStep);
            setIsComplete(true);
        }
    }, [confirmStatus]);

    if (!showLoader) return null;

    return (
        <div
            style={{ zIndex: 9999 }}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-75"
        >
            <div className="card shadow-lg border-0" style={{ maxWidth: "500px", width: "100%" }}>
                <div className="card-body text-center mt-3">
                    <h4 className="fw-bold mb-2">Processing Your Booking</h4>
                    <p className="text-muted mb-4">
                        Please wait while we complete your booking...
                    </p>

                    {/* ✅ Steps */}
                    <div className="mb-4">
                        {steps.map((step, index) => {
                            const isActive = index === currentStep && !isComplete;
                            const isCompleted = index < currentStep && confirmStatus !== "error";
                            // const isFailed = confirmStatus === "error" && index === currentStep;
                            const isFailed = failedStep === index;
                            return (
                                <div
                                    key={step.id}
                                    className={`d-flex align-items-center p-3 mb-3 rounded-3 border
                                        ${
                                            isFailed
                                                ? "border-danger bg-danger-subtle"
                                                : isCompleted
                                                ? "border-success bg-success-subtle"
                                                : isActive
                                                ? "border-warning bg-warning-subtle"
                                                : "border-secondary bg-light"
                                        }`}
                                    style={{ transition: "all 0.4s ease" }}
                                >
                                    {/* ICON */}
                                    <div
                                        className={`d-flex justify-content-center align-items-center rounded-circle me-3`}
                                        style={{
                                            width: "45px",
                                            height: "45px",
                                            backgroundColor: isFailed
                                                ? "#dc3545"
                                                : isCompleted
                                                ? "#198754"
                                                : isActive
                                                ? "#ffc107"
                                                : "#dee2e6",
                                            color: "#fff",
                                        }}
                                    >
                                        {isCompleted ? <FaCheck /> : isFailed ? <FaTimes /> : step.icon}
                                    </div>

                                    {/* LABEL */}
                                    <div className="text-start flex-grow-1">
                                        <p className="mb-0 fw-semibold">
                                            {step.label}
                                        </p>
                                        <small className="text-muted">
                                            {isFailed
                                                ? "Failed"
                                                : isCompleted
                                                ? "Completed"
                                                : isActive
                                                ? "Processing..."
                                                : "Pending"}
                                        </small>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ✅ Progress bar */}
                    <div className="progress mb-4" style={{ height: "6px" }}>
                        <div
                            className={`progress-bar ${
                                confirmStatus === "error"
                                    ? "bg-danger"
                                    : confirmStatus === "success"
                                    ? "bg-success"
                                    : "bg-warning"
                            } progress-bar-striped progress-bar-animated`}
                            style={{
                                width: isComplete
                                    ? "100%"
                                    : `${(currentStep / (steps.length - 1)) * 100}%`,
                                transition: "width 0.5s ease-out",
                            }}
                        ></div>
                    </div>

                    {/* ✅ Show error message */}
                    {confirmStatus === "error" && (
                        <div className="alert alert-danger mt-2">
                            {errorMessage || "Something went wrong. Please try again."}
                        </div>
                    )}

                    <p className="text-muted small">
                        Step {currentStep + 1} of {steps.length}
                    </p>
                </div>
            </div>
        </div>
    );
}
