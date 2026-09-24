import React, { useState } from "react";
import FlightDetail from "./FlightDetail";
import { useFlightList } from "./FlightListingContext";
import moment from "moment";
import airline from "@/util/airlines.json";
import { useFlightStore } from "../Store/FlightStore";
import { useRouter, useSearchParams } from "next/navigation";
import PriceDisplay from '@/components/Currency/PriceDisplay';
import Image from "next/image";
import { FaPlane } from "react-icons/fa";
import { notifications } from '@mantine/notifications';
import { usePackageMode } from "../Store/PackageModeHelper";
import { useHolidayPackageStore } from "../Store/HolidayPackageStore";
import styles from "./FlightCard.module.css";
import {
  groupSegments,
  normalizeTripType,
  buildRevalidatePayload,
  normalizeRevalidateResponse,
} from "./Checkout/flightHelpers";

function getLegBadgeClass(tripType, idx) {
  if (normalizeTripType({ trip_type: tripType }) === 'multicity') return styles.legBadgeOther;
  return idx === 0 ? styles.legBadgeDeparture : styles.legBadgeReturn;
}

function formatDurationLabel(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `Duration ${hours}h ${mins}m`;
}

function getStopLabel(group) {
  const stops = group.segments.length - 1;
  if (stops <= 0 && group.segments[0]?.stops === 0) return 'Direct';
  if (stops <= 0) return 'Direct';
  return `${stops} ${stops === 1 ? 'Stop' : 'Stops'}`;
}

