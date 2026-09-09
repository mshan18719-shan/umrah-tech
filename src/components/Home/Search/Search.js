'use client'

import React, { useEffect, useState, Suspense } from "react";
import { FaBed, FaBroom, FaCalendarAlt, FaCheck, FaClock, FaHotel, FaList, FaShieldAlt, FaStar, FaUser } from "react-icons/fa";
import SearchTabIcon from './SearchTabIcon';
import dynamic from "next/dynamic";
import HeroSection from "./HeroSection";
import styles from "./search.module.css";
import { HiOutlineSparkles } from "react-icons/hi2";
import AiSearch from "./AiSearch";
import { IoIosStarOutline } from "react-icons/io";
import GeneralPackages from "./GeneralPackages";
import { FaLocationDot } from "react-icons/fa6";
import { usePackageCategories } from "@/contexts/PackageCategoriesContext";

// Dynamic imports
const HotelSearch = dynamic(() => import("./HotelSearch"));
const PackageSearch = dynamic(() => import("./PackageSearch"));
const ActivitySearch = dynamic(() => import("./ActivitySearch"));
const FlightSearch = dynamic(() => import("./FlightSearch"));
const TransferSearch = dynamic(() => import("./TransferSearch"));
const UmrahGetAway = dynamic(() => import("./UmrahGetAway"));


