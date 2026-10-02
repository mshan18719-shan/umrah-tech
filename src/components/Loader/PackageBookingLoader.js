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
        <div className="pbl-overlay" role="dialog" aria-modal="true" aria-live="polite">
            <div className="pbl-card">
                {/* Header */}
                <div className="pbl-header">
                    <h4 className="pbl-title">Processing Your Booking</h4>
                    <p className="pbl-subtitle">
                        Please wait while we complete your booking...
                    </p>
                </div>

                {/* ✅ Steps */}
                <div className="pbl-steps">
                    {steps.map((step, index) => {
                        const isActive = index === currentStep && !isComplete;
                        const isCompleted = index < currentStep && confirmStatus !== "error";
                        // const isFailed = confirmStatus === "error" && index === currentStep;
                        const isFailed = failedStep === index;

                        const state = isFailed
                            ? "failed"
                            : isCompleted
                            ? "completed"
                            : isActive
                            ? "active"
                            : "pending";

                        return (
                            <div key={step.id} className={`pbl-step pbl-step--${state}`}>
                                {/* ICON */}
                                <div className="pbl-step-icon">
                                    {isCompleted ? <FaCheck /> : isFailed ? <FaTimes /> : step.icon}
                                    {isActive && <span className="pbl-step-ring" />}
                                </div>

                                {/* LABEL */}
                                <div className="pbl-step-text">
                                    <p className="pbl-step-label">{step.label}</p>
                                    <small className="pbl-step-status">
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
                <div className="pbl-progress">
                    <div
                        className={`pbl-progress-bar ${
                            confirmStatus === "error"
                                ? "pbl-progress-bar--error"
                                : confirmStatus === "success"
                                ? "pbl-progress-bar--success"
                                : ""
                        }`}
                        style={{
                            width: isComplete
                                ? "100%"
                                : `${(currentStep / (steps.length - 1)) * 100}%`,
                        }}
                    ></div>
                </div>

                {/* ✅ Show error message */}
                {confirmStatus === "error" && (
                    <div className="pbl-error">
                        {errorMessage || "Something went wrong. Please try again."}
                    </div>
                )}

                <p className="pbl-footer">
                    Step {currentStep + 1} of {steps.length}
                </p>
            </div>
        </div>
    );
}