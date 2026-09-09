'use client'
import PriceDisplay from '@/components/Currency/PriceDisplay';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react'
import { FaStar, FaPlane, FaBus } from 'react-icons/fa6';
import { IoLocationSharp } from 'react-icons/io5';
import { LiaAngleRightSolid } from "react-icons/lia";
import { FaMoon, FaStarHalfAlt } from 'react-icons/fa';
import { usePackageList } from './PackageListingContext';
import { usePackageMode } from '../Store/PackageModeHelper';
import { useHolidayPackageStore } from '../Store/HolidayPackageStore';
export default function HolidayPackageCard({ isLoading }) {
  const [imgFallbacks, setImgFallbacks] = useState({});
  const [hotelDetails, setHotelDetails] = useState({});
  const fetchedRef = useRef(new Set());
  const { packages, totalPackages } = usePackageList();
  const { handlePackageData, handleHotelSelection, handleFlightSelection, handleTransferSelection, isServiceSelected } = usePackageMode();
  const { packageConfig } = useHolidayPackageStore();
  const checkIn = packageConfig?.searchData?.dates?.checkIn;
  const checkOut = packageConfig?.searchData?.dates?.checkOut;

  useEffect(() => {
    if (!packages || packages.length === 0) return;

    packages.forEach((pkg) => {
      const hotel = pkg.hotel;
      if (!hotel?.id || !hotel?.provider) return;
      if (fetchedRef.current.has(hotel.id)) return;

      fetchedRef.current.add(hotel.id);

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/basic/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: hotel.provider,
          hotelId: hotel.id,
          checkIn,
          checkOut,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          setHotelDetails((prev) => ({
            ...prev,
            [hotel.id]: {
              image:
                Array.isArray(res.data?.main_images) && res.data.main_images.length > 0
                  ? res.data.main_images[0].url || ''
                  : '',
              address: res.data?.address || '',
              facilities: res.data?.facilities || [],
            },
          }));
        })
        .catch((err) => console.error('Error fetching hotel details:', err));
    });
  }, [packages]);
  const normalizeImageSrc = (raw) => {
    if (!raw) return '/images/hotelloadimg.jpg';
    if (raw.startsWith('data:') || raw.startsWith('/')) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('//')) {
      if (typeof window !== 'undefined') return window.location.protocol + raw;
      return 'https:' + raw;
    }
    return 'http://' + raw.replace(/^\/+/, '');
  }

  const handleImageError = (packageId) => {
    setImgFallbacks(prev => ({ ...prev, [packageId]: true }));
  }

  const makingSlug = (name) => {
    return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  }
  const ProviderShortNames = (encodedProvider) => {
    if (!encodedProvider) return '';
    const provider = encodeProvider(encodedProvider).toLowerCase();
    return provider;
  };
  const encodeProvider = (str) => {
    return [...str].map(c => (c.charCodeAt(0) + 3).toString(36)).join('');
  }
  const displayStars = (stars) => {
    if (!stars) {
      return <span className="text-muted small">No Rating</span>;
    }

    // Check if value is purely numeric (including decimals)
    const isPureNumber = /^\d+(\.\d+)?$/.test(stars);

    if (isPureNumber) {
      const numStars = parseFloat(stars);

      return (
        <>
          {Array(Math.floor(numStars))
            .fill(0)
            .map((_, i) => (
              <FaStar key={i} className="text-warning me-1" />
            ))}

          {numStars % 1 >= 0.5 && (
            <FaStarHalfAlt className="text-warning me-1" />
          )}
        </>
      );
    }

    // If not numeric (like '4LUX'), show as it is
    return <span className="small fw-semibold">{stars}</span>;
  };
  const SetPackageData = (pkg) => {
    handlePackageData(pkg , false)
    handleHotelSelection(pkg.hotel,pkg.hotel.rooms,  false);
    if (isServiceSelected('flight')) {
      handleFlightSelection(pkg.flight, false);
    }
    if (isServiceSelected('transfer')) {
      handleTransferSelection(pkg.transfer, false);
    }
    // if (rooms) {
    //   localStorage.setItem('roomSelection', JSON.stringify(rooms));
    // }

  }
  if (totalPackages === 0 && !isLoading) {
    return (
      <div className="alert alert-warning text-center" role="alert">
        <strong>No packages</strong> found for the selected criteria. Please try adjusting your search.<br />
        <Link href='/'>
          <button className='btn btn-backHome mt-2'> Go to Home</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      {packages.length > 0 && <p className="small mb-2"> {totalPackages} {totalPackages > 1 ? 'packages' : 'package'} found</p>}
      <div className="row" id='top_package'>
        {packages.map((pkg, index) => {
          const hotel = pkg.hotel;
          const flight = pkg.flight;
          const transfer = pkg.transfer;
          const detail = hotelDetails[hotel?.id];
          const mainImage = detail?.image || hotel?.images?.[0] || '/images/hotelloadimg.jpg';
          const displayFacilities = detail?.facilities?.length > 0 ? detail.facilities : hotel?.facilities;
          const displayAddress = detail?.address || '';
          const totalNights = pkg.total_nights || 1;

          return (
            <div key={pkg.package_id || index} className="col-12 mb-4 px-0">
              <div className="card shadow-sm border-1 border p-1">
                <div className="row g-0 position-relative">
                  <div className="col-md-4 col-sm-12 col-12 position-relative">
                    <Image
                      src={
                        imgFallbacks[pkg.package_id]
                          ? '/images/hotelloadimg.jpg'
                          : normalizeImageSrc(mainImage)
                      }
                      width={400}
                      height={300}
                      className="img-fluid rounded h-100 object-fit-cover"
                      alt={hotel?.name || 'Hotel'}
                      quality={100}
                      placeholder="blur"
                      blurDataURL="/images/hotelloadimg.jpg"
                      onError={() => handleImageError(pkg.package_id)}
                      unoptimized={true}
                    />
                    {hotel?.provider === 'custom' && (
                      <span
                        className="badge bg-success position-absolute top-0 start-0 m-2"
                        style={{ zIndex: 1 }}
                      >
                        AL
                      </span>
                    )}
                  </div>
                  <div className="col-md-8 col-sm-12 col-12">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center flex-wrap">
                        <div>
                          {displayStars(hotel?.metadata?.stars)}
                        </div>
                        <span className="badge bg-secondary p-2 mt-2 mt-md-0">
                          <FaMoon className="me-1" />
                          {totalNights} {totalNights > 1 ? 'Nights' : 'Night'}
                        </span>
                      </div>
                      <h5 className="card-title mt-2 mb-1">{hotel?.name}</h5>
                      {/* Package Inclusions */}
                      <div className="d-flex flex-wrap mb-2 gap-2">
                        {flight && (
                          <span className="badge bg-success p-2">
                            <FaPlane className="me-1" /> Flight Included
                          </span>
                        )}
                        {transfer && (
                          <span className="badge bg-success p-2">
                            <FaBus className="me-1" /> Transfer Included
                          </span>
                        )}
                      </div>

                      {/* Address */}
                      {displayAddress && (
                        <small className="text-muted d-block mb-1">
                          <IoLocationSharp className="me-1" />{displayAddress}
                        </small>
                      )}
                      {/* Facilities */}
                      {displayFacilities && displayFacilities.length > 0 && (
                        <div className="d-flex flex-wrap mb-2 justify-content-start">
                          {displayFacilities.slice(0, 5).map((facility, i) => (
                            <span
                              className="badge bg-light text-dark border border-success me-2 mb-2 p-2"
                              key={i}
                            >
                              {facility}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center flex-wrap mt-3">
                        <div className="mb-2 mb-md-0">
                          <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                            Total for {pkg.total_travelers} {pkg.total_travelers > 1 ? 'travelers' : 'traveler'}
                          </small>
                          <small className="fw-bold d-block">
                            <PriceDisplay price={pkg.total_price} currency={pkg.currency} />
                          </small>
                          <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                            VAT and Taxes included
                          </small>
                        </div>
                        <div className='text-center'>
                          <Link
                            href={`/hotels/${makingSlug(hotel?.name)}?packageId=${pkg.package_id}&id=${hotel?.id}&code=${ProviderShortNames(hotel.provider)}&packageMode=true`}
                          >
                            <button onClick={() => SetPackageData(pkg)} className="btn btn-success">
                              View Detail <LiaAngleRightSolid />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