export default function Search() {
  const { categories, loading: loadingCategories } = usePackageCategories();
  const [isMobile, setIsMobile] = useState(true);
  const [activeTab, setActiveTab] = useState('hotel-tab-pane');
  const LabelsList = [
    {name : 'umrah-get-away' , label : 'Build Your Own Package in 4 Easy Steps'},
    {name : 'package-tab-pane' , label : 'Build Your Group Package in 4 Easy Steps'},
    {name : 'hotel-tab-pane' , label : 'Secure Your Stay in 4 Easy Steps'},
    {name : 'flight-tab-pane' , label : 'Book Your Flight in 3 Easy Steps'},
    {name : 'transfer-tab-pane' , label : 'Arrange Your Transfer in 3 Easy Steps'},
    {name : 'activity-tab-pane' , label : 'Discover & Book Activities in 3 Easy Steps'},
    {name : 'general-package-tab-pane' , label : 'Build Your Holiday Package in 3 Easy Steps'},

  ]
  const availableTabs = [
    'package-tab-pane',
    'hotel-tab-pane',
    'flight-tab-pane',
    'transfer-tab-pane',
    'activity-tab-pane',
    'general-package-tab-pane',
    'ai-tab-pane',
  ];
  useEffect(() => {
    if (window.innerWidth > 768) {
      setIsMobile(false);
    }

    // Load saved tab from localStorage (fall back if old/removed tab)
    const savedTab = localStorage.getItem('selectedSearchTab');
    if (savedTab && availableTabs.includes(savedTab)) {
      setActiveTab(savedTab);
    } else {
      setActiveTab('hotel-tab-pane');
      localStorage.setItem('selectedSearchTab', 'hotel-tab-pane');
    }
  }, []);

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem('selectedSearchTab', tabId);
  };

  useEffect(() => {
    const onTabRequest = (event) => {
      const tabId = event.detail || 'hotel-tab-pane';
      const nextTab = availableTabs.includes(tabId) ? tabId : 'hotel-tab-pane';
      setActiveTab(nextTab);
      localStorage.setItem('selectedSearchTab', nextTab);
    };

    window.addEventListener('home-search-tab', onTabRequest);
    return () => window.removeEventListener('home-search-tab', onTabRequest);
  }, []);

  return (
    <div id="home-search" className={styles.heroWrapper}>
      {/* Swiper Carousel Background */}
      <div className={styles.heroCarouselBackground}>
        <HeroSection />
      </div>

      {/* Overlay */}
      <div className={styles.heroOverlay}></div>
      {/* Content */}
      <div className={styles.heroContent}>
        <div className="container px-0 px-sm-auto">
          <div className={styles.heroTitleWrap}>
            <h1 className={styles.heroTitle}>
            Start Planning Your Next Journey
            </h1>
            <p className={styles.heroSubtitle}>
              Premium Umrah packages, hand-picked hotels within steps of the Haram,
              and 24/7 expert support — from the UK to the Holy Cities.
            </p>
          </div>

          {/* Search panel — tabs + inputs overlap hero boundary */}
          <div className={styles.searchPanelWrapper}>
          <div className={`${styles.searchTabsWrapper} ${styles.hideTabScrollbar} d-flex home-search-top-wrapper`}>
            <ul className={`nav nav-pills ${styles.largesearch} lights medium px-0`} id="searchTabs" role="tablist">
              {/* <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'umrah-get-away' ? 'active' : ''} h-100`} id="umrah-get-tab" data-bs-toggle="tab" data-bs-target="#umrah-get-away" type="button" role="tab" aria-controls="umrah-get-away" aria-selected={activeTab === 'umrah-get-away'} onClick={() => handleTabChange('umrah-get-away')}>
                  <SearchTabIcon tabId="umrah-get-away" />
                  Umrah Getaway
                </button>
              </li> */}
              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'package-tab-pane' ? 'active' : ''} h-100`} id="package-tab" data-bs-toggle="tab" data-bs-target="#package-tab-pane" type="button" role="tab" aria-controls="package-tab-pane" aria-selected={activeTab === 'package-tab-pane'} onClick={() => handleTabChange('package-tab-pane')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width='30px' height='30px' fill="none" viewBox="0 0 33 33" focusable="false" aria-hidden="true" role="img"><g clipPath="url(#PackagesGrey_tsx__a)"><path fill='#ffffff' d="M3.197 28.105h-1.9v1.135h1.9zM15.72 28.105h-2.356v.87h2.355z"></path><path stroke='#ffffff' strokeMiterlimit="10" strokeWidth="1.25" d="M8.509 27.687H1.14"></path><path stroke='#ffffff' strokeLinejoin="round" strokeWidth="1.25" d="M2.979 20.694H1.648a.509.509 0 0 0 0 1.015h13.726a.509.509 0 0 0 0-1.015H14.03"></path><path stroke='#ffffff' strokeMiterlimit="10" strokeWidth="1.25" d="M8.509 27.687h7.368"></path><path stroke='#ffffff' strokeLinejoin="round" strokeWidth="1.25" d="M3.713 27.687v1.647H1.14v-5.06c0-.828.316-1.622.887-2.219l.338-.354 1.6-2.675a1.56 1.56 0 0 1 1.429-.935h6.178c.61 0 1.17.359 1.42.913l1.652 2.697.495.52c.405.427.738 1.255.738 1.844v5.269h-2.573v-1.647"></path><path fill='#ffffff' d="m5.347 27.687.559-1.114c.162-.324.546-.537.977-.537h3.238c.423 0 .807.209.969.525l.584 1.122M11.628 24.93c.102-.4.96-1.365 2.12-1.365.273 0 .55.086.644.35.094.265.145.606.06 1.067a.52.52 0 0 1-.427.414 6.3 6.3 0 0 1-2.073 0c-.218-.039-.371-.248-.32-.461zM5.39 24.93c-.103-.4-.96-1.365-2.12-1.365-.274 0-.551.086-.645.35-.094.265-.145.606-.06 1.067.038.213.213.38.427.414.426.072 1.203.15 2.073 0 .218-.039.372-.248.32-.461zM10.24 24.257H6.777a.39.39 0 0 0-.388.388v.444c0 .214.174.388.388.388h3.465a.39.39 0 0 0 .388-.388v-.444a.39.39 0 0 0-.388-.388"></path><path fill='#ffffff' stroke='#ffffff' strokeLinejoin="round" strokeWidth="0.4" d="m14.985 8.295-10.423 2.13a1.79 1.79 0 0 1-1.899-.841L1.14 7.019l1.075-.537 1.596 1.365L14.422 5.68a2.96 2.96 0 0 1 1.677.145l.073.03a.983.983 0 0 1 .345 1.6 2.96 2.96 0 0 1-1.532.84Z"></path><path fill='#ffffff' d="m7.847 9.72-2.022 4.463h1.8l5.342-5.53"></path><path stroke='#ffffff' strokeLinejoin="round" strokeWidth="0.4" d="m7.847 9.72-2.022 4.463h1.8l5.342-5.53"></path><path fill='#ffffff' d="M8.21 6.947 5.64 3.66h2.18l3.623 2.624"></path><path stroke='#ffffff' strokeLinejoin="round" strokeWidth="0.4" d="M8.21 6.947 5.64 3.66h2.18l3.623 2.624"></path><path stroke='#ffffff' strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M19.354 11.026h9.212000000000002M20.195 11.026v18.312M27.73 11.026v18.312"></path><path fill='#ffffff' d="M23.348 29.338v-3.157h1.446v3.157"></path><path stroke='#ffffff' strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M23.348 29.338v-3.157h1.446v3.157"></path><path stroke='#ffffff' strokeLinejoin="round" strokeWidth="1.25" d="M31.86 29.338v-8.076h-4.13"></path><path fill='#ffffff' d="M23.066 13.453h-.814a.324.324 0 0 0-.325.325v.806c0 .18.145.324.325.324h.814c.18 0 .325-.145.325-.324v-.806a.324.324 0 0 0-.325-.325M25.89 13.453h-.814a.324.324 0 0 0-.324.325v.806c0 .18.145.324.324.324h.815c.179 0 .324-.145.324-.324v-.806a.324.324 0 0 0-.324-.325M23.066 16.338h-.814a.324.324 0 0 0-.325.324v.806c0 .18.145.325.325.325h.814c.18 0 .325-.146.325-.325v-.806a.324.324 0 0 0-.325-.324M25.89 16.338h-.814a.324.324 0 0 0-.324.324v.806c0 .18.145.325.324.325h.815c.179 0 .324-.146.324-.325v-.806a.324.324 0 0 0-.324-.324M23.066 19.299h-.814a.324.324 0 0 0-.325.324v.806c0 .18.145.325.325.325h.814c.18 0 .325-.145.325-.325v-.806a.324.324 0 0 0-.325-.324M25.89 19.299h-.814a.324.324 0 0 0-.324.324v.806c0 .18.145.325.324.325h.815c.179 0 .324-.145.324-.325v-.806a.324.324 0 0 0-.324-.324M23.066 22.26h-.814a.324.324 0 0 0-.325.324v.806c0 .18.145.325.325.325h.814c.18 0 .325-.145.325-.325v-.806a.324.324 0 0 0-.325-.324M25.89 22.26h-.814a.324.324 0 0 0-.324.324v.806c0 .18.145.325.324.325h.815c.179 0 .324-.145.324-.325v-.806a.324.324 0 0 0-.324-.324"></path><path stroke='#ffffff' strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M31.86 29.338H20.195"></path></g><defs><clipPath id="PackagesGrey_tsx__a"><path fill="#fff" d="M.5 3.021h32v26.957H.5z"></path></clipPath></defs></svg>
                  {' '}Packages
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'hotel-tab-pane' ? 'active' : ''} h-100`} id="hotel-tab" data-bs-toggle="tab" data-bs-target="#hotel-tab-pane" type="button" role="tab" aria-controls="hotel-tab-pane" aria-selected={activeTab === 'hotel-tab-pane'} onClick={() => handleTabChange('hotel-tab-pane')}>
                  <SearchTabIcon tabId="hotel-tab-pane" />
                  Hotels
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'flight-tab-pane' ? 'active' : ''} h-100`} id="flight-tab" data-bs-toggle="tab" data-bs-target="#flight-tab-pane" type="button" role="tab" aria-controls="flight-tab-pane" aria-selected={activeTab === 'flight-tab-pane'} onClick={() => handleTabChange('flight-tab-pane')}>
                  <SearchTabIcon tabId="flight-tab-pane" />
                  Flights
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'transfer-tab-pane' ? 'active' : ''} h-100`} id="transfer-tab" data-bs-toggle="tab" data-bs-target="#transfer-tab-pane" type="button" role="tab" aria-controls="transfer-tab-pane" aria-selected={activeTab === 'transfer-tab-pane'} onClick={() => handleTabChange('transfer-tab-pane')}>
                  <SearchTabIcon tabId="transfer-tab-pane" />
                  Transfers
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'activity-tab-pane' ? 'active' : ''} h-100`} id="activity-tab" data-bs-toggle="tab" data-bs-target="#activity-tab-pane" type="button" role="tab" aria-controls="activity-tab-pane" aria-selected={activeTab === 'activity-tab-pane'} onClick={() => handleTabChange('activity-tab-pane')}>
                  <SearchTabIcon tabId="activity-tab-pane" />
                  Activities
                </button>
              </li>
              {/* <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'general-package-tab-pane' ? 'active' : ''} h-100`} id="general-package-tab" data-bs-toggle="tab" data-bs-target="#general-package-tab-pane" type="button" role="tab" aria-controls="general-package-tab-pane" aria-selected={activeTab === 'general-package-tab-pane'} onClick={() => handleTabChange('general-package-tab-pane')}>
                  <IoIosStarOutline size='25' /> {' '}Holiday Packages
                </button>
              </li>

              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'ai-tab-pane' ? 'active' : ''} h-100`} id="ai-tab" data-bs-toggle="tab" data-bs-target="#ai-tab-pane" type="button" role="tab" aria-controls="ai-tab-pane" aria-selected={activeTab === 'ai-tab-pane'} onClick={() => handleTabChange('ai-tab-pane')}>
                  <HiOutlineSparkles color='#ffffff' size='25' />
                  {' '}AI Mode
                </button>
              </li> */}
            </ul>
            <ul className={`nav nav-pills ${styles.mobilesearch} gap-2 lights medium px-0`} id="searchTabs" role="tablist">
              {/* <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'umrah-get-away' ? 'active' : ''} h-100 ${styles.mobileTab}`} id="umrah-get-tab" data-bs-toggle="tab" data-bs-target="#umrah-get-away" type="button" role="tab" aria-controls="umrah-get-away" aria-selected={activeTab === 'umrah-get-away'} onClick={() => handleTabChange('umrah-get-away')}>
                  <SearchTabIcon tabId="umrah-get-away" mobile />
                  <span className={styles.tabLabel}>Umrah Getaway</span>
                </button>
              </li> */}
              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'package-tab-pane' ? 'active' : ''} h-100 ${styles.mobileTab}`} id="package-tab" data-bs-toggle="tab" data-bs-target="#package-tab-pane" type="button" role="tab" aria-controls="package-tab-pane" aria-selected={activeTab === 'package-tab-pane'} onClick={() => handleTabChange('package-tab-pane')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width='42px' height='42px' fill="none" viewBox="0 0 33 33" focusable="false" aria-hidden="true" role="img"><g clipPath="url(#PackagesGrey_tsx__a)"><path fill='#0b659b' d="M3.197 28.105h-1.9v1.135h1.9zM15.72 28.105h-2.356v.87h2.355z"></path><path stroke='#0b659b' strokeMiterlimit="10" strokeWidth="1.25" d="M8.509 27.687H1.14"></path><path stroke='#0b659b' strokeLinejoin="round" strokeWidth="1.25" d="M2.979 20.694H1.648a.509.509 0 0 0 0 1.015h13.726a.509.509 0 0 0 0-1.015H14.03"></path><path stroke='#0b659b' strokeMiterlimit="10" strokeWidth="1.25" d="M8.509 27.687h7.368"></path><path stroke='#0b659b' strokeLinejoin="round" strokeWidth="1.25" d="M3.713 27.687v1.647H1.14v-5.06c0-.828.316-1.622.887-2.219l.338-.354 1.6-2.675a1.56 1.56 0 0 1 1.429-.935h6.178c.61 0 1.17.359 1.42.913l1.652 2.697.495.52c.405.427.738 1.255.738 1.844v5.269h-2.573v-1.647"></path><path fill='#0b659b' d="m5.347 27.687.559-1.114c.162-.324.546-.537.977-.537h3.238c.423 0 .807.209.969.525l.584 1.122M11.628 24.93c.102-.4.96-1.365 2.12-1.365.273 0 .55.086.644.35.094.265.145.606.06 1.067a.52.52 0 0 1-.427.414 6.3 6.3 0 0 1-2.073 0c-.218-.039-.371-.248-.32-.461zM5.39 24.93c-.103-.4-.96-1.365-2.12-1.365-.274 0-.551.086-.645.35-.094.265-.145.606-.06 1.067.038.213.213.38.427.414.426.072 1.203.15 2.073 0 .218-.039.372-.248.32-.461zM10.24 24.257H6.777a.39.39 0 0 0-.388.388v.444c0 .214.174.388.388.388h3.465a.39.39 0 0 0 .388-.388v-.444a.39.39 0 0 0-.388-.388"></path><path fill='#0b659b' stroke='#0b659b' strokeLinejoin="round" strokeWidth="0.4" d="m14.985 8.295-10.423 2.13a1.79 1.79 0 0 1-1.899-.841L1.14 7.019l1.075-.537 1.596 1.365L14.422 5.68a2.96 2.96 0 0 1 1.677.145l.073.03a.983.983 0 0 1 .345 1.6 2.96 2.96 0 0 1-1.532.84Z"></path><path fill='#0b659b' d="m7.847 9.72-2.022 4.463h1.8l5.342-5.53"></path><path stroke='#0b659b' strokeLinejoin="round" strokeWidth="0.4" d="m7.847 9.72-2.022 4.463h1.8l5.342-5.53"></path><path fill='#0b659b' d="M8.21 6.947 5.64 3.66h2.18l3.623 2.624"></path><path stroke='#0b659b' strokeLinejoin="round" strokeWidth="0.4" d="M8.21 6.947 5.64 3.66h2.18l3.623 2.624"></path><path stroke='#0b659b' strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M19.354 11.026h9.212000000000002M20.195 11.026v18.312M27.73 11.026v18.312"></path><path fill='#0b659b' d="M23.348 29.338v-3.157h1.446v3.157"></path><path stroke='#0b659b' strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M23.348 29.338v-3.157h1.446v3.157"></path><path stroke='#0b659b' strokeLinejoin="round" strokeWidth="1.25" d="M31.86 29.338v-8.076h-4.13"></path><path fill='#0b659b' d="M23.066 13.453h-.814a.324.324 0 0 0-.325.325v.806c0 .18.145.324.325.324h.814c.18 0 .325-.145.325-.324v-.806a.324.324 0 0 0-.325-.325M25.89 13.453h-.814a.324.324 0 0 0-.324.325v.806c0 .18.145.324.324.324h.815c.179 0 .324-.145.324-.324v-.806a.324.324 0 0 0-.324-.325M23.066 16.338h-.814a.324.324 0 0 0-.325.324v.806c0 .18.145.325.325.325h.814c.18 0 .325-.146.325-.325v-.806a.324.324 0 0 0-.325-.324M25.89 16.338h-.814a.324.324 0 0 0-.324.324v.806c0 .18.145.325.324.325h.815c.179 0 .324-.146.324-.325v-.806a.324.324 0 0 0-.324-.324M23.066 19.299h-.814a.324.324 0 0 0-.325.324v.806c0 .18.145.325.325.325h.814c.18 0 .325-.145.325-.325v-.806a.324.324 0 0 0-.325-.324M25.89 19.299h-.814a.324.324 0 0 0-.324.324v.806c0 .18.145.325.324.325h.815c.179 0 .324-.145.324-.325v-.806a.324.324 0 0 0-.324-.324M23.066 22.26h-.814a.324.324 0 0 0-.325.324v.806c0 .18.145.325.325.325h.814c.18 0 .325-.145.325-.325v-.806a.324.324 0 0 0-.325-.324M25.89 22.26h-.814a.324.324 0 0 0-.324.324v.806c0 .18.145.325.324.325h.815c.179 0 .324-.145.324-.325v-.806a.324.324 0 0 0-.324-.324"></path><path stroke='#0b659b' strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M31.86 29.338H20.195"></path></g><defs><clipPath id="PackagesGrey_tsx__a"><path fill="#fff" d="M.5 3.021h32v26.957H.5z"></path></clipPath></defs></svg>
                  <span className={styles.tabLabel}>Packages</span>
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'hotel-tab-pane' ? 'active' : ''} h-100 ${styles.mobileTab}`} id="hotel-tab" data-bs-toggle="tab" data-bs-target="#hotel-tab-pane" type="button" role="tab" aria-controls="hotel-tab-pane" aria-selected={activeTab === 'hotel-tab-pane'} onClick={() => handleTabChange('hotel-tab-pane')}>
                  <SearchTabIcon tabId="hotel-tab-pane" mobile />
                  <span className={styles.tabLabel}>Hotels</span>
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'flight-tab-pane' ? 'active' : ''} h-100 ${styles.mobileTab}`} id="flight-tab" data-bs-toggle="tab" data-bs-target="#flight-tab-pane" type="button" role="tab" aria-controls="flight-tab-pane" aria-selected={activeTab === 'flight-tab-pane'} onClick={() => handleTabChange('flight-tab-pane')}>
                  <SearchTabIcon tabId="flight-tab-pane" mobile />
                  <span className={styles.tabLabel}>Flights</span>
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'transfer-tab-pane' ? 'active' : ''} h-100 ${styles.mobileTab}`} id="transfer-tab" data-bs-toggle="tab" data-bs-target="#transfer-tab-pane" type="button" role="tab" aria-controls="transfer-tab-pane" aria-selected={activeTab === 'transfer-tab-pane'} onClick={() => handleTabChange('transfer-tab-pane')}>
                  <SearchTabIcon tabId="transfer-tab-pane" mobile />
                  <span className={styles.tabLabel}>Transfers</span>
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'activity-tab-pane' ? 'active' : ''} h-100 ${styles.mobileTab}`} id="activity-tab" data-bs-toggle="tab" data-bs-target="#activity-tab-pane" type="button" role="tab" aria-controls="activity-tab-pane" aria-selected={activeTab === 'activity-tab-pane'} onClick={() => handleTabChange('activity-tab-pane')}>
                  <SearchTabIcon tabId="activity-tab-pane" mobile />
                  <span className={styles.tabLabel}>Activities</span>
                </button>
              </li>
              {/* <li className="nav-item" role="presentation">
                <button className="nav-link" id="general-package-tab" data-bs-toggle="tab" data-bs-target="#general-package-tab-pane" type="button" role="tab" aria-controls="general-package-tab-pane" aria-selected="false">
                  <IoIosStarOutline color='#0b659b' size={46} />
                  <span className={styles.tabLabel}>Holiday Packages</span>
                </button>
              </li>

              <li className="nav-item" role="presentation">
                <button className={`nav-link ${activeTab === 'ai-tab-pane' ? 'active' : ''} h-100 ${styles.mobileTab}`} id="ai-tab" data-bs-toggle="tab" data-bs-target="#ai-tab-pane" type="button" role="tab" aria-controls="ai-tab-pane" aria-selected={activeTab === 'ai-tab-pane'} onClick={() => handleTabChange('ai-tab-pane')}>
                  <HiOutlineSparkles color='#0b659b' size='40px' />
                  <span className={styles.tabLabel}>AI Mode</span>
                </button>
              </li> */}
            </ul>
          </div>
          {/* Tab Content */}
          <div className="tab-content" id="searchTabsContent">
            <div className={`tab-pane fade ${activeTab === 'hotel-tab-pane' ? 'show active' : ''} m-2 ${styles.searchBoxWrapper}`} id="hotel-tab-pane" role="tabpanel" aria-labelledby="hotel-tab">
              <Suspense fallback={<div></div>}>
                <HotelSearch />
              </Suspense>
            </div>
            <div className={`tab-pane fade ${activeTab === 'flight-tab-pane' ? 'show active' : ''} m-2 ${styles.searchBoxWrapper}`} id="flight-tab-pane" role="tabpanel" aria-labelledby="flight-tab">
              <Suspense fallback={<div></div>}>
                <FlightSearch />
              </Suspense>
            </div>
            <div className={`tab-pane fade ${activeTab === 'package-tab-pane' ? 'show active' : ''} m-2 ${styles.searchBoxWrapper}`} id="package-tab-pane" role="tabpanel" aria-labelledby="package-tab">
              <Suspense fallback={<div></div>}>
                <PackageSearch categoryList={categories} loading={loadingCategories} />
              </Suspense>
            </div>
            <div className={`tab-pane fade ${activeTab === 'activity-tab-pane' ? 'show active' : ''} m-2 ${styles.searchBoxWrapper}`} id="activity-tab-pane" role="tabpanel" aria-labelledby="activity-tab">
              <Suspense fallback={<div></div>}>
                <ActivitySearch />
              </Suspense>
            </div>
            <div className={`tab-pane fade ${activeTab === 'general-package-tab-pane' ? 'show active' : ''} m-2 ${styles.searchBoxWrapper}`} id="general-package-tab-pane" role="tabpanel" aria-labelledby="general-package-tab">
              <Suspense fallback={<div></div>}>
                <GeneralPackages />
              </Suspense>
            </div>
            <div className={`tab-pane fade ${activeTab === 'transfer-tab-pane' ? 'show active' : ''} m-2 ${styles.searchBoxWrapper}`} id="transfer-tab-pane" role="tabpanel" aria-labelledby="transfer-tab">
              <Suspense fallback={<div></div>}>
                <TransferSearch />
              </Suspense>
            </div>
            {/* <div className={`tab-pane fade ${activeTab === 'umrah-get-away' ? 'show active' : ''} m-2 ${styles.searchBoxWrapper}`} id="umrah-get-away" role="tabpanel" aria-labelledby="umrah-get-tab">
              <Suspense fallback={<div></div>}>
                <UmrahGetAway />
              </Suspense>
            </div> */}
            <div className={`tab-pane fade ${activeTab === 'ai-tab-pane' ? 'show active' : ''}`} id="ai-tab-pane" role="tabpanel" aria-labelledby="ai-tab">
              <Suspense fallback={<div></div>}>
                <AiSearch categoryList={categories} />
              </Suspense>
            </div>
          </div>
          </div>
          {activeTab !== 'ai-tab-pane' && (
            <div className="text-center mb-3 mt-3 search-step-header">
              {/* {LabelsList.filter(label => label.name === activeTab).map((label , index) => (
                <span key={index} className="text-white px-3 py-2 rounded px-1">{label.label}</span>
              ))} */}
            </div>
          )}
          {activeTab === 'package-tab-pane' && (
            <div className="row g-1 mx-0 justify-content-center search-steps-card" >
              {/* <div className="col-12 col-md-6 col-lg-3">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaUser size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Select Your Preferences</h6>
                      <small className="text-muted">Select your package category</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    1
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaList size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Select Your Package</h6>
                      <small className="text-muted">Select from available packages</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    2
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaHotel size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Review & Customize</h6>
                      <small className="text-muted">Review and adjust your booking</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    3
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaCheck size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Confirm & Book</h6>
                      <small className="text-muted">Pay securely & confirm instantly</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    4
                  </div>
                </div>
              </div> */}

            </div>
          )}
          {activeTab === 'umrah-get-away' && (
            <div className="row g-1 mx-0 justify-content-center search-steps-card" >
              {/* <div className="col-12 col-md-6 col-lg-3">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaUser size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Select Your Preferences</h6>
                      <small className="text-muted">Choose Guests, nights and date</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    1
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaList size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Pick Your Package</h6>
                      <small className="text-muted">Select from available packages</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    2
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaHotel size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Review & Customize</h6>
                      <small className="text-muted">Adjust your choices as needed</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    3
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaCheck size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Confirm & Book</h6>
                      <small className="text-muted">Pay & confirm instantly</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    4
                  </div>
                </div>
              </div> */}

            </div>
          )}
          {activeTab === 'hotel-tab-pane' && (
            <div className="row g-1 mx-0 justify-content-center search-steps-card" >
              {/* <div className="col-12 col-md-6 col-lg-3">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaLocationDot size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Choose Destination</h6>
                      <small className="text-muted">Select your destination</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    1
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaHotel size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Choose Hotel</h6>
                      <small className="text-muted">View available hotels</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    2
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaBed size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Choose Room Type</h6>
                      <small className="text-muted">Select your preferred room</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    3
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaCheck size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Confirm & Pay</h6>
                      <small className="text-muted">Secure your booking instantly</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    4
                  </div>
                </div>
              </div> */}

            </div>
          )}
          {activeTab === 'flight-tab-pane' && (
            <div className="row g-1 mx-0 justify-content-center search-steps-card" >
              {/* <div className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaLocationDot size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Enter Your Route</h6>
                      <small className="text-muted">Select departure and arrival airports</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    1
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaCalendarAlt size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Select Dates</h6>
                      <small className="text-muted">Choose your travel dates</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    2
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaCheck size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Choose & Confirm</h6>
                      <small className="text-muted">Select your flight and pay securely</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    3
                  </div>
                </div>
              </div> */}

            </div>
          )}
          {activeTab === 'transfer-tab-pane' && (
            <div className="row g-1 mx-0 justify-content-center search-steps-card" >
              {/* <div className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaLocationDot size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Enter Your Journey Details</h6>
                      <small className="text-muted">Select pickup and drop-off locations</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    1
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaCalendarAlt size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Select Date & Time</h6>
                      <small className="text-muted">Choose your pickup and return times</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    2
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaCheck size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Choose Vehicle & Confirm</h6>
                      <small className="text-muted">Select your transfer option and pay securely</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    3
                  </div>
                </div>
              </div> */}

            </div>
          )}
          {activeTab === 'activity-tab-pane' && (
            <div className="row g-1 mx-0 justify-content-center search-steps-card" >
              {/* <div className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaLocationDot size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Choose Destination</h6>
                      <small className="text-muted">Select your destination city</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    1
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaCalendarAlt size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Select Date</h6>
                      <small className="text-muted">Choose your activity date</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    2
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaCheck size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Choose Activity & Confirm</h6>
                      <small className="text-muted">Select your activity and pay securely</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    3
                  </div>
                </div>
              </div> */}

            </div>
          )}
          {activeTab === 'general-package-tab-pane' && (
            <div className="row g-1 mx-0 justify-content-center search-steps-card" >
              {/* <div className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaLocationDot size={20} />
                      <svg xmlns="http://www.w3.org/2000/svg" width='30px' height='30px' fill="none" viewBox="0 0 33 33" focusable="false" aria-hidden="true" role="img"><g clipPath="url(#PackagesGrey_tsx__a)"><path fill='#ffffff' d="M3.197 28.105h-1.9v1.135h1.9zM15.72 28.105h-2.356v.87h2.355z"></path><path stroke='#ffffff' strokeMiterlimit="10" strokeWidth="1.25" d="M8.509 27.687H1.14"></path><path stroke='#ffffff' strokeLinejoin="round" strokeWidth="1.25" d="M2.979 20.694H1.648a.509.509 0 0 0 0 1.015h13.726a.509.509 0 0 0 0-1.015H14.03"></path><path stroke='#ffffff' strokeMiterlimit="10" strokeWidth="1.25" d="M8.509 27.687h7.368"></path><path stroke='#ffffff' strokeLinejoin="round" strokeWidth="1.25" d="M3.713 27.687v1.647H1.14v-5.06c0-.828.316-1.622.887-2.219l.338-.354 1.6-2.675a1.56 1.56 0 0 1 1.429-.935h6.178c.61 0 1.17.359 1.42.913l1.652 2.697.495.52c.405.427.738 1.255.738 1.844v5.269h-2.573v-1.647"></path><path fill='#ffffff' d="m5.347 27.687.559-1.114c.162-.324.546-.537.977-.537h3.238c.423 0 .807.209.969.525l.584 1.122M11.628 24.93c.102-.4.96-1.365 2.12-1.365.273 0 .55.086.644.35.094.265.145.606.06 1.067a.52.52 0 0 1-.427.414 6.3 6.3 0 0 1-2.073 0c-.218-.039-.371-.248-.32-.461zM5.39 24.93c-.103-.4-.96-1.365-2.12-1.365-.274 0-.551.086-.645.35-.094.265-.145.606-.06 1.067.038.213.213.38.427.414.426.072 1.203.15 2.073 0 .218-.039.372-.248.32-.461zM10.24 24.257H6.777a.39.39 0 0 0-.388.388v.444c0 .214.174.388.388.388h3.465a.39.39 0 0 0 .388-.388v-.444a.39.39 0 0 0-.388-.388"></path><path fill='#ffffff' stroke='#ffffff' strokeLinejoin="round" strokeWidth="0.4" d="m14.985 8.295-10.423 2.13a1.79 1.79 0 0 1-1.899-.841L1.14 7.019l1.075-.537 1.596 1.365L14.422 5.68a2.96 2.96 0 0 1 1.677.145l.073.03a.983.983 0 0 1 .345 1.6 2.96 2.96 0 0 1-1.532.84Z"></path><path fill='#ffffff' d="m7.847 9.72-2.022 4.463h1.8l5.342-5.53"></path><path stroke='#ffffff' strokeLinejoin="round" strokeWidth="0.4" d="m7.847 9.72-2.022 4.463h1.8l5.342-5.53"></path><path fill='#ffffff' d="M8.21 6.947 5.64 3.66h2.18l3.623 2.624"></path><path stroke='#ffffff' strokeLinejoin="round" strokeWidth="0.4" d="M8.21 6.947 5.64 3.66h2.18l3.623 2.624"></path><path stroke='#ffffff' strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M19.354 11.026h9.212000000000002M20.195 11.026v18.312M27.73 11.026v18.312"></path><path fill='#ffffff' d="M23.348 29.338v-3.157h1.446v3.157"></path><path stroke='#ffffff' strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M23.348 29.338v-3.157h1.446v3.157"></path><path stroke='#ffffff' strokeLinejoin="round" strokeWidth="1.25" d="M31.86 29.338v-8.076h-4.13"></path><path fill='#ffffff' d="M23.066 13.453h-.814a.324.324 0 0 0-.325.325v.806c0 .18.145.324.325.324h.814c.18 0 .325-.145.325-.324v-.806a.324.324 0 0 0-.325-.325M25.89 13.453h-.814a.324.324 0 0 0-.324.325v.806c0 .18.145.324.324.324h.815c.179 0 .324-.145.324-.324v-.806a.324.324 0 0 0-.324-.325M23.066 16.338h-.814a.324.324 0 0 0-.325.324v.806c0 .18.145.325.325.325h.814c.18 0 .325-.146.325-.325v-.806a.324.324 0 0 0-.325-.324M25.89 16.338h-.814a.324.324 0 0 0-.324.324v.806c0 .18.145.325.324.325h.815c.179 0 .324-.146.324-.325v-.806a.324.324 0 0 0-.324-.324M23.066 19.299h-.814a.324.324 0 0 0-.325.324v.806c0 .18.145.325.325.325h.814c.18 0 .325-.145.325-.325v-.806a.324.324 0 0 0-.325-.324M25.89 19.299h-.814a.324.324 0 0 0-.324.324v.806c0 .18.145.325.324.325h.815c.179 0 .324-.145.324-.325v-.806a.324.324 0 0 0-.324-.324M23.066 22.26h-.814a.324.324 0 0 0-.325.324v.806c0 .18.145.325.325.325h.814c.18 0 .325-.145.325-.325v-.806a.324.324 0 0 0-.325-.324M25.89 22.26h-.814a.324.324 0 0 0-.324.324v.806c0 .18.145.325.324.325h.815c.179 0 .324-.145.324-.325v-.806a.324.324 0 0 0-.324-.324"></path><path stroke='#ffffff' strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M31.86 29.338H20.195"></path></g><defs><clipPath id="PackagesGrey_tsx__a"><path fill="#fff" d="M.5 3.021h32v26.957H.5z"></path></clipPath></defs></svg>

                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Select Preferences</h6>
                      <small className="text-muted">Choose stay, flight, or transfer options</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    1
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaLocationDot size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Choose Destination</h6>
                      <small className="text-muted">Select Where you want to go and dates</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    2
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm border h-100 rounded-4 position-relative">
                  <div className="card-body d-flex align-items-center">
                    <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: '50px', height: '50px', backgroundColor: '#004c4c' }}>
                      <FaCheck size={20} />
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold">Review & Confirm</h6>
                      <small className="text-muted">Select package, pay & confirm booking</small>
                    </div>
                  </div>
                  <div className="count position-absolute rounded-circle d-flex align-items-center justify-content-center">
                    3
                  </div>
                </div>
              </div> */}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}