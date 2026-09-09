'use client';
import moment from 'moment';
import Image from 'next/image';
import React, { useState, useEffect } from 'react'
import { FaStar, FaStarHalfAlt, FaPlane, FaArrowRight, FaClock } from 'react-icons/fa';
import FlightDetail from '@/components/Flights/FlightDetail';
import { useRouter } from 'next/navigation';
import { AirportList } from '@/util/AirportList';
import styles from './ListingCard.module.css';
import { notifications } from '@mantine/notifications';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { CiLocationOn } from 'react-icons/ci';
import { Tooltip } from '@mantine/core';
import airline from '@/util/airlines.json';
import { useFilters } from './Filter/FilterContext';
import UpdateHotelModal from '@/components/UmrahGetAway/UpdateHotel/Main';
import UpdateFlightModal from '../UpdateFlight/Index';
import { BsShieldCheck } from 'react-icons/bs';

// Survives listing card unmount when filters briefly return zero results
const hotelDetailsCacheStore = new Map();

export default function ListingCard({ packageList, priceType, searchData }) {
    const [loadingPackageId, setLoadingPackageId] = useState(null);
    const [openFlightId, setOpenFlightId] = useState(null);
    const [hotelDetailsCache, setHotelDetailsCache] = useState(() =>
        Object.fromEntries(hotelDetailsCacheStore.entries())
    );
    const [changeHotelModal, setChangeHotelModal] = useState(false);
    const [selectedChangeHotel, setSelectedChangeHotel] = useState({ pkg: null, hotel: null, cityName: '' });
    const [changeFlightModal, setChangeFlightModal] = useState(false);
    const [selectedChangeFlight, setSelectedChangeFlight] = useState({ pkg: null, flight: null });
    const [listingRevision, setListingRevision] = useState(0);
    const { googleDistanceCache, fetchSingleDistance } = useFilters();
    const router = useRouter();
    const isMadinahFirst = searchData?.journey_type?.toLowerCase().includes('madinah') ||
        searchData?.journey_type === 'madinahFirst';

    const getFlightLegSegments = (flight) => {
        const allSegments = flight?.segments || [];
        if (!allSegments.length) return [];

        const legs = flight?.search_criteria?.legs?.length
            ? flight.search_criteria.legs
            : searchData?.departure_city
                ? [
                    {
                        origin: searchData.departure_city,
                        destination: isMadinahFirst ? 'MED' : 'JED',
                    },
                    {
                        origin: isMadinahFirst ? 'JED' : 'MED',
                        destination: searchData.departure_city,
                    },
                ]
                : [];

        if (!legs.length) {
            if (flight?.trip_type === 'return') {
                const half = Math.ceil(allSegments.length / 2);
                return [allSegments.slice(0, half), allSegments.slice(half)];
            }
            return [allSegments];
        }

        const groupedLegs = [];
        let segmentIndex = 0;

        legs.forEach((leg) => {
            const legSegments = [];
            while (segmentIndex < allSegments.length) {
                const segment = allSegments[segmentIndex];
                legSegments.push(segment);
                segmentIndex++;
                if (segment.arrival?.airport_code === leg.destination) break;
            }
            if (legSegments.length) groupedLegs.push(legSegments);
        });

        return groupedLegs;
    };

    const fetchHotelDetails = async (hotel, city) => {
        const hotelId = hotel?.id;
        if (!hotelId) return;
        if (hotelDetailsCacheStore.has(hotelId)) return;

        const loadingEntry = { loading: true };
        hotelDetailsCacheStore.set(hotelId, loadingEntry);
        setHotelDetailsCache(prev => ({ ...prev, [hotelId]: loadingEntry }));

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/basic/details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: hotel?.provider,
                    hotelId: hotel?.id,
                    checkIn: hotel?.check_in,
                    checkOut: hotel?.check_out,
                }),
            });
            const data = await res.json();
            const fullAddress = data?.data?.address;
            const entry = {
                loading: false,
                address: fullAddress,
                all_images: data?.data?.main_images,
            };
            hotelDetailsCacheStore.set(hotelId, entry);
            setHotelDetailsCache(prev => ({ ...prev, [hotelId]: entry }));
            if (fullAddress) {
                const label = [hotel?.name, fullAddress].filter(Boolean).join(', ');
                fetchSingleDistance({ id: hotelId, hotel: label + ', ' + city, city, lat: hotel?.location?.latitude, lon: hotel?.location?.longitude });
            }
        } catch (error) {
            console.error('Hotel detail fetch error:', error);
            const errorEntry = { loading: false, error: true };
            hotelDetailsCacheStore.set(hotelId, errorEntry);
            setHotelDetailsCache(prev => ({ ...prev, [hotelId]: errorEntry }));
        }
    };

    const visibleHotelIds = packageList
        ?.map(pkg => `${pkg?.makkah_hotel?.id || ''}-${pkg?.madinah_hotel?.id || ''}`)
        .join('|') ?? '';

    useEffect(() => {
        if (!packageList?.length) return;
        packageList.forEach(pkg => {
            if (pkg?.makkah_hotel?.id) fetchHotelDetails(pkg.makkah_hotel, 'makkah');
            if (pkg?.madinah_hotel?.id) fetchHotelDetails(pkg.madinah_hotel, 'madinah');
        });
    }, [visibleHotelIds]);

    const handleChangeHotel = (pkg, hotel, cityName) => {
        setSelectedChangeHotel({ pkg, hotel, cityName });
        setChangeHotelModal(true);
    };
    const handleChangeFlight = (pkg) => {
        setSelectedChangeFlight({ pkg, flight: pkg?.flight });
        setChangeFlightModal(true);
    };

    const getStarRating = (hotel) =>
        hotel?.star_rating ?? hotel?.stars ?? hotel?.metadata?.stars ?? null;

    const renderStars = (hotel) => {
        const starRating = getStarRating(hotel);
        if (starRating == null || starRating === '') return null;
        if (!isNaN(parseFloat(starRating)) && isFinite(starRating)) {
            const rating = parseFloat(starRating);
            if (rating <= 0) return null;
            return (
                <span className={styles.stars}>
                    {[...Array(Math.floor(rating))].map((_, i) => (
                        <FaStar size={13} key={i} />
                    ))}
                    {rating % 1 >= 0.5 && <FaStarHalfAlt size={13} />}
                </span>
            );
        }
        return <span className={styles.stars}>{starRating}</span>;
    };

    const renderHotelCard = (hotel, cityName, pkg) => {
        const details = hotelDetailsCache[hotel?.id];
        const address = details?.address || hotel?.location?.address;
        const dist = googleDistanceCache[hotel?.id];
        const cachedFirstImages = details?.all_images;
        const fallbackImages = hotel?.images || [];
        const ImagesList = (cachedFirstImages?.length > 0 ? cachedFirstImages : fallbackImages);
        const hasImages = ImagesList && ImagesList.length > 0;
        const isLoading = hotel?.id && (!hotelDetailsCache[hotel?.id] || hotelDetailsCache[hotel?.id]?.loading);
        const haramLabel = cityName === 'Madinah' ? 'from Nabawi' : 'from Haram';
        const walkTooltip = cityName === 'Madinah' ? 'Walking distance from Masjid Al-Nabawi' : 'Estimated walking time from Haram';
        const starsDisplay = renderStars(hotel);

        return (
            <div className={styles.hotelInner}>
                <div className={styles.hotelImageWrap}>
                    {hotel?.nights > 0 && (
                        <span className={styles.nightsBadge}>
                            {hotel.nights} {hotel.nights === 1 ? 'NIGHT' : 'NIGHTS'}
                        </span>
                    )}
                    {isLoading ? (
                        <div className={styles.imageLoading}>
                            <div className="spinner-border spinner-border-sm text-secondary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <small>Loading soon</small>
                        </div>
                    ) : hasImages ? (
                        <a href={hotel?.first_image || undefined} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}>
                            <Image
                                src={ImagesList[0]?.url || ImagesList[0]}
                                alt={`${cityName} Hotel`}
                                fill
                                className={styles.hotelImage}
                                unoptimized
                            />
                        </a>
                    ) : (
                        <div className={styles.imagePlaceholder}>No Image</div>
                    )}
                </div>

                <div className={styles.hotelContent}>
                    <p className={styles.legLabel}>{cityName.toUpperCase()}</p>
                    <div className={styles.hotelNameRow}>
                        <h3 className={styles.hotelName}>{hotel?.name}</h3>
                        {starsDisplay && (
                            <div className={styles.ratingRow}>{starsDisplay}</div>
                        )}
                    </div>
                    <Tooltip label={address || ''} position="top" withArrow fz="xs" disabled={!address}>
                        <p className={styles.address} style={{ cursor: address ? 'help' : 'default' }}>
                            {/* <CiLocationOn size={14} className={styles.addressIcon} /> */}
                            <span>{details?.loading ? 'Loading...' : address}</span>
                        </p>
                    </Tooltip>
                    <div className={styles.hotelBadges}>
                        {dist?.loading ? (
                            <>
                                <span className={styles.distSkeleton} style={{ width: 110 }} />
                                <span className={styles.distSkeleton} style={{ width: 90 }} />
                            </>
                        ) : dist && !dist.error ? (
                            <>
                                <Tooltip label={cityName === 'Madinah' ? 'Distance from Masjid Al-Nabawi' : 'Distance from Haram'} position="top" withArrow fz="xs">
                                    <span className={styles.distBadge}>
                                        <CiLocationOn size={12} />
                                        {dist.distance} {haramLabel}
                                    </span>
                                </Tooltip>
                                {dist.walking && (
                                    <Tooltip label={walkTooltip} position="top" withArrow fz="xs">
                                        <span className={styles.walkBadge}>
                                            <FaClock size={10} />
                                            {dist.walking}
                                        </span>
                                    </Tooltip>
                                )}
                            </>
                        ) : dist?.error ? (
                            <span className={styles.distBadge}>
                                <CiLocationOn size={12} />
                                Distance N/A
                            </span>
                        ) : null}
                        <span
                            className={styles.changeHotelBadge}
                            onClick={() => handleChangeHotel(pkg, hotel, cityName)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleChangeHotel(pkg, hotel, cityName)}
                        >
                            Change Hotel
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const handleViewDetails = async (pkg) => {
        [pkg?.makkah_hotel, pkg?.madinah_hotel].forEach(hotel => {
            if (!hotel?.id) return;
            const cached = hotelDetailsCache[hotel.id];
            if (cached?.all_images?.length > 0 && (!hotel.first_image || hotel.first_image.length === 0)) {
                hotel.first_image = cached.all_images;
            }
        });
        setLoadingPackageId(pkg?.package_id);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customized/packages/tempCart/add`, {
                method: 'POST',
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pkg)
            });
            const response = await res.json();
            setLoadingPackageId(null);
            if (response.Success) {
                router.push(`/umrah-getaway/selection?packageId=${response?.Content?.package_id}`);
            } else {
                notifications.show({
                    title: 'Error',
                    message: response?.Message || 'Failed to add package to cart.',
                    color: 'red'
                });
            }
        } catch (error) {
            setLoadingPackageId(null);
            notifications.show({
                title: 'Error',
                message: 'Failed to add package to cart.',
                color: 'red'
            });
            console.log(error)
        }
    };

    const renderFlightLeg = (segments, label, packageKey, pkg, legType = 'departure') => {
        const firstSeg = segments[0];
        const lastSeg = segments[segments.length - 1];
        const depAirport = AirportList.find(a => a.airportCode === firstSeg?.departure?.airport_code);
        const arrAirport = AirportList.find(a => a.airportCode === lastSeg?.arrival?.airport_code);
        const totalDuration = segments.reduce((acc, seg, idx) => {
            let t = acc + (seg.duration || 0);
            const next = segments[idx + 1];
            if (next) t += moment(next.departure.datetime).diff(moment(seg.arrival.datetime), 'minutes');
            return t;
        }, 0);
        const hours = Math.floor(totalDuration / 60);
        const mins = totalDuration % 60;
        const dayDiff = moment(lastSeg?.arrival?.datetime).startOf('day').diff(moment(firstSeg?.departure?.datetime).startOf('day'), 'days');
        const stops = segments.length - 1;
        const stopLabel = stops === 0 ? 'DIRECT' : `${stops} STOP${stops > 1 ? 'S' : ''}`;
        const cabinClass = firstSeg?.cabin_class?.name || 'Economy';
        const airlineCode = firstSeg?.airline?.code;
        const airlineLogoUrl = firstSeg?.airline?.logo_url;
        const airlineName = firstSeg?.airline?.name;
        const airlineData = airline.find(a => a.iata === airlineCode);
        const logoSrc = airlineLogoUrl || airlineData?.logo;
        const displayName = airlineName || airlineData?.name || airlineCode;

        return (
            <div className={styles.flightBlock}>
                <div className={styles.flightRow}>
                    <div className={styles.airlineCol}>
                        <span className={`${styles.flightLabel} ${legType === 'return' ? styles.flightLabelReturn : styles.flightLabelDeparture}`}>
                            <FaPlane className={styles.flightLabelIcon} size={10} />
                            {label}
                        </span>
                        <div className={styles.airlineInfo}>
                            <div className={styles.airlineLogoWrap}>
                                {logoSrc ? (
                                    <Image src={logoSrc} height={32} width={32} alt={airlineCode || 'airline'} className={styles.airlineLogo} unoptimized />
                                ) : (
                                    <span className={styles.airlineCodeFallback}>{airlineCode}</span>
                                )}
                            </div>
                            <div className={styles.airlineText}>
                                <span className={styles.airlineName}>{displayName}</span>
                                <span className={styles.airlineClass}>{cabinClass}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.flightEndpoint}>
                        <span className={styles.flightTime}>{moment(firstSeg?.departure?.datetime).format('HH:mm')}</span>
                        <span className={styles.airportCode}>{firstSeg?.departure?.airport_code}</span>
                        <span className={styles.airportName}>{depAirport?.airportName || depAirport?.cityName || ''}</span>
                    </div>

                    <div className={styles.flightMiddle}>
                        <span className={styles.durationPill}>~{hours}H {mins}M - {stopLabel}</span>
                        <div className={styles.flightLine}>
                            <div className={styles.line} />
                            <FaPlane className={styles.routePlaneIcon} size={22} />
                        </div>
                    </div>

                    <div className={styles.flightEndpointRight}>
                        <span className={styles.flightTime}>
                            {moment(lastSeg?.arrival?.datetime).format('HH:mm')}
                            {dayDiff > 0 && <sup> +{dayDiff}</sup>}
                        </span>
                        <span className={styles.airportCode}>{lastSeg?.arrival?.airport_code}</span>
                        <span className={styles.airportName}>{arrAirport?.airportName || arrAirport?.cityName || ''}</span>
                    </div>
                    <div className={styles.flightActions}>
                        <button
                            type="button"
                            className={styles.flightViewBtn}
                            onClick={() => setOpenFlightId(packageKey)}
                        >
                            Flight Details
                        </button>
                        <button
                            type="button"
                            className={styles.flightViewBtn}
                            onClick={() => handleChangeFlight(pkg)}
                        >
                            Change Flight
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div>
                {packageList.map((pkg, index) => {
                    const firstCity = isMadinahFirst ? 'Madinah' : 'Makkah';
                    const firstHotel = isMadinahFirst ? pkg?.madinah_hotel : pkg?.makkah_hotel;
                    const secondHotel = isMadinahFirst ? pkg?.makkah_hotel : pkg?.madinah_hotel;
                    const secondCity = isMadinahFirst ? 'Makkah' : 'Madinah';
                    const packageKey = `${pkg?.package_id || index}-${firstHotel?.name || ''}-${secondHotel?.name || ''}`;
                    const mainPrice = priceType === 'total' ? pkg?.total_price : pkg?.price_per_person;
                    const subPrice = priceType === 'total' ? pkg?.price_per_person : pkg?.total_price;
                    const mainLabel = priceType === 'total' ? 'TOTAL - VAT & TAXES INCL.' : 'PER PERSON - VAT & TAXES INCL.';
                    const subLabel = priceType === 'total' ? 'per person' : 'total';
                    const shortLabel = priceType === 'total' ? '' : 'pp';

                    const [depSegments = [], retSegments = []] = getFlightLegSegments(pkg?.flight);

                    return (
                        <div key={`${packageKey}-${listingRevision}`} className={styles.packageCard}>
                            <div className={styles.hotelsSection}>
                                <div className={styles.hotelLeg}>
                                    {renderHotelCard(firstHotel, firstCity, pkg)}
                                </div>
                                <div className={styles.hotelLeg}>
                                    {renderHotelCard(secondHotel, secondCity, pkg)}
                                </div>
                            </div>

                            {depSegments.length > 0 && (
                                <div className={styles.flightsSection}>
                                    {renderFlightLeg(depSegments, 'DEPARTURE FLIGHT', packageKey, pkg, 'departure')}
                                    {retSegments.length > 0 && renderFlightLeg(retSegments, 'RETURN FLIGHT', packageKey, pkg, 'return')}
                                </div>
                            )}

                            <FlightDetail
                                flightdata={pkg?.flight}
                                outlineBtn='umrahgetaway'
                                showFlights={openFlightId === packageKey}
                                onClose={() => setOpenFlightId(null)}
                            />

                            <div className={styles.footerSection}>
                                <div className={styles.footerLeft}>
                                    <span className={styles.atolBadge}>
                                        <BsShieldCheck size={13} />
                                        ATOL Protected
                                    </span>
                                </div>
                                <div className={styles.footerRight}>
                                    <div className={styles.priceBlock}>
                                        <p className={styles.priceLabel}>{mainLabel}</p>
                                        <p className={styles.priceMain}>
                                            <PriceDisplay currency={pkg?.currency} price={mainPrice} />
                                            <span className={styles.shortLabel}>{shortLabel}</span>
                                        </p>
                                        {subPrice != null && (
                                            <p className={styles.priceSub}>
                                                <PriceDisplay currency={pkg?.currency} price={subPrice} /> {subLabel}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        disabled={loadingPackageId === pkg?.package_id}
                                        onClick={() => handleViewDetails(pkg)}
                                        className={styles.viewDetailsBtn}
                                    >
                                        {loadingPackageId === pkg?.package_id ? (
                                            <span className="spinner-border spinner-border-sm" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </span>
                                        ) : (
                                            <>
                                                View Details
                                                <FaArrowRight size={13} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <UpdateHotelModal
                opened={changeHotelModal}
                onClose={() => setChangeHotelModal(false)}
                pkg={selectedChangeHotel.pkg}
                hotel={selectedChangeHotel.hotel}
                cityName={selectedChangeHotel.cityName}
                onHotelCacheUpdate={(hotelId, details) => {
                    hotelDetailsCacheStore.set(hotelId, details);
                    setHotelDetailsCache(prev => ({ ...prev, [hotelId]: details }));
                }}
            />
            <UpdateFlightModal
                opened={changeFlightModal}
                onClose={() => setChangeFlightModal(false)}
                pkg={selectedChangeFlight.pkg}
                flight={selectedChangeFlight.flight}
                onFlightUpdated={(updatedPkg) => {
                    setSelectedChangeFlight(prev => (
                        prev.pkg?.package_id === updatedPkg?.package_id
                            ? { ...prev, flight: updatedPkg.flight }
                            : prev
                    ));
                    setListingRevision(r => r + 1);
                }}
            />

        </>
    )
}