"use client";
import { useEffect, useState } from "react";
import { MdFilterListAlt, MdEdit, MdLocationOn, MdPeople } from "react-icons/md";
import moment from "moment";
import SearchBar from "@/components/HolidayPackages/Filters/SearchBar";
import PriceRange from "@/components/HolidayPackages/Filters/PriceRange";
import SortOption from "@/components/HolidayPackages/Filters/SortOption";
import StarFilter from "@/components/HolidayPackages/Filters/StarFilter";
import MealType from "@/components/HolidayPackages/Filters/MealType";
import ResetFilter from "@/components/HolidayPackages/Filters/ResetFilter";
import { PackageListProvider } from "@/components/HolidayPackages/PackageListingContext";
import PackageListingPaginations from "@/components/HolidayPackages/PackageListingPaginations";
import HotelCardLoader from "@/components/Loader/HotelCardLoader";
import { LiaAngleDownSolid } from "react-icons/lia";
import { Drawer } from "@mantine/core";
import { useHolidayPackageStore } from "@/components/Store/HolidayPackageStore";
import GeneralPackages from "@/components/Home/Search/GeneralPackages";
import HolidayPackageCard from "@/components/HolidayPackages/HolidayPackageCard";
export default function PackageHotelListing() {
  const { isActive, packageConfig } = useHolidayPackageStore();
  const [progress, setProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hotelsList, setHotelsList] = useState([]);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);
  useEffect(() => {
    fethHotels();
  }, [packageConfig])

  const fethHotels = async () => {
    setIsLoading(true);
    const { searchData, selectedServices } = packageConfig;
    const roomsList = searchData?.rooms.map(room => ({
      adults: room.adults,
      // children: room.children,
      children: room.childrenAges || []
    }));

    let services = [];
    
    if (selectedServices.flight) {
      services.push("flight");
    }
    if (selectedServices.transfer) {
      services.push("transfer");
    }
    if (selectedServices.hotel) {
      services.push("hotel");
    }
    const request = {
      "services": services,
      "leaving_from": {
        "airport_code":  searchData?.flight?.from,
        "city": selectedServices.flight ? searchData?.flight?.fromLocation?.city : searchData?.hotel?.location,
        "countryCode":selectedServices.flight ? searchData?.flight?.fromLocation?.countryCode : searchData?.hotel?.countryCode,
        "latitude": selectedServices.flight ? searchData?.flight?.fromLocation?.lat : searchData?.hotel?.lat,
        "longitude": selectedServices.flight ? searchData?.flight?.fromLocation?.lng : searchData?.hotel?.lng
      },
      "going_to": {
         "airport_code": searchData?.flight?.to,
        "city": selectedServices.flight ? searchData?.flight?.toLocation?.city : searchData?.hotel?.location,
        "countryCode": selectedServices.flight ? searchData?.flight?.toLocation?.countryCode : searchData?.hotel?.countryCode,
        "latitude": selectedServices.flight ? searchData?.flight?.toLocation?.lat : searchData?.hotel?.lat,
        "longitude": selectedServices.flight ? searchData?.flight?.toLocation?.lng : searchData?.hotel?.lng
      },
      "dates": {
        "check_in": searchData?.dates?.checkIn,
        "check_out": searchData?.dates?.checkOut
      },
      "rooms": roomsList,
      "economy_class": searchData?.flight?.cabinClassName ,
      "currency": "GBP"
    };
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/holiday-packages/search`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          // 'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      setIsLoading(false);
      if (data.success) {
        setHotelsList(data.data.packages || []);
      } else {
        setHotelsList([]);
      }
    } catch (err) {
      setIsLoading(false);
      setHotelsList([]);
      console.error("Error fetching hotels:", err);
    }

  };
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 600);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [isLoading]);

  if (!isActive) {
    return null;
  };

  return (
    <PackageListProvider packages={hotelsList}>
      <div>
        {/* Mobile: compact summary + collapsible search */}
        <div className='d-block d-md-none'>
          <div className='msb-bar'>
            <div
              className='d-flex align-items-center gap-3 cursor-pointer'
              onClick={() => setShowMobileSearch(prev => !prev)}
            >
              <div className='msb-icon'>
                <MdLocationOn size={20} color="#fff" />
              </div>
              <div className='flex-grow-1' style={{ minWidth: 0 }}>
                <div className='msb-title'>
                  {packageConfig?.searchData?.flight?.toLocation?.city
                    || packageConfig?.searchData?.hotel?.location
                    || 'Search Packages'}
                </div>
                <div className='msb-subtitle'>
                  <MdPeople size={12} className='msb-subtitle-icon' />
                  {(() => {
                    const rooms = packageConfig?.searchData?.rooms || [];
                    const adults = rooms.reduce((s, r) => s + (r.adults || 0), 0);
                    const children = rooms.reduce((s, r) => s + (r.childrenAges?.length || 0), 0);
                    const parts = [];
                    if (adults) parts.push(`${adults} Adult${adults !== 1 ? 's' : ''}`);
                    if (children) parts.push(`${children} Child${children !== 1 ? 'ren' : ''}`);
                    return parts.length ? parts.join(', ') : 'Tap to search';
                  })()}
                  {packageConfig?.searchData?.dates?.checkIn && (
                    <span className='msb-subtitle-date'>· {moment(packageConfig.searchData.dates.checkIn).format('DD MMM YYYY')}</span>
                  )}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setShowMobileSearch(prev => !prev); }}
                className='msb-modify-btn'
              >
                <MdEdit size={13} />
                Modify
              </button>
            </div>
          </div>
          <div
            className='msb-collapse'
            style={{ maxHeight: showMobileSearch ? '900px' : '0' }}
          >
            <div className='msb-collapse-inner'>
              <GeneralPackages packageConfig={packageConfig} isActive={isActive} onSearch={() => setShowMobileSearch(false)} />
            </div>
          </div>
        </div>

        <div className="container mt-2 mb-5">
          {/* Desktop: search bar */}
          <div className="rounded border p-2 mb-4 mt-3 d-none d-md-block">
            <GeneralPackages packageConfig={packageConfig} isActive={isActive} />
          </div>
          <div className="row">
            <div className="col-md-3 col-sm-12 col-12">
              {/* Mobile: Filter Pills */}
              <div className="filter-scroll d-flex gap-2 d-md-none mb-2">
                <button
                  onClick={() => setActiveDrawer("name")}
                  className="filter-pill"
                >
                  Name{" "}
                  <span className="arrow">
                    <LiaAngleDownSolid />
                  </span>
                </button>

                <button
                  onClick={() => setActiveDrawer("sort")}
                  className="filter-pill"
                >
                  Sort By{" "}
                  <span className="arrow">
                    <LiaAngleDownSolid />
                  </span>
                </button>

                <button
                  onClick={() => setActiveDrawer("price")}
                  className="filter-pill"
                >
                  Price{" "}
                  <span className="arrow">
                    <LiaAngleDownSolid />
                  </span>
                </button>

                <button
                  onClick={() => setActiveDrawer("rating")}
                  className="filter-pill"
                >
                  Rating{" "}
                  <span className="arrow">
                    <LiaAngleDownSolid />
                  </span>
                </button>

                <button
                  onClick={() => setActiveDrawer("meal")}
                  className="filter-pill"
                >
                  Meal Type{" "}
                  <span className="arrow">
                    <LiaAngleDownSolid />
                  </span>
                </button>
              </div>

              {/* Desktop: Sidebar Filters */}
              <div className="filter_box rounded d-none d-md-block">
                <div className="d-flex justify-content-between fw-bold align-items-center p-2">
                  Filters
                  <MdFilterListAlt />
                </div>
                <hr />
                <SearchBar />
                <hr />
                <SortOption />
                <hr />
                <PriceRange />
                <hr />
                <StarFilter />
                <hr />
                <MealType />
                <ResetFilter setActiveDrawer={setActiveDrawer} />
              </div>

              {/* Mobile: Individual Filter Drawers */}
              <Drawer
                opened={activeDrawer === "name"}
                onClose={() => setActiveDrawer(null)}
                title="Filter"
                position="bottom"
                size="40%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
                transitionProps={{ duration: 200 }}
                withinPortal={true}
                lockScroll={true}
                trapFocus={false}
              >
                <div style={{ position: "relative", zIndex: 1 }}>
                  <SearchBar />
                </div>
                <ResetFilter setActiveDrawer={setActiveDrawer} />
                <div className="border-top pt-3 mt-3">
                  <button
                    className="btn btn-success w-100"
                    onClick={() => setActiveDrawer(null)}
                  >
                    Done
                  </button>
                </div>
              </Drawer>

              <Drawer
                opened={activeDrawer === "sort"}
                onClose={() => setActiveDrawer(null)}
                title="Filter"
                position="bottom"
                size="35%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
              >
                <div>
                  <SortOption />
                </div>
                <ResetFilter setActiveDrawer={setActiveDrawer} />
                <div className="border-top pt-3 mt-3">
                  <button
                    className="btn btn-success w-100"
                    onClick={() => setActiveDrawer(null)}
                  >
                    Done
                  </button>
                </div>
              </Drawer>

              <Drawer
                opened={activeDrawer === "price"}
                onClose={() => setActiveDrawer(null)}
                title="Filter"
                position="bottom"
                size="44%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
              >
                <div>
                  <PriceRange />
                </div>
                <ResetFilter setActiveDrawer={setActiveDrawer} />
                <div className="border-top pt-3 mt-3">
                  <button
                    className="btn btn-success w-100"
                    onClick={() => setActiveDrawer(null)}
                  >
                    Done
                  </button>
                </div>
              </Drawer>

              <Drawer
                opened={activeDrawer === "rating"}
                onClose={() => setActiveDrawer(null)}
                title="Filter"
                position="bottom"
                size="37%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
              >
                <div>
                  <StarFilter />
                </div>
                <ResetFilter setActiveDrawer={setActiveDrawer} />
                <div className="border-top pt-3 mt-3">
                  <button
                    className="btn btn-success w-100"
                    onClick={() => setActiveDrawer(null)}
                  >
                    Done
                  </button>
                </div>
              </Drawer>

              <Drawer
                opened={activeDrawer === "meal"}
                onClose={() => setActiveDrawer(null)}
                title="Filter"
                position="bottom"
                size="48%"
                overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
              >
                <div>
                  <MealType />
                </div>
                <ResetFilter setActiveDrawer={setActiveDrawer} />
                <div className="border-top pt-3 mt-3">
                  <button
                    className="btn btn-success w-100"
                    onClick={() => setActiveDrawer(null)}
                  >
                    Done
                  </button>
                </div>
              </Drawer>
            </div>

            <div className="col-md-9 col-sm-12 col-12">
              {isLoading && (
                <div className="row">
                  {[1, 2].map((i) => (
                    <div key={i} className="col-12 mb-3">
                      <HotelCardLoader />
                    </div>
                  ))}
                </div>
              )}
              {!isLoading && (
                <>
                  <HolidayPackageCard isLoading={isLoading} packageConfig={packageConfig} />
                  <PackageListingPaginations />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PackageListProvider>
  );
}
