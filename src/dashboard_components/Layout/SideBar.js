"use client";
import Link from "next/link";
import { HiOutlineLogout } from "react-icons/hi";
import { signOut, useSession } from "next-auth/react";
// import bootstrap from "bootstrap/dist/js/bootstrap.bundle";
import {
  FaTachometerAlt,
  FaHotel,
  FaPlane,
  FaCar,
  FaMoneyBill,
  FaBook,
  FaDigitalTachograph,
} from "react-icons/fa";
import { RiShip2Fill } from "react-icons/ri";
import { MdAttractions } from "react-icons/md";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { IoBed, IoCard } from "react-icons/io5";
import Image from "next/image";
export default function SideBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || "User Name";
  const userEmail = session?.user?.email || "";
  const userInitial = userName?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = async () => {
    // Clear any stale OTP data
    localStorage.removeItem("otp_verification");
    await signOut({ callbackUrl: "/login" });
  };
  const isActive = (path) => (pathname === path ? "active" : "");

  useEffect(() => {
    const offcanvasEl = document.getElementById("sidebarOffcanvas");
    if (offcanvasEl && offcanvasEl.classList.contains("show")) {
      offcanvasEl.classList.remove("show");
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      const backdrop = document.querySelector(".offcanvas-backdrop");
      if (backdrop) backdrop.remove();
    }
  }, [pathname]);

  return (
    <>
      {/* Offcanvas Sidebar for mobile */}

      <div
        className="offcanvas offcanvas-start d-block d-md-none"
        tabIndex="-1"
        id="sidebarOffcanvas"
        aria-labelledby="sidebarOffcanvasLabel"
      >
        <div className="offcanvas-header">
          <Image
            src="/images/navlogo.png"
            alt="Logo"
            className="w-auto"
            width={100}
            quality={100}
            height={32}
          />
          <button
            type="button"
            className="btn-close text-white"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body p-0">
          <aside className="sidebar">
            <div className="sidebar-profile">
              <div className="sidebar-profile-avatar">{userInitial}</div>
              <div className="sidebar-profile-info">
                <span className="sidebar-profile-name">{userName}</span>
                <span className="sidebar-profile-email">{userEmail}</span>
              </div>
            </div>
            <ul className="sidebar-nav mt-2">
              <Link
                className={`decoration-non ${isActive("/dashboard")}`}
                href="/dashboard"
              >
                <li>
                  <FaTachometerAlt /> Dashboard
                </li>
              </Link>
              <Link
                className={`decoration-non ${isActive("/my-payments")}`}
                href="/my-payments"
              >
                <li>
                  <IoCard /> My Payments
                </li>
              </Link>
              <Link
                className={`decoration-non ${isActive("/hotel-bookings")}`}
                href="/hotel-bookings"
              >
                <li>
                  <IoBed /> Hotel Bookings
                </li>
              </Link>
              <Link
                className={`decoration-non ${isActive("/flight-bookings")}`}
                href="/flight-bookings"
              >
                <li>
                  <FaPlane /> Flight Bookings
                </li>
              </Link>
              <Link
                className={`decoration-non ${isActive("/package-bookings")}`}
                href="/package-bookings"
              >
                <li>
                <RiShip2Fill />
                  Package Bookings
                </li>
              </Link>
              <Link
                className={`decoration-non ${isActive("/transfer-bookings")}`}
                href="/transfer-bookings"
              >
                <li>
                  <FaCar /> Transfer Bookings
                </li>
              </Link>
              <Link
                className={`decoration-non ${isActive("/activity-bookings")}`}
                href="/activity-bookings"
              >
                <li>
                  <MdAttractions /> Activity Bookings
                </li>
              </Link>
              <Link
                className={`decoration-non ${isActive("/make-payments")}`}
                href="/make-payments"
              >
                <li>
                  <FaMoneyBill /> Make Payment
                </li>
              </Link>
              <div className="sidebar-divider" />

              <li className="decoration-non" onClick={handleLogout} style={{ cursor: "pointer" }}>
                <HiOutlineLogout /> Logout
              </li>
            </ul>
          </aside>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="sidebar d-none d-md-block">
        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">{userInitial}</div>
          <div className="sidebar-profile-info sidebar-text">
            <span className="sidebar-profile-name">{userName}</span>
            <span className="sidebar-profile-email">{userEmail}</span>
          </div>
        </div>
        <ul className="sidebar-nav mt-2">
          <Link
            className={`decoration-non ${isActive("/dashboard")}`}
            href="/dashboard"
          >
            <li data-label="Dashboard">
              <FaTachometerAlt /> <span className="sidebar-text">Dashboard</span>
            </li>
          </Link>
          <Link
            className={`decoration-non ${isActive("/my-payments")}`}
            href="/my-payments"
          >
            <li data-label="My Payments">
              <IoCard /> <span className="sidebar-text">My Payments</span>
            </li>
          </Link>
          <Link
            className={`decoration-non ${isActive("/hotel-bookings")}`}
            href="/hotel-bookings"
          >
            <li data-label="Hotel Bookings">
              <FaHotel /> <span className="sidebar-text">Hotel Bookings</span>
            </li>
          </Link>
          <Link
            className={`decoration-non ${isActive("/transfer-bookings")}`}
            href="/transfer-bookings"
          >
            <li data-label="Transfer Bookings">
              <FaCar /> <span className="sidebar-text">Transfer Bookings</span>
            </li>
          </Link>
          <Link
            className={`decoration-non ${isActive("/flight-bookings")}`}
            href="/flight-bookings"
          >
            <li data-label="Flight Bookings">
              <FaPlane /> <span className="sidebar-text">Flight Bookings</span>
            </li>
          </Link>
          <Link
            className={`decoration-non ${isActive("/package-bookings")}`}
            href="/package-bookings"
          >
            <li data-label="Packages Bookings">
            <RiShip2Fill />
              <span className="sidebar-text">Package Bookings</span>
            </li>
          </Link>
          <Link
            className={`decoration-non ${isActive("/activity-bookings")}`}
            href="/activity-bookings"
          >
            <li data-label="Activity Bookings">
              <MdAttractions /> <span className="sidebar-text">Activity Bookings</span>
            </li>
          </Link>
 
          <Link
            className={`decoration-non ${isActive("/make-payments")}`}
            href="/make-payments"
          >
            <li data-label="Make Payment">
              <FaBook /> <span className="sidebar-text">Make Payment</span>
            </li>
          </Link>
          <div className="sidebar-divider" />
          <li className="decoration-non" onClick={handleLogout} style={{ cursor: "pointer" }} data-label="Logout">
            <HiOutlineLogout /> <span className="sidebar-text">Logout</span>
          </li>
        </ul>
      </aside>
    </>
  );
}