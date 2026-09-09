"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import OtpInput from "react-otp-input";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { HiOutlineSparkles } from "react-icons/hi2";
import { MdEmail } from "react-icons/md";
import { IoWarning } from "react-icons/io5";
import { FaShieldAlt, FaPlane, FaClock } from "react-icons/fa";
import styles from "../login/login.module.css";

const RESEND_COOLDOWN = 60; // seconds

export default function VerifyOtpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromQuery = searchParams.get("email") || "";
  const email = emailFromQuery || session?.user?.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

  useEffect(() => {
    if (status === "unauthenticated" && !emailFromQuery) {
      router.replace("/login");
    }
  }, [status, emailFromQuery, router]);

  const sendOtp = useCallback(async () => {
    if (!email) return;
    setSending(true);
    setError("");
    setSuccess("");
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
        startCooldown();
      } else {
        setError(data?.message);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }, [email, startCooldown]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (otp.length !== 5) {
      setError("Please enter the complete 5-digit OTP.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    const result = await signIn("credentials", {
      email,
      otp,
      redirect: false,
    });

    if (!result?.ok) {
      setError(result?.error);
      setOtp("");
      setLoading(false);
      return;
    }

    setSuccess("Verified! Redirecting...");
    router.push(searchParams.get("redirect") || "/dashboard");
  };

  useEffect(() => {
    if (otp.length === 5) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  if (status === "loading" && !emailFromQuery) {
    return (
      <div className={styles.loginwrapper}>
        <div className={styles.loadingWrap}>
          <div className="spinner-border" style={{ color: "#1B3B6F" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

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

            <p className={styles.brandEyebrow}>Security Verification</p>
            <h1 className={styles.brandTitle}>Almost there</h1>
            <p className={styles.brandText}>
              We&apos;ve sent a one-time passcode to your email. Enter it below to securely access your account.
            </p>

            <ul className={styles.trustList}>
              <li>
                <span className={styles.trustIcon}>
                  <FaShieldAlt size={14} />
                </span>
                Encrypted &amp; secure login
              </li>
              <li>
                <span className={styles.trustIcon}>
                  <FaClock size={14} />
                </span>
                Code valid for 1 hour
              </li>
              <li>
                <span className={styles.trustIcon}>
                  <FaPlane size={14} />
                </span>
                Trusted Umrah &amp; Hajj specialists
              </li>
            </ul>
          </div>
        </aside>

        <div className={styles.formPanel}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <div className={styles.iconBadgeRound}>
                <FaShieldAlt size={26} color="#fff" />
              </div>

              <div className={styles.otpEyebrow}>
                <HiOutlineSparkles size={15} />
                Security Verification
              </div>

              <h2 className={styles.formTitle}>Enter Your OTP</h2>

              {email && (
                <p className={styles.emailBadge}>
                  <MdEmail size={15} />
                  <span>
                    Code sent to{" "}
                    <strong>{maskEmail(email)}</strong>
                  </span>
                </p>
              )}
            </div>

            <div className={styles.divider}>5-digit code</div>

            <form onSubmit={handleSubmit} className={styles.otpForm}>
              <div className={styles.otpInputRow}>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  numInputs={5}
                  renderSeparator={<span className={styles.otpSeparator} />}
                  renderInput={(props) => (
                    <input
                      {...props}
                      className={[
                        styles.otpDigit,
                        props.value ? styles.otpDigitFilled : "",
                        error ? styles.otpDigitError : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={loading}
                    />
                  )}
                  shouldAutoFocus
                />
              </div>

              {error && (
                <div className={styles.errorAlert} role="alert">
                  <IoWarning size={15} />
                  {error}
                </div>
              )}

              {success && !error && (
                <div className={styles.successAlert} role="status">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className={styles.loginbtn}
                disabled={loading || otp.length !== 5}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Verifying…
                  </>
                ) : (
                  "Verify OTP"
                )}
              </button>
            </form>

            <div className={styles.otpLinks}>
              <p>
                Wrong email?{" "}
                <Link href="/login" className={styles.authLink}>
                  Change email
                </Link>
              </p>
              <p>
                Didn&apos;t receive it?{" "}
                {cooldown > 0 ? (
                  <span className={styles.cooldownText}>
                    Resend in {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={sending}
                    className={styles.authLinkBtn}
                  >
                    {sending ? "Sending…" : "Resend OTP"}
                  </button>
                )}
              </p>
            </div>

            <p className={styles.footerNote}>
              <FaClock size={13} />
              This verification is valid for <strong>1 hour</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** john@example.com → jo**@example.com */
function maskEmail(email) {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 2)}${"*".repeat(Math.max(user.length - 2, 2))}@${domain}`;
}
