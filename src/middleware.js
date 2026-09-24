import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const DASHBOARD_PREFIXES = [
  "/dashboard",
  "/hotel-bookings",
  "/transfer-bookings",
  "/activity-bookings",
  "/flight-bookings",
  "/package-bookings",
  "/account-statement",
  "/my-payments",
  "/make-payments",
];

const OTP_TTL_MS = 60 * 60 * 1000; // 1 hour — must match authOptions session logic

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  const isDashboard = DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (!isDashboard) return NextResponse.next();

  // ── Step 1: Require a valid NextAuth session ─────────────────────────────
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ── Step 2: Require OTP verification within the last 1 hour ─────────────
  const otpVerifiedAt = Number(token.otpVerifiedAt) || 0;
  if (!otpVerifiedAt || Date.now() - otpVerifiedAt > OTP_TTL_MS) {
    // OTP expired — send user back to email login to request a fresh OTP
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/hotel-bookings/:path*",
    "/transfer-bookings/:path*",
    "/activity-bookings/:path*",
    "/flight-bookings/:path*",
    "/package-bookings/:path*",
    "/account-statement/:path*",
    "/my-payments/:path*",
    "/make-payments/:path*",
  ],
};

