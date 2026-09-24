'use client'
import Image from "next/image";
import React, { useState, useEffect } from "react";
import styles from "./islamicheader.module.css";
import { usePackageCategories } from "@/contexts/PackageCategoriesContext";
import Link from "next/link";
import { FaPhoneAlt, FaMapMarkerAlt, FaInstagram, FaChevronDown, FaTiktok } from "react-icons/fa";
import { FaFacebookF, FaLinkedinIn } from "react-icons/fa";
import { IoIosMailUnread, IoMdClose } from "react-icons/io";
import { usePathname } from "next/navigation";
import CurrencySelector from "./CurrencySelector";
import { FaXTwitter } from "react-icons/fa6";
import moment from "moment";
import { MdOutlinePhone } from "react-icons/md";

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

export default function IslamicHeader() {
    const pathname = usePathname();
    const { categories: packageCategoryList } = usePackageCategories();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isPackagesDropdownOpen, setIsPackagesDropdownOpen] = useState(false);
    const [isMobilePackagesOpen, setIsMobilePackagesOpen] = useState(false);

    const isDashboard = DASHBOARD_PREFIXES.some(
        (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
    );

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    useEffect(() => {
        if (!isMobileMenuOpen) return;

        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.overflow = '';
            window.scrollTo(0, scrollY);
        };
    }, [isMobileMenuOpen]);

    return (
        <div className={pathname === '/' ? styles.islamicHeader : styles.islamicHeaderOther}>
            <div className={`${styles.islamicHeaderContainer}`}>
                {/* Top Bar with Sunrise, Sunset, Location and Social Icons */}
                <div className={styles.islamicTopBar}>
                    <div className={`${styles.islamicTopBarContent} d-flex justify-content-between align-items-center`}>
                        <div className={`${styles.islamicTopBarLeft} d-flex align-items-center gap-4`}>
                            <div className={`${styles.islamicTopBarItem} d-none d-md-flex align-items-center gap-2`}>
                                <MdOutlinePhone className={styles.islamicTopBarIcon} />
                                <a href="/"><span className={styles.islamicTopBarText}>0121 777 2522</span></a>
                            </div>
                            <div className={`${styles.islamicTopBarItem} d-none d-md-flex align-items-center gap-2`}>
                                <IoIosMailUnread className={styles.islamicTopBarIcon} />
                                <a href="mailto:info@umrahTech.net"><span className={styles.islamicTopBarText}>info@aUmerahtech.net</span></a>
                            </div>

                            {/* <div className={`${styles.islamicTopBarItem} d-none d-md-flex align-items-center gap-2`}>
                                <Link href="/login"><span className={styles.islamicTopBarText}>My Bookings</span></Link>
                            </div> */}
                        </div>
                        <div className={`${styles.islamicTopBarRight} d-flex align-items-center gap-3`}>
                            <div className={`${styles.islamicTopBarItem} ${styles.islamicLocationItem} d-none d-lg-flex align-items-center gap-2`}>
                                {/* <FaMapMarkerAlt className={styles.islamicTopBarIcon} /> */}
                                <a >
                                    <span className={styles.islamicTopBarTextLeft}>✦ Trusted Umrah & Hajj Specialists Since 2010 ✦</span>
                                </a>
                            </div>
                            {/* <div className={`${styles.islamicSocialIcons} d-flex gap-2`}>
                                <a href="https://www.facebook.com/alhijaztoursbirmingham" className={styles.islamicSocialLink} aria-label="Visit our Facebook page">
                                    <FaFacebookF />
                                </a>
                                <a href="https://x.com/Alhijaztours2" className={styles.islamicSocialLink} aria-label="Follow us on X (Twitter)">
                                    <FaXTwitter />
                                </a>
                                <a href="https://www.linkedin.com/company/alhijaztours/" className={styles.islamicSocialLink} aria-label="Connect with us on LinkedIn">
                                    <FaLinkedinIn />
                                </a>
                                <a href="https://www.instagram.com/alhijaz.tours/" className={styles.islamicSocialLink} aria-label="Follow us on Instagram">
                                    <FaInstagram />
                                </a>
                                <a href="https://www.tiktok.com/@alhijaztours" className={styles.islamicSocialLink} aria-label="Watch our TikTok videos">
                                    <FaTiktok />
                                </a>
                            </div> */}
                        </div>
                    </div>
                </div>

                {/* Main Navigation Header */}
                <div className={styles.islamicNavTopStrip}></div>
                <nav className={`${styles.islamicNavbar} ${styles.islamicNavbarLight} navbar navbar-expand-lg`}>
                    <div className="container-fluid px-4 d-flex justify-content-between">
                        <div className="">
                            <Link className={`${styles.islamicNavbarBrand} navbar-brand`} href="/">
                                <div className={styles.islamicLogoWrapper}>
                                    <Image
                                        className={styles.islamicLogo}
                                        height={60}
                                        width={150}
                                        src='/images/navlogo.png'
                                        alt="Ibadah Logo"
                                        priority
                                        unoptimized
                                    />
                                </div>
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className={`${styles.islamicDesktopMenu} d-none d-lg-flex`}>
                            <ul className={`${styles.islamicNavMenu} navbar-nav mb-0`}>
                                <li className={`${styles.islamicNavItem} nav-item`}>
                                    <Link
                                        className={`${styles.islamicNavLink} nav-link ${pathname === '/' ? styles.islamicNavLinkActive : ''}`}
                                        href="/"
                                    >
                                        Home
                                    </Link>
                                </li>
                                <li
                                    className={`${styles.islamicNavItem} ${styles.islamicDropdownItem} nav-item`}
                                    onMouseEnter={() => setIsPackagesDropdownOpen(true)}
                                    onMouseLeave={() => setIsPackagesDropdownOpen(false)}
                                >
                                    <div className={`${styles.islamicNavLink} nav-link cursor-pointer`}>
                                        Packages
                                        <FaChevronDown className={`${styles.islamicDropdownIcon} ${isPackagesDropdownOpen ? styles.islamicDropdownIconOpen : ''}`} />
                                    </div>
                                    {packageCategoryList.length > 0 && (
                                        <ul className={`${styles.islamicDropdownMenu} ${isPackagesDropdownOpen ? styles.islamicDropdownMenuOpen : ''}`}>
                                            {packageCategoryList.map((category, index) => (
                                                <li key={index} className={styles.islamicDropdownMenuItem}>
                                                    <Link href={`/${category.slug}?date=${moment().format('YYYY-MM-DD')}`} className={styles.islamicDropdownLink}>
                                                        {category.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                                {/* <li className={`${styles.islamicNavItem} nav-item`}>
                                    <Link
                                        className={`${styles.islamicNavLink} nav-link ${pathname === '/des' ? styles.islamicNavLinkActive : ''}`}
                                        href="/"
                                    >
                                        Destinations
                                    </Link>
                                </li>
                                <li className={`${styles.islamicNavItem} nav-item`}>
                                    <Link
                                        className={`${styles.islamicNavLink} nav-link ${pathname === '/hot' ? styles.islamicNavLinkActive : ''}`}
                                        href="/"
                                    >
                                        Hotels
                                    </Link>
                                </li> */}
                                <li className={`${styles.islamicNavItem} nav-item`}>
                                    <Link
                                        className={`${styles.islamicNavLink} nav-link ${pathname === '/about-us' ? styles.islamicNavLinkActive : ''}`}
                                        href="/about-us"
                                    >
                                        About us
                                    </Link>
                                </li>
                                <li className={`${styles.islamicNavItem} nav-item`}>
                                    <Link
                                        className={`${styles.islamicNavLink} nav-link ${pathname === '/contact-us' ? styles.islamicNavLinkActive : ''}`}
                                        href="/contact-us"
                                    >
                                        Contact Us
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className={`{styles.islamicNavActionsLight} d-none d-lg-flex gap-4`}>
                            <a href="tel:+1217772522" className={styles.islamicContactSupportLink}>
                                <FaPhoneAlt className={styles.islamicContactSupportIcon} />
                                <span>Contact / Support</span>
                            </a>
                            <div className={`${styles.islamicNavActions} d-flex align-items-center gap-3`}>
                                {/* <a href="tel:+1217772522" className={styles.islamicPhoneLink}>
                                    <FaPhoneAlt className={styles.islamicPhoneIcon} />
                                    <span className={styles.islamicPhoneText}>0121 777 2522</span>
                                </a> */}
                                <CurrencySelector width='w-auto' />
                            </div>
                            {!isDashboard && (
                                <Link href="/login" className={styles.islamicBookNowBtn}>
                                    My Bookings
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className={`${styles.islamicMobileToggle} d-lg-none`}
                            onClick={toggleMobileMenu}
                            aria-label="Toggle menu"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </nav>

                {/* Mobile Menu Overlay */}
                <div className={`${styles.islamicMobileMenu} ${isMobileMenuOpen ? styles.islamicMobileMenuOpen : ''}`}>
                    <div className={styles.islamicMobileMenuHeader}>
                        <Link className={styles.islamicMobileMenuLogo} href="/" onClick={closeMobileMenu}>
                            <Image
                                height={40}
                                width={200}
                                className="w-auto "
                                src='/images/navlogo.png'
                                alt="Alhijaz Tours Logo"
                                unoptimized
                            />
                        </Link>
                        <button
                            className={styles.islamicMobileMenuClose}
                            onClick={closeMobileMenu}
                            aria-label="Close menu"
                        >
                            <IoMdClose />
                        </button>
                    </div>

                    <div className={styles.islamicMobileMenuBody}>
                        <ul className={styles.islamicMobileMenuList}>
                            <li className={styles.islamicMobileMenuItem}>
                                <Link
                                    className={`${styles.islamicMobileMenuLink} ${pathname === '/' ? styles.islamicMobileMenuLinkActive : ''}`}
                                    href="/"
                                    onClick={closeMobileMenu}
                                >
                                    Home
                                </Link>
                            </li>
                            <li className={styles.islamicMobileMenuItem}>
                                <button
                                    type="button"
                                    className={`${styles.islamicMobileMenuLink} ${isMobilePackagesOpen ? styles.islamicMobileMenuLinkExpanded : ''}`}
                                    onClick={() => setIsMobilePackagesOpen(!isMobilePackagesOpen)}
                                >
                                    Packages
                                    <FaChevronDown className={`${styles.islamicMobileDropdownIcon} ${isMobilePackagesOpen ? styles.islamicMobileDropdownIconOpen : ''}`} />
                                </button>
                                <ul className={`${styles.islamicMobileDropdownMenu} ${isMobilePackagesOpen ? styles.islamicMobileDropdownMenuOpen : ''}`}>
                                    {packageCategoryList.map((category, index) => (
                                        <li key={index} className={styles.islamicMobileDropdownItem}>
                                            <Link href={`/${category.slug}`} className={styles.islamicMobileDropdownLink} onClick={closeMobileMenu}>
                                                {category.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                            {/* <li className={styles.islamicMobileMenuItem}>
                                <Link
                                    className={`${styles.islamicMobileMenuLink} ${pathname === '/des' ? styles.islamicMobileMenuLinkActive : ''}`}
                                    href="/"
                                    onClick={closeMobileMenu}
                                >
                                    Destinations
                                </Link>
                            </li>
                            <li className={styles.islamicMobileMenuItem}>
                                <Link
                                    className={`${styles.islamicMobileMenuLink} ${pathname === '/hot' ? styles.islamicMobileMenuLinkActive : ''}`}
                                    href="/"
                                    onClick={closeMobileMenu}
                                >
                                    Hotels
                                </Link>
                            </li> */}
                            <li className={styles.islamicMobileMenuItem}>
                                <Link
                                    className={`${styles.islamicMobileMenuLink} ${pathname === '/about-us' ? styles.islamicMobileMenuLinkActive : ''}`}
                                    href="/about-us"
                                    onClick={closeMobileMenu}
                                >
                                    About us
                                </Link>
                            </li>
                            <li className={styles.islamicMobileMenuItem}>
                                <Link
                                    className={`${styles.islamicMobileMenuLink} ${pathname === '/contact-us' ? styles.islamicMobileMenuLinkActive : ''}`}
                                    href="/contact-us"
                                    onClick={closeMobileMenu}
                                >
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className={styles.islamicMobileMenuFooter}>
                        <div className={styles.islamicMobileCurrency}>
                            <span className={styles.islamicMobileCurrencyLabel}>Currency</span>
                            <CurrencySelector width={styles.islamicMobileCurrencySelect} />
                        </div>
                        {!isDashboard && (
                            <Link href="/login" className={styles.islamicBookNowBtn} onClick={closeMobileMenu}>
                                My Bookings
                            </Link>
                        )}
                        <a href="/" className={styles.islamicMobileCallBtn} onClick={closeMobileMenu}>
                            <FaPhoneAlt size={14} />
                            0121 777 2522
                        </a>

                    </div>
                </div>

                {/* Mobile Menu Backdrop */}
                {isMobileMenuOpen && (
                    <div
                        className={styles.islamicMobileBackdrop}
                        onClick={closeMobileMenu}
                    ></div>
                )}
            </div>
        </div>
    );
}
