"use client";

import { useEffect, useState } from "react";
import CookieConsent from "react-cookie-consent";
import { useRouter } from "next/navigation";

export default function VipCookieConsent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid SSR/client cookie mismatch (hydration error on invoice/voucher tabs)
  if (!mounted) return null;

  return (
    <CookieConsent
      location="bottom"
      enableDeclineButton
      buttonText="Accept All"
      declineButtonText="Reject"
      cookieName="travel_cookie_consent"
      style={{
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "20px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        zIndex: 9999
      }}
      contentStyle={{
        flex: "1 1 60%",
        margin: "0",
        fontSize: "14px",
        color: "#e2e8f0",
      }}
      buttonStyle={{
        background: "#22c55e",
        color: "#fff",
        fontSize: "14px",
        borderRadius: "8px",
        padding: "10px 18px",
        fontWeight: "600",
        border: "none",
      }}
      declineButtonStyle={{
        background: "transparent",
        color: "#f87171",
        fontSize: "14px",
        borderRadius: "8px",
        padding: "10px 18px",
        fontWeight: "500",
        border: "1px solid #f87171",
        marginRight: "10px",
      }}
      expires={365}
    >
      <strong style={{ color: "#fff" }}>We value your privacy</strong> <br />
      We use cookies to enhance your booking experience, analyze traffic,
      and personalize content. By clicking "Accept All", you agree to our use
      of cookies.
      <span
        onClick={() => router.push("/privacy-policy")}
        style={{
          marginLeft: "8px",
          textDecoration: "underline",
          cursor: "pointer",
          color: "#38bdf8"
        }}
      >
        Read Policy
      </span>
    </CookieConsent>
  );
}