function FlightCardItem({ flight, onSelect, includedBanner, selecting = false }) {
  const segmentGroups = groupSegments(flight);
  const totalAmount = Number(flight?.pricing?.total_amount || 0);
  const currency = flight?.pricing?.currency;
  const passengerCount = flight?.passenger_pricing?.reduce(
    (sum, row) => sum + Number(row.quantity || 1),
    0
  ) || 1;
  const showPerPerson = passengerCount > 1 && totalAmount > 0;
  const perPersonAmount = showPerPerson ? totalAmount / passengerCount : totalAmount;

  return (
    <div className={styles.flightCard}>
      {includedBanner && (
        <div className={styles.includedBanner}>
          <strong>✓ Flight Included</strong> — You&apos;ve selected a different flight from the available options.
        </div>
      )}

      <div className={styles.cardBody}>
        <div className={styles.segmentsCol}>
          {segmentGroups.map((group, idx) => {
            const firstSegment = group.segments[0];
            const lastSegment = group.segments[group.segments.length - 1];
            const totalTime = group.segments.reduce((acc, seg, segIdx) => {
              let time = acc + seg.duration;
              const nextSeg = group.segments[segIdx + 1];
              if (nextSeg) {
                time += moment(nextSeg.departure.datetime).diff(moment(seg.arrival.datetime), 'minutes');
              }
              return time;
            }, 0);
            const dayDiff = moment(lastSegment?.arrival?.datetime).startOf('day').diff(
              moment(firstSegment?.departure?.datetime).startOf('day'), 'days'
            );
            const airlineData = airline.find((a) => a.iata === firstSegment.airline.code);
            const durationLabel = formatDurationLabel(totalTime);
            const stopLabel = getStopLabel(group);
            const logoSrc = firstSegment.airline?.logo_url || airlineData?.logo;

            return (
              <div
                key={idx}
                className={`${styles.legSection} ${idx < segmentGroups.length - 1 ? styles.legSectionDivider : ''}`}
              >
                <div className={styles.legHeader}>
                  <span className={`${styles.legBadge} ${getLegBadgeClass(flight.trip_type || flight?.search_criteria?.AirTripType, idx)}`}>
                    <FaPlane size={9} />
                    {group.label}
                  </span>
                  <span className={styles.legDate}>
                    {moment(firstSegment.departure.datetime).format('ddd, DD MMM YYYY')}
                  </span>
                </div>

                <div className={styles.flightRow}>
                  <div className={styles.airlineCol}>
                    <div className={styles.airlineInfo}>
                      {logoSrc ? (
                        <div className={styles.airlineLogoWrap}>
                          <Image
                            src={logoSrc}
                            height={32}
                            width={32}
                            quality={50}
                            alt={firstSegment.airline.code + '-' + idx}
                            className={styles.airlineLogo}
                          />
                        </div>
                      ) : (
                        <div className={styles.airlineLogoWrap}>
                          <span className={styles.airlineCodeFallback}>{firstSegment.airline.code}</span>
                        </div>
                      )}
                      <div className={styles.airlineText}>
                        <span className={styles.airlineName}>
                          {firstSegment.airline.name || airlineData?.name || firstSegment.airline.code}
                        </span>
                        <span className={styles.cabinClass}>
                          {firstSegment.cabin_class?.name || 'Economy'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.routeCol}>
                    <div className={styles.flightEndpoint}>
                      <div className={styles.flightTime}>
                        {moment(firstSegment.departure.datetime).format('LT')}
                      </div>
                      <div className={styles.airportCode}>{firstSegment.departure.airport_code}</div>
                    </div>

                    <div className={styles.flightMiddle}>
                      <div className={styles.durationAboveLine}>{durationLabel}</div>
                      <div className={styles.flightLineTrack}>
                        <div className={styles.lineSegment} />
                        <span className={styles.stopsPillOnLine}>{stopLabel}</span>
                        <div className={styles.lineSegment} />
                        <FaPlane className={styles.planeIconEnd} aria-hidden="true" />
                      </div>
                    </div>

                    <div className={styles.flightEndpointRight}>
                      <div className={styles.flightTime}>
                        {moment(lastSegment.arrival.datetime).format('LT')}
                        {dayDiff > 0 && <sup className={styles.dayOffset}>+{dayDiff}</sup>}
                      </div>
                      <div className={styles.airportCode}>{lastSegment.arrival.airport_code}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.footerDetailsWrap}>
            <FlightDetail flightdata={flight} linkTrigger />
          </div>

          <div className={styles.footerRight}>
            <div className={styles.priceBlock}>
              {showPerPerson ? (
                <>
                  <span className={styles.priceLabel}> Total </span>
                  <p className={styles.priceMain}>
                    <PriceDisplay price={totalAmount} currency={currency} />
                  </p>
                  <span className={styles.priceNote}>VAT and taxes included</span>
                </>
              ) : (
                <>
                  <p className={styles.priceMain}>
                    <PriceDisplay price={totalAmount} currency={currency} />
                  </p>
                  <span className={styles.priceNote}>VAT and taxes included</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onSelect}
              className={styles.selectBtn}
              disabled={selecting}
              aria-busy={selecting}
            >
              {selecting ? 'Validating…' : 'Select Flight'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlightCard() {
  const { flights } = useFlightList();
  const { setSelectedFlight } = useFlightStore();
  const { selectedData } = useHolidayPackageStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectingIndex, setSelectingIndex] = useState(null);

  const { isPackageMode, isEditMode, handleFlightSelection } = usePackageMode();

  const handleFlightSelect = async (index) => {
    const selectedFlightData = flights[index];
    if (isPackageMode || isEditMode) {
      handleFlightSelection(selectedFlightData, true);
      return;
    }

    if (selectingIndex !== null) return;

    setSelectingIndex(index);
    try {
      const payload = buildRevalidatePayload(selectedFlightData, {
        adult: searchParams.get('adult'),
        child: searchParams.get('child'),
        infant: searchParams.get('infant'),
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const response = await res.json();

      if (!response?.success) {
        notifications.show({
          title: 'Flight unavailable',
          message: response?.error?.message || 'Unable to revalidate this flight. Please try another.',
          autoClose: 4000,
          color: 'red',
        });
        return;
      }

      const revalidated = normalizeRevalidateResponse(response, selectedFlightData, payload);
      if (!revalidated?.segments?.length) {
        notifications.show({
          title: 'Flight unavailable',
          message: 'Revalidated flight data was incomplete. Please try another flight.',
          autoClose: 4000,
          color: 'red',
        });
        return;
      }

      setSelectedFlight(revalidated);
      router.push('/flights/checkout');
    } catch (error) {
      console.log(error);
      notifications.show({
        title: 'Error',
        message: 'A network error occurred while validating the flight. Please try again.',
        autoClose: 4000,
        color: 'red',
      });
    } finally {
      setSelectingIndex(null);
    }
  };

  const handleSameFlightSelect = (flight) => {
    if (isPackageMode || isEditMode) {
      handleFlightSelection(flight, true);
    }
  };

  return (
    <div className={styles.flightCardList}>
      {flights.length === 0 && (
        <div className={styles.emptyState}>
          <Image src="/images/search-not-found.svg" alt="No Flights Found" width={150} height={200} />
          <h4 className={styles.emptyStateTitle}>No Flights Found</h4>
          <p className={styles.emptyStateText}>
            We couldn&apos;t find any flights that match your search details. Try adjusting your dates, destination, or filters to see more options.
          </p>
        </div>
      )}

      {(isPackageMode || isEditMode) && selectedData?.flight && (
        <FlightCardItem
          flight={selectedData.flight}
          onSelect={() => handleSameFlightSelect(selectedData.flight)}
          includedBanner
        />
      )}

      {flights.map((item, index) => (
        <FlightCardItem
          key={index}
          flight={item}
          selecting={selectingIndex === index}
          onSelect={() => handleFlightSelect(index)}
        />
      ))}
    </div>
  );
}
