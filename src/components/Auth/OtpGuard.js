"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const OTP_TTL_MS = 60 * 60 * 1000; // 1 hour — must match middleware

export default function OtpGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    const otpVerifiedAt = Number(session?.user?.otpVerifiedAt) || 0;
    if (!otpVerifiedAt || Date.now() - otpVerifiedAt > OTP_TTL_MS) {
      router.replace("/login");
    }
  }, [status, session?.user?.otpVerifiedAt, router]);

  if (status !== "authenticated") return null;

  const otpVerifiedAt = Number(session?.user?.otpVerifiedAt) || 0;
  if (!otpVerifiedAt || Date.now() - otpVerifiedAt > OTP_TTL_MS) return null;

  return children;
}

