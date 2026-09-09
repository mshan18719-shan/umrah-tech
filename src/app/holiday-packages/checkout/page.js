"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useHolidayPackageStore } from "@/components/Store/HolidayPackageStore";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { FaHotel, FaPlane, FaCar, FaEdit, FaTrash, FaSuitcaseRolling  } from "react-icons/fa";
import styles from "./checkout.module.css";
import moment from "moment";
import airline from "@/util/airlines.json"
import { IoAirplaneSharp, IoBedOutline, IoMoonOutline } from "react-icons/io5";
import Image from "next/image";
import { GoPerson } from "react-icons/go";
import { PiSuitcaseRolling } from "react-icons/pi";
import { GiGearStickPattern } from "react-icons/gi";
import Hstyles from '@/components/Package/Detail/PackageHotelDetail.module.css';
import { RiCalendarCheckLine, RiCalendarCloseLine } from "react-icons/ri";
import { FaLocationDot } from "react-icons/fa6";
import GuestInformation from "@/components/HolidayPackages/Checkout/GuestInformation";
import { ConvertPrice } from "@/components/Currency/ConvertPrice";
import { useCurrency } from "@/util/currency";
export default function HolidayPackageCheckout() {
  const router = useRouter();
  const {
    isActive,
    selectedData,
    packagePricing,
    removeService,
    validatePackage,
    clearPackageData,
    packageConfig,
  } = useHolidayPackageStore();
  const { currency, rates } = useCurrency();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuestInfo, setShowGuestInfo] = useState(1);

  const handleRemoveService = (serviceType) => {
    const validation = validatePackage();

    // Check if removing would leave less than 2 services
    const currentServiceCount = Object.values(packageConfig.selectedServices)
      .filter(Boolean).length;

    if (currentServiceCount <= 2) {
      notifications.show({
        title: "Cannot Remove",
        message: "Package must have at least 2 services",
        color: "orange",
      });
      return;
    }

    removeService(serviceType);
    notifications.show({
      title: "Service Removed",
      message: `${serviceType} has been removed from your package`,
      color: "blue",
    });
  };

  const handleChangeService = (serviceType) => {
    // For hotel, just add edit flag
    if (serviceType === "hotel") {
      router.push(`/hotels/${makingSlug(selectedData?.hotel?.hotelData?.hotel_name)}?packageId=${selectedData?.packageInfo?.package_id}&id=${selectedData?.hotel?.hotelData?.hotel_code}&code=${ProviderShortNames(selectedData?.hotel?.hotelData?.provider)}&edit=true`);
      return;
    }

    // For flight, build URL with search parameters
    if (serviceType === "flight") {
      const flightData = packageConfig.searchData.flight || {};
      const dates = packageConfig.searchData.dates || {};
      const guests = packageConfig.searchData.totalGuests || {};

      const params = new URLSearchParams();
      params.append("edit", "true");
      params.append("DepartureCode", flightData.from || "");
      params.append("ArrivalCode", flightData.to || "");
      params.append("DepartureDate", dates.checkIn || "");
      params.append("ReturnDate", dates.checkOut || "");
      params.append("adult", guests.adults || 1);
      params.append("child", guests.children || 0);
      params.append("infant", 0);
      params.append("CabinType", flightData.cabinClass || "Y");
      params.append("AirTripType", "Return");

      router.push(`/flights?${params.toString()}`);
      return;
    }

    // For transfer, build URL with search parameters
    if (serviceType === "transfer") {
      const hotelData = packageConfig.searchData.hotel || {};
      const flightData = packageConfig.searchData.flight || {};
      const dates = packageConfig.searchData.dates || {};
      const guests = packageConfig.searchData.totalGuests || {};

      // Determine pickup location (hotel if available, otherwise departure airport)
      let pickupLat, pickupLng, pickupLocation, pickupCountry;
      let dropoffLat, dropoffLng, dropoffLocation, dropoffCountry;

      if (hotelData.lat && hotelData.lng) {
        // Use hotel location for pickup
        pickupLat = hotelData.lat;
        pickupLng = hotelData.lng;
        pickupLocation = hotelData.location || hotelData.city;
        pickupCountry = hotelData.country;
      } else if (flightData.fromLocation?.lat) {
        // Use departure airport location for pickup
        pickupLat = flightData.fromLocation.lat;
        pickupLng = flightData.fromLocation.lng;
        pickupLocation = `${flightData.fromLocation.airportName}, ${flightData.fromLocation.city}`;
        pickupCountry = flightData.fromLocation.country;
      }

      // Use arrival airport for dropoff if available
      if (flightData.toLocation?.lat) {
        dropoffLat = flightData.toLocation.lat;
        dropoffLng = flightData.toLocation.lng;
        dropoffLocation = flightData.toLocation.city;
        dropoffCountry = flightData.toLocation.country;
      } else if (hotelData.lat && hotelData.lng) {
        // Fallback to hotel location
        dropoffLat = hotelData.lat;
        dropoffLng = hotelData.lng;
        dropoffLocation = hotelData.location || hotelData.city;
        dropoffCountry = hotelData.country;
      }

      const params = new URLSearchParams();
      params.append("edit", "true");
      params.append("transferType", "all-round");
      params.append("fromLat", dropoffLat || "");
      params.append("fromLng", dropoffLng || "");
      params.append("pickupLocation", dropoffLocation || "");
      params.append("fromCountry", dropoffCountry || "");
      // comment start
      // params.append("toLat", dropoffLat || "");
      // params.append("toLng", dropoffLng || "");
      // params.append("dropoffLocation", dropoffLocation || "");
      // params.append("toCountry", dropoffCountry || "");
      // comment end 
      params.append("toLat", "");
      params.append("toLng", "");
      params.append("dropoffLocation", "");
      params.append("toCountry", "");
      params.append("pickupDate", dates.checkOut || "");
      params.append("pickupTime", "00:00:00");
      params.append("passengers", guests.adults + guests.children || 1);

      router.push(`/transfers?${params.toString()}`);
      return;
    }
  };
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
  const handleProceedToPayment = async () => {
    const validation = validatePackage();

    if (!validation.isValid) {
      notifications.show({
        title: "Invalid Package",
        message: validation.errors.join(", "),
        color: "red",
      });
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowGuestInfo(2);
    }, 2000);

  };
  const groupSegments = (flight) => {
    if (flight.trip_type === 'return') {
      const midpoint = Math.ceil(flight.segments.length / 2);
      return [
        { segments: flight.segments.slice(0, midpoint), label: 'Departure' },
        { segments: flight.segments.slice(midpoint), label: 'Return' }
      ];
    } else if (flight.trip_type === 'multicity') {
      // For multi-city, group segments by legs based on search criteria
      const legs = flight.search_criteria?.legs || [];
      if (legs.length === 0) {
        // Fallback: treat each segment as a separate leg
        return flight.segments.map((segment, idx) => ({
          segments: [segment],
          label: `Flight ${idx + 1}`
        }));
      }

      const groupedLegs = [];
      let currentSegmentIndex = 0;

      legs.forEach((leg, legIndex) => {
        const legSegments = [];
        const origin = leg.origin;
        const destination = leg.destination;

        // Collect all segments that belong to this leg
        while (currentSegmentIndex < flight.segments.length) {
          const segment = flight.segments[currentSegmentIndex];
          legSegments.push(segment);
          currentSegmentIndex++;

          // Check if we've reached the final destination for this leg
          if (segment.arrival.airport_code === destination) {
            break;
          }
        }

        if (legSegments.length > 0) {
          groupedLegs.push({
            segments: legSegments,
            label: `Flight ${legIndex + 1}`
          });
        }
      });

      return groupedLegs;
    }
    return [{ segments: flight.segments, label: 'Departure' }];
  };
  const clearDataAndRedirect = () => {
    clearPackageData();
    router.push("/");
  };
  if (!isActive) {
    return null;
  }
  const convertToNumber = (amount, fromCurrency) => {
    if (!amount) return 0;
    if (!fromCurrency || currency === fromCurrency || !rates[fromCurrency] || !rates[currency]) {
      return Number(amount);
    }
    const conversion = ConvertPrice(amount, fromCurrency, currency, rates);
    return parseFloat(conversion.newprice);
  };

  const handlePriceConversion = (amount, fromCurrency) => {
    const converted = convertToNumber(amount, fromCurrency);
    const displayCurrency = (fromCurrency && rates[fromCurrency] && rates[currency]) ? currency : (fromCurrency || currency);
    return displayCurrency + ' ' + converted.toFixed(2);
  };

  const calculatedTotal = (
    (selectedData.hotel ? convertToNumber(packagePricing.hotelPrice, packagePricing.hotelCurrency) : 0) +
    (selectedData.flight ? convertToNumber(packagePricing.flightPrice, packagePricing.flightCurrency) : 0) +
    (selectedData.transfer ? convertToNumber(packagePricing.transferPrice, packagePricing.transferCurrency) : 0)
  ).toFixed(2);
  return (
    <div className="container py-5">
      <div className="row">
        <div className={styles.pageHeading}>
          <div className={styles.headingIconWrap}>
            <FaSuitcaseRolling />
          </div>
          <div className={styles.headingText}>
            <h1 className={styles.headingTitle}>Your Holiday Package</h1>
            <p className={styles.headingSubtitle}>Review and confirm your selected services before proceeding to payment</p>
          </div>
          <span className={styles.headingStepBadge}>Step {showGuestInfo} of 2</span>
        </div>
        {showGuestInfo === 1 ? (
          <div className="col-lg-8">
            {/* Hotel Section */}
            {selectedData.hotel && (
              <div className={`${Hstyles.hotelSection} bg-white rounded border rounded-3 px-3 pt-3 mb-3`}>
                <div className="d-flex mb-2 justify-content-between align-items-center flex-wrap">
                  <h4> <FaHotel className={styles.serviceIcon} /> Hotel</h4>
                  <div>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<FaEdit />}
                      onClick={() => handleChangeService("hotel")}
                    >
                      Change
                    </Button>
                  </div>
                </div>
                <div>
                  <div className={Hstyles.hotelCard}>

                    {/* ── Image / Placeholder banner ── */}
                    {selectedData?.hotel?.hotelData?.main_images.length !== 0 && selectedData?.hotel?.hotelData?.main_images[0]?.url ? (
                      <div className={Hstyles.imageWrap}>
                        <Image
                          fill
                          sizes="(max-width: 768px) 100vw, 700px"
                          className={Hstyles.hotelImage}
                          src={selectedData?.hotel?.hotelData?.main_images[0]?.url}
                          alt={selectedData?.hotel?.hotelData?.hotel_name}
                        />
                        <div className={Hstyles.imageOverlay}></div>

                        {selectedData?.hotel?.hotelData?.city && (
                          <div className={Hstyles.cityBadge}>{selectedData?.hotel?.hotelData?.city}</div>
                        )}

                        <div className={Hstyles.imageFooter}>
                          <h5 className={Hstyles.hotelName}>{selectedData?.hotel?.hotelData?.hotel_name}</h5>
                          {selectedData?.hotel?.hotelData?.address && (
                            <div className={Hstyles.addressRow}>
                              <FaLocationDot size={14} className={Hstyles.addressIcon} />
                              <span>{selectedData?.hotel?.hotelData?.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={Hstyles.placeholderBanner}>
                        {selectedData?.hotel?.hotelData?.city && (
                          <div className={Hstyles.cityBadge}>{selectedData?.hotel?.hotelData?.city}</div>
                        )}
                        <div className={Hstyles.placeholderIcon}>
                          <FaHotel />
                        </div>
                        <h5 className={Hstyles.placeholderName}>{selectedData?.hotel?.hotelData?.hotel_name}</h5>
                      </div>
                    )}

                    {/* ── Info body ── */}
                    <div className={Hstyles.infoBody}>

                      {/* Stats grid */}
                      <div className={Hstyles.statsGrid}>
                        <div className={Hstyles.statItem}>
                          <RiCalendarCheckLine size={18} className={Hstyles.statIcon} />
                          <div className={Hstyles.statContent}>
                            <div className={Hstyles.statLabel}>Check-in</div>
                            <div className={Hstyles.statValue}>{moment(selectedData?.hotel?.hotelData?.checkIn).format('DD MMM YYYY')}</div>
                          </div>
                        </div>
                        <div className={Hstyles.statItem}>
                          <RiCalendarCloseLine size={18} className={Hstyles.statIcon} />
                          <div className={Hstyles.statContent}>
                            <div className={Hstyles.statLabel}>Check-out</div>
                            <div className={Hstyles.statValue}>{moment(selectedData?.hotel?.hotelData?.checkOut).format('DD MMM YYYY')}</div>
                          </div>
                        </div>
                        <div className={Hstyles.statItem}>
                          <IoMoonOutline size={18} className={Hstyles.statIcon} />
                          <div className={Hstyles.statContent}>
                            <div className={Hstyles.statLabel}>Nights</div>
                            <div className={Hstyles.statValue}>{moment(selectedData?.hotel?.hotelData?.checkOut).diff(moment(selectedData?.hotel?.hotelData?.checkIn), 'days')} {moment(selectedData?.hotel?.hotelData?.checkOut).diff(moment(selectedData?.hotel?.hotelData?.checkIn), 'days') === 1 ? 'Night' : 'Nights'}</div>
                          </div>
                        </div>
                      </div>

                      {selectedData?.hotel?.selectedRoom.length > 0 && (
                        <div>
                          <div className={Hstyles.roomsLabel}>
                            <IoBedOutline size={14} /> Room Types
                          </div>
                          <div className={Hstyles.roomsRow}>
                            {selectedData?.hotel?.hotelData?.rooms.filter(item => selectedData?.hotel?.selectedRoom.some(room => room?.roomId === item.id)).map((item, index) => (
                              <div key={index} >
                                {item?.rates.filter(rate => selectedData?.hotel?.selectedRoom.some(room => room?.ratekey === rate.rate_key)).map((rateItem, rateIndex) => (
                                  <span key={rateIndex} className={`${Hstyles.roomChip} mx-1`}>
                                    {item.name} ({rateItem.board_name})
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Flight Section */}
            {selectedData.flight && (
              <div className="bg-white rounded border rounded-3 px-3 pt-3 mb-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <h4> <FaPlane className={styles.serviceIcon} /> Flight</h4>
                  <div>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<FaEdit />}
                      onClick={() => handleChangeService("flight")}
                    >
                      Change
                    </Button>
                    {/* <Button
                    size="xs"
                    variant="light"
                    color="red"
                    leftSection={<FaTrash />}
                    onClick={() => handleRemoveService("flight")}
                  >
                    Remove
                  </Button> */}
                  </div>
                </div>
                <div className="row gy-4 align-items-center justify-content-between">
                  <div className="col br-dashed">
                    {groupSegments(selectedData.flight).map((group, idx) => {
                      const firstSegment = group.segments[0];
                      const lastSegment = group.segments[group.segments.length - 1];
                      const totalTime = moment(lastSegment.arrival.datetime).diff(moment(firstSegment.departure.datetime), 'minutes');
                      const airlineData = airline.find((a) => a.iata === firstSegment.airline.code);

                      return (
                        <div key={idx} className='row mb-3'>
                          <div className='col-xl-12 col-lg-12 col-md-12'>
                            <div className='d-flex align-items-center mb-2'>
                              <span className={`${selectedData.flight.trip_type === 'multicity' ? 'bg-warning-subtle text-black' : idx === 0 ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'} rounded py-1 px-2 small  me-2`} >{group.label}</span>
                              <span className='text-muted small'>{moment(firstSegment.departure.datetime).format('ll')}</span>
                            </div>
                          </div>
                          <div className='col-xl-12 col-lg-12 col-md-12'>
                            <div className='row gx-lg-5 gx-3 gy-4 align-items-center'>
                              <div className='col-sm-auto'>
                                <div className='d-flex align-items-center justify-content-start'>
                                  <div className='d-start fl-pic'>
                                    {/* <img className="img-fluid" width="45" alt="image" src="https://geotrip-shreethemes.netlify.app/assets/air-1-DgzClxWf.png"></img> */}
                                    {firstSegment.airline?.logo_url ? (
                                      <Image src={firstSegment.airline.logo_url} height={30} width={30} quality={50} className="me-1" alt={firstSegment.airline.code + '-' + idx} />
                                    ) : airlineData?.logo ? (
                                      <Image src={airlineData.logo} height={30} width={30} quality={50} className="me-1" alt={airlineData.icao + '-' + idx} />
                                    ) : null}
                                  </div>
                                  <div className="d-end fl-title ps-2">
                                    <div className="text-dark fw-medium">{firstSegment.airline.name || airlineData?.name || firstSegment.airline.code}</div>
                                    <div className="small text-muted">{firstSegment.cabin_class?.name || 'Economy'}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="col">
                                <div className="row gx-3 align-items-center">
                                  <div className="col-auto">
                                    <div className="text-dark fw-bold">{moment(firstSegment.departure.datetime).format('LT')}</div>
                                    <div className="text-muted small">{firstSegment.departure.airport_code}</div>
                                  </div>
                                  <div className="col text-center position-relative">
                                    <div className="flightLine departure">
                                      <div></div>
                                      <div></div>
                                    </div>
                                    <div className='flight-p-icon'><IoAirplaneSharp color='#8c9096' /></div>
                                    {group.segments.length === 1 && group.segments[0].stops === 0 ? (
                                      <div className="text-muted text-sm fw-medium mt-3">Direct</div>
                                    ) : (
                                      <div className="text-muted text-sm fw-medium mt-3">{group.segments.length - 1} {group.segments.length - 1 === 1 ? 'stop' : 'stops'}</div>
                                    )}
                                  </div><div className="col-auto">
                                    <div className="text-dark fw-bold">{moment(lastSegment.arrival.datetime).format('LT')}</div>
                                    <div className="text-muted small">{lastSegment.arrival.airport_code}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-auto">
                                <div className="text-muted text-sm fw-medium">Duration</div>
                                <div className="text-dark fw-medium">{Math.floor(totalTime / 60)}h {totalTime % 60}m</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* <div className="col-12 flight-details-more px-3 text-end mt-2">
                            <hr className="m-0 p-0" />
                            <FlightDetail flightdata={item} />
                          </div> */}
                </div>
              </div>
            )}

            {/* Transfer Section */}
            {selectedData.transfer && (
              <div className="card border shadow-sm mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <h4> <FaCar className={styles.serviceIcon} /> Transfer</h4>
                    <div>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<FaEdit />}
                        onClick={() => handleChangeService("transfer")}
                      >
                        Change
                      </Button>
                      {/* <Button
                      size="xs"
                      variant="light"
                      color="red"
                      leftSection={<FaTrash />}
                      onClick={() => handleRemoveService("transfer")}
                    >
                      Remove
                    </Button> */}
                    </div>
                  </div>
                  <div className="row g-3 align-items-center">

                    {/* Vehicle Image */}
                    {selectedData.transfer.vehicle_image && (
                      <div className="col-lg-4 col-md-12 col-12 text-center ">
                        <Image
                          src={selectedData.transfer.vehicle_image}
                          height={220}
                          width={220}
                          quality={100}
                          className="img-fluid rounded w-100 h-auto object-fit-contain"
                          alt={selectedData.transfer.vehicle_details.name}
                        />
                      </div>
                    )}

                    {/* Vehicle Details */}
                    <div className="col-lg-8 col-md-12 col-12">
                      <h5 className="fw-bold mb-1">
                        {selectedData.transfer.vehicle_details.name}
                      </h5>

                      <p className="text-muted small mb-2 show-four-lines">
                        {selectedData.transfer.vehicle_details?.vehicle_description}
                      </p>

                      <div className="d-flex flex-wrap gap-2">
                        <span className="badge fw-semibold px-3 py-2 border" style={{ backgroundColor: "#f1f3f8", color: "#02245E" }}>
                          <GoPerson /> Pax: 1 - {selectedData.transfer.vehicle_details.passenger_capacity}
                        </span>

                        <span className="badge  fw-semibold px-3 py-2 border" style={{ backgroundColor: "#f1f3f8", color: "#02245E" }}>
                          <PiSuitcaseRolling /> Luggage Capacity: {selectedData.transfer.vehicle_details?.luggage_capacity}
                        </span>

                        <span className="badge fw-semibold px-3 py-2 border" style={{ backgroundColor: "#f1f3f8", color: "#02245E" }}>
                          <GiGearStickPattern /> {selectedData.transfer.vehicle_details?.transmission_type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="col-lg-8">
            <GuestInformation packageConfig={packageConfig} Selectedcurrency={currency} calculatedTotal={calculatedTotal} selectedData={selectedData} packagePricing={packagePricing}/>
          </div>
        )}
        {/* Price Summary Sidebar */}
        <div className="col-lg-4">
          <div className={styles.priceSummary}>

            {/* Header */}
            <div className={styles.priceSummaryHeader}>
              <div className={styles.priceSummaryHeaderIcon}>
                <FaSuitcaseRolling />
              </div>
              <div>
                <h4 className={styles.priceSummaryTitle}>Price Summary</h4>
                <p className={styles.priceSummarySubtitle}>Your selected services</p>
              </div>
            </div>

            {/* Line items */}
            <div className={styles.priceSummaryBody}>
              {selectedData.hotel && (
                <div className={styles.priceRow}>
                  <div className={styles.priceRowLeft}>
                    <div className={styles.priceRowIconWrap}><FaHotel /></div>
                    <span className={styles.priceRowLabel}>Hotel</span>
                  </div>
                  <span className={styles.priceRowValue}>{handlePriceConversion(packagePricing.hotelPrice, packagePricing.hotelCurrency)}</span>
                </div>
              )}

              {selectedData.flight && (
                <div className={styles.priceRow}>
                  <div className={styles.priceRowLeft}>
                    <div className={styles.priceRowIconWrap}><FaPlane /></div>
                    <span className={styles.priceRowLabel}>Flight</span>
                  </div>
                  <span className={styles.priceRowValue}>{handlePriceConversion(packagePricing.flightPrice, packagePricing.flightCurrency)}</span>
                </div>
              )}

              {selectedData.transfer && (
                <div className={styles.priceRow}>
                  <div className={styles.priceRowLeft}>
                    <div className={styles.priceRowIconWrap}><FaCar /></div>
                    <span className={styles.priceRowLabel}>Transfer</span>
                  </div>
                  <span className={styles.priceRowValue}>{handlePriceConversion(packagePricing.transferPrice, packagePricing.transferCurrency)}</span>
                </div>
              )}

              <hr className={styles.priceDivider} />

              {/* Total */}
              <div className={styles.totalBox}>
                <span className={styles.totalLabel}>Total Amount</span>
                <span className={styles.totalValue}>{currency} {calculatedTotal}</span>
              </div>

              {showGuestInfo === 1 && (
                <div>
                  <Button
                    fullWidth
                    size="lg"
                    onClick={handleProceedToPayment}
                    loading={isProcessing}
                    className={`mb-2 ${styles.proceedBtn}`}
                  >
                    Proceed to Payment
                  </Button>

                  <Button
                    fullWidth
                    variant="outline"
                    color="red"
                    onClick={clearDataAndRedirect}
                    className={styles.cancelBtn}
                  >
                    Cancel Booking
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
