"use client";
import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaCreditCard, FaLock, FaCheck, FaBolt, FaTimes } from "react-icons/fa";
import "./BookingLoader.css"; // 👈 Import the animation CSS you shared

export default function BookingLoader({ showLoader, error, onComplete, confirmStatus = "pending" }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [hasCalledComplete, setHasCalledComplete] = useState(false);

    const steps = [
        { id: "validate", label: "Validating Details", icon: <FaMapMarkerAlt />, duration: 2000 },
        { id: "payment", label: "Processing Payment", icon: <FaCreditCard />, duration: 2000 },
        { id: "confirm", label: "Confirming Booking", icon: <FaCheck />, duration: 9000000000 },
    ];

    useEffect(() => {
        // Don't auto-advance on the last step
        if (currentStep >= steps.length - 1) {
            return;
        }
        const timer = setTimeout(() => setCurrentStep((prev) => prev + 1), steps[currentStep].duration);
        return () => clearTimeout(timer);
    }, [currentStep]);

    // Handle completion based on confirmStatus
    useEffect(() => {
        if (currentStep === steps.length - 1 && (confirmStatus === "success" || confirmStatus === "error")) {
            setIsComplete(true);
        }
    }, [currentStep, confirmStatus, steps.length]);

    // Call onComplete after last step if no error
    useEffect(() => {
        if (isComplete && !error && onComplete && !hasCalledComplete) {
            setHasCalledComplete(true);
            onComplete();
        }
    }, [isComplete, error, onComplete, hasCalledComplete]);

    return (
        <div style={{ zIndex: 9999 }} className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-75 backdrop-blur fade-in">
            <div className="card shadow-lg border-0" style={{ maxWidth: "500px", width: "100%" }}>
                <div className="card-body text-center">
                    {/* Header */}
                    <h4 className="fw-bold mb-2">
                        Processing Your Booking
                    </h4>
                    <p className="text-muted mb-4">
                        Please wait while we complete your reservation...
                    </p>

                    {/* Steps */}
                    <div className="mb-4">
                        {steps.map((step, index) => {
                            const isActive = index === currentStep && !isComplete;
                            const isCompleted = index < currentStep || isComplete;

                            return (
                                <div
                                    key={step.id}
                                    className={`d-flex align-items-center p-3 mb-3 rounded-3 border position-relative ${isCompleted
                                            ? confirmStatus === "error" && step.id === 'confirm' ? 'border-danger bg-danger-subtle animate-slide-in' : "border-success bg-success-subtle animate-slide-in"
                                            : isActive
                                                ? "border-warning bg-warning-subtle animate-pulse-glow"
                                                : "border-secondary bg-light"
                                        }`}
                                    style={{ transition: "all 0.4s ease" }}
                                >
                                    {/* Step Icon */}
                                    <div
                                        className={`d-flex justify-content-center align-items-center rounded-circle me-3 ${isActive ? "animate-spin-smooth" : ""
                                            }`}
                                        style={{
                                            width: "45px",
                                            height: "45px",
                                            backgroundColor: isCompleted
                                                ? confirmStatus === "error" && step.id === 'confirm' ? '#b80909b2' : "#198754"
                                                : isActive
                                                    ? "#ffc107"
                                                    : "#dee2e6",
                                            color: isCompleted || isActive ? "#fff" : "#6c757d",
                                            fontSize: "18px",
                                            transition: "all 0.3s ease",
                                        }}
                                    >
                                        {isCompleted ? <FaCheck /> : step.icon}
                                    </div>

                                    {/* Step Label */}
                                    <div className="text-start flex-grow-1">
                                        <p
                                            className={`mb-0 fw-semibold ${isCompleted
                                                    ? confirmStatus === "error" && step.id === 'confirm' ? 'text-danger' : "text-success"
                                                    : isActive
                                                        ? "text-warning"
                                                        : "text-muted"
                                                }`}
                                        >
                                            {step.label}
                                        </p>
                                        <small className="text-muted">
                                            {isCompleted ? "Completed" : isActive ? "Processing..." : "Pending"}
                                        </small>
                                    </div>

                                    {/* Status Checkmark */}
                                    {isCompleted && (
                                        <div>
                                            {confirmStatus === "error" && step.id === 'confirm' ? (
                                                <FaTimes className="text-danger ms-2 animate-bounce-subtle" style={{ fontSize: "18px" }} />

                                            ) : (
                                                <FaCheck className="text-success ms-2 animate-bounce-subtle" style={{ fontSize: "18px" }} />

                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress bar */}
                    <div className="progress mb-4" style={{ height: "6px" }}>
                        <div
                            className={`progress-bar ${confirmStatus === "error" ? "bg-danger" : confirmStatus === "success" ? "bg-success" : "bg-warning"} progress-bar-striped progress-bar-animated`}
                            style={{
                                width: isComplete
                                    ? "100%"
                                    : `${(currentStep / steps.length) * 100}%`,
                                transition: "width 0.5s ease-out",
                            }}
                        ></div>
                    </div>

                    <p className="text-muted small">
                        Step {currentStep + 1} of {steps.length}
                    </p>

                    {/* Error message after last step */}
                    {/* {isComplete && confirmStatus === "error" && error && (
              <div className="alert alert-danger mt-3" role="alert">
                {error}
              </div>
            )} */}
                </div>

                {/* Step Indicators */}
                <div className="d-flex justify-content-center gap-2 mb-3">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`rounded-pill ${index <= currentStep || isComplete
                                    ? "bg-warning"
                                    : "bg-secondary"
                                }`}
                            style={{
                                height: "6px",
                                width: index <= currentStep || isComplete ? "25px" : "8px",
                                transition: "all 0.3s ease",
                            }}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
