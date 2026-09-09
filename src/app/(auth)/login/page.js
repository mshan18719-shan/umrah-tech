"use client";
import React, { useState } from "react";
import styles from "./login.module.css";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MdEmail } from "react-icons/md";
import { IoWarning } from "react-icons/io5";
import { BiLockAlt } from "react-icons/bi";
import { FaShieldAlt, FaPlane } from "react-icons/fa";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2c/dashboard/send-otp`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();
      if (res.ok && data?.success !== false) {
        setSuccess(data?.message);
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      } else {
        setError(data?.message);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError("");
    setSuccess("");
  };

  return (
    <div className={styles.loginwrapper}>
      <span className={styles.decorRing1} aria-hidden="true" />
      <span className={styles.decorRing2} aria-hidden="true" />

      <div className={styles.loginShell}>
        <aside className={styles.brandPanel}>
          <div className={styles.brandPanelInner}>
            <div className={styles.brandLogoWrap}>
              <Image
                src="/images/navlogo.png"
                alt="UmrahTech"
                width={150}
                height={52}
                className={styles.brandLogo}
                priority
              />
            </div>

            <p className={styles.brandEyebrow}>Customer Portal</p>
            <h1 className={styles.brandTitle}>Welcome back</h1>
            <p className={styles.brandText}>
              Sign in securely to manage your Umrah bookings, view itineraries, and access your travel documents.
            </p>

            <ul className={styles.trustList}>
              <li>
                <span className={styles.trustIcon}><FaShieldAlt size={14} /></span>
                Secure OTP verification
              </li>
              <li>
                <span className={styles.trustIcon}><FaPlane size={14} /></span>
                Trusted Umrah &amp; Hajj specialists
              </li>
            </ul>
          </div>
        </aside>

        <div className={styles.formPanel}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <div className={styles.iconBadge}>
                <MdEmail size={26} color="#fff" />
              </div>
              <h2 className={styles.formTitle}>Sign In</h2>
              <p className={styles.formSubtitle}>
                Enter your email to receive a one-time passcode
              </p>
            </div>

            <div className={styles.divider}>Secure login</div>

            <form onSubmit={handleSubmit} className={styles.loginForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.inputLabel}>
                  Email Address
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <MdEmail size={17} />
                  </span>
                  <input
                    type="email"
                    className={styles.formInput}
                    id="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className={styles.errorAlert}>
                  <IoWarning size={15} />
                  {error}
                </div>
              )}

              {success && (
                <div className={styles.successAlert}>
                  {success}
                </div>
              )}

              <button
                type="submit"
                className={styles.loginbtn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Sending OTP…
                  </>
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>

            <p className={styles.footerNote}>
              <BiLockAlt size={14} />
              A 5-digit verification code will be sent to your email
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
