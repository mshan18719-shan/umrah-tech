import React, { useState } from "react";
import FlightDetail from "./FlightDetail";
import { useFlightList } from "./FlightListingContext";
import moment from "moment";
// import airlineNames from "@/util/airlineNames.json"
import airline from "@/util/airlines.json";
import { useFlightStore } from "../Store/FlightStore";
import { useRouter, useSearchParams } from "next/navigation";
import PriceDisplay from "@/components/Currency/PriceDisplay";
import Image from "next/image";
import { usePackageMode } from "../Store/PackageModeHelper";
import { useHolidayPackageStore } from "../Store/HolidayPackageStore";
import { FaPlane } from "react-icons/fa";
import { notifications } from "@mantine/notifications";
import styles from "./FlightCard.module.css";

function formatDurationLabel(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `Duration ${hours}h ${mins}m`;
}

function getStopLabel(group) {
  const stops = group.segments.length - 1;
  if (stops <= 0 && group.segments[0]?.stops === 0) return "Direct";
  if (stops <= 0) return "Direct";
  return `${stops} ${stops === 1 ? "Stop" : "Stops"}`;
}

function getLegBadgeClass(flight, legIndex, urlLegs) {
  if (resolveTripKind(flight, urlLegs) === "multicity") return styles.legBadgeOther;
  return legIndex === 0 ? styles.legBadgeDeparture : styles.legBadgeReturn;
}

function FlightCardItem({
  flight,
  segmentGroups,
  urlMultiCityLegs,
  onSelect,
  selecting = false,
  includedBanner = false,
}) {
  const totalAmount = Number(flight?.pricing?.total_amount || 0);
  const currency = flight?.pricing?.currency;
  const passengerCount =
    flight?.passenger_pricing?.reduce(
      (sum, row) => sum + Number(row.quantity || 1),
      0,
    ) || 1;
  const showPerPerson = passengerCount > 1 && totalAmount > 0;

  return (
    <div className={styles.flightCard}>
      {includedBanner && (
        <div className={styles.includedBanner}>
          <strong>✓ Flight Included</strong> — You&apos;ve selected a different
          flight from the available options.
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
                time += moment(nextSeg.departure.datetime).diff(
                  moment(seg.arrival.datetime),
                  "minutes",
                );
              }
              return time;
            }, 0);
            const dayDiff = moment(lastSegment?.arrival?.datetime)
              .startOf("day")
              .diff(
                moment(firstSegment?.departure?.datetime).startOf("day"),
                "days",
              );
            const airlineData = airline.find(
              (a) => a.iata === firstSegment.airline.code,
            );
            const durationLabel = formatDurationLabel(totalTime);
            const stopLabel = getStopLabel(group);
            const logoSrc =
              firstSegment.airline?.logo_url || airlineData?.logo;

            return (
              <div
                key={idx}
                className={`${styles.legSection} ${idx < segmentGroups.length - 1 ? styles.legSectionDivider : ""}`}
              >
                <div className={styles.legHeader}>
                  <span
                    className={`${styles.legBadge} ${getLegBadgeClass(flight, idx, urlMultiCityLegs)}`}
                  >
                    <FaPlane size={9} />
                    {group.label}
                  </span>
                  <span className={styles.legDate}>
                    {moment(firstSegment.departure.datetime).format(
                      "ddd, DD MMM YYYY",
                    )}
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
                            alt={firstSegment.airline.code}
                            className={styles.airlineLogo}
                          />
                        </div>
                      ) : (
                        <div className={styles.airlineLogoWrap}>
                          <span className={styles.airlineCodeFallback}>
                            {firstSegment.airline.code}
                          </span>
                        </div>
                      )}
                      <div className={styles.airlineText}>
                        <span className={styles.airlineName}>
                          {firstSegment.airline.name ||
                            airlineData?.name ||
                            firstSegment.airline.code}
                        </span>
                        <span className={styles.cabinClass}>
                          {firstSegment.cabin_class?.name || "Economy"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.routeCol}>
                    <div className={styles.flightEndpoint}>
                      <div className={styles.flightTime}>
                        {moment(firstSegment.departure.datetime).format("LT")}
                      </div>
                      <div className={styles.airportCode}>
                        {firstSegment.departure.airport_code}
                      </div>
                    </div>

                    <div className={styles.flightMiddle}>
                      <div className={styles.durationAboveLine}>
                        {durationLabel}
                      </div>
                      <div className={styles.flightLineTrack}>
                        <div className={styles.lineSegment} />
                        <span className={styles.stopsPillOnLine}>
                          {stopLabel}
                        </span>
                        <div className={styles.lineSegment} />
                        <FaPlane
                          className={styles.planeIconEnd}
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    <div className={styles.flightEndpointRight}>
                      <div className={styles.flightTime}>
                        {moment(lastSegment.arrival.datetime).format("LT")}
                        {dayDiff > 0 && (
                          <sup className={styles.dayOffset}>+{dayDiff}</sup>
                        )}
                      </div>
                      <div className={styles.airportCode}>
                        {lastSegment.arrival.airport_code}
                      </div>
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
                  <span className={styles.priceLabel}>Total</span>
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
              {selecting ? "Checking fare…" : "Select Flight"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function airportCodeOf(value) {
  return String(value || "").toUpperCase();
}

function flightLegLabel(index) {
  const words = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"];
  return `${words[index] || `Flight ${index + 1}`} Flight`;
}

function resolveTripKind(flight, urlLegs = []) {
  const trip = String(flight?.trip_type || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  const airTrip = String(flight?.search_criteria?.AirTripType || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  // Explicit multi-city search (incl. A→B then B→A) must stay multi-city
  if (
    trip === "multicity" ||
    trip === "multi" ||
    airTrip === "multicity" ||
    (Array.isArray(urlLegs) && urlLegs.length >= 2)
  ) {
    return "multicity";
  }

  if (trip === "return" || trip === "roundtrip" || airTrip === "return") {
    return "return";
  }

  const legs = Array.isArray(flight?.search_criteria?.legs)
    ? flight.search_criteria.legs
    : [];
  if (Array.isArray(legs) && legs.length >= 2) {
    if (legs.length === 2) {
      const [a, b] = legs;
      const isReturn =
        airportCodeOf(a?.origin) === airportCodeOf(b?.destination) &&
        airportCodeOf(a?.destination) === airportCodeOf(b?.origin);
      return isReturn ? "return" : "multicity";
    }
    return "multicity";
  }

  return "oneway";
}

function resolveSearchLegs(flight, urlLegs = []) {
  if (Array.isArray(flight?.search_criteria?.legs) && flight.search_criteria.legs.length) {
    return flight.search_criteria.legs;
  }
  return Array.isArray(urlLegs) ? urlLegs : [];
}

function groupMulticitySegments(segments, legs) {
  if (!segments?.length) return [];

  if (!legs?.length) {
    return segments.map((segment, idx) => ({
      segments: [segment],
      label: flightLegLabel(idx),
    }));
  }

  const groupedLegs = [];
  let currentSegmentIndex = 0;

  legs.forEach((leg, legIndex) => {
    const legSegments = [];
    const destination = airportCodeOf(leg?.destination);
    const isLastLeg = legIndex === legs.length - 1;
    const maxSegs = Number(leg?.segments_count) || 0;

    while (currentSegmentIndex < segments.length) {
      const segment = segments[currentSegmentIndex];
      legSegments.push(segment);
      currentSegmentIndex += 1;

      const arrival = airportCodeOf(segment?.arrival?.airport_code);
      if (destination && arrival === destination) break;
      if (maxSegs > 0 && legSegments.length >= maxSegs) break;

      // Peek ahead: next leg starts from nextOrigin at this connection city
      if (!isLastLeg && currentSegmentIndex < segments.length) {
        const nextOrigin = airportCodeOf(legs[legIndex + 1]?.origin);
        const nextDep = airportCodeOf(
          segments[currentSegmentIndex]?.departure?.airport_code,
        );
        if (nextOrigin && arrival === nextOrigin && nextDep === nextOrigin) {
          break;
        }
      }
    }

    if (isLastLeg && currentSegmentIndex < segments.length) {
      while (currentSegmentIndex < segments.length) {
        legSegments.push(segments[currentSegmentIndex]);
        currentSegmentIndex += 1;
      }
    }

    if (legSegments.length > 0) {
      groupedLegs.push({
        segments: legSegments,
        label: flightLegLabel(legIndex),
      });
    }
  });

  // Fallback: if everything collapsed into one leg, split by leg destinations
  if (groupedLegs.length < Math.min(2, legs.length) && segments.length > 1) {
    const rebuilt = [];
    let start = 0;
    legs.forEach((leg, legIndex) => {
      const destination = airportCodeOf(leg?.destination);
      let end = -1;
      for (let i = start; i < segments.length; i += 1) {
        if (airportCodeOf(segments[i]?.arrival?.airport_code) === destination) {
          end = i;
          break;
        }
      }
      if (end < 0) {
        if (legIndex === legs.length - 1) {
          end = segments.length - 1;
        } else {
          const nextOrigin = airportCodeOf(legs[legIndex + 1]?.origin);
          for (let i = start; i < segments.length - 1; i += 1) {
            if (
              airportCodeOf(segments[i]?.arrival?.airport_code) === nextOrigin ||
              airportCodeOf(segments[i + 1]?.departure?.airport_code) === nextOrigin
            ) {
              end = i;
              break;
            }
          }
          if (end < 0) end = start;
        }
      }
      rebuilt.push({
        segments: segments.slice(start, end + 1),
        label: flightLegLabel(legIndex),
      });
      start = end + 1;
    });
    if (rebuilt.every((g) => g.segments.length > 0)) return rebuilt;
  }

  return groupedLegs.length
    ? groupedLegs
    : [{ segments, label: "Departure" }];
}

export default function FlightCard() {
  const { flights } = useFlightList();
  const { setSelectedFlight } = useFlightStore();
  const { selectedData } = useHolidayPackageStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [revalidatingIndex, setRevalidatingIndex] = useState(null);

  const { isPackageMode, isEditMode, handleFlightSelection } = usePackageMode();

  const urlMultiCityLegs = (() => {
    if (searchParams.get("AirTripType") !== "MultiCity") return [];
    const legs = [];
    let index = 1;
    while (searchParams.get(`flight${index}_from`)) {
      legs.push({
        origin: searchParams.get(`flight${index}_from`),
        destination: searchParams.get(`flight${index}_to`),
        departure_date: searchParams.get(`flight${index}_date`),
      });
      index += 1;
    }
    return legs;
  })();

  const getPassengerCounts = (flight) => {
    const sc = flight?.search_criteria || {};
    let adult = Number(sc.adult);
    let child = Number(sc.child);
    let infants = Number(sc.infant ?? sc.infants);

    if (!Number.isFinite(adult) || adult < 1) {
      const pricing = Array.isArray(flight?.passenger_pricing)
        ? flight.passenger_pricing
        : [];
      adult = pricing.filter((p) => p.passenger_type === "adult").length || 1;
      child = pricing.filter((p) => p.passenger_type === "child").length || 0;
      infants =
        pricing.filter((p) => p.passenger_type === "infant").length || 0;
    }

    return {
      adult: adult > 0 ? adult : 1,
      child: Number.isFinite(child) && child > 0 ? child : 0,
      infants: Number.isFinite(infants) && infants > 0 ? infants : 0,
    };
  };

  const buildRevalidatePayload = (flight) => {
    const counts = getPassengerCounts(flight);
    const tag = flight?.tag == null ? "" : String(flight.tag);

    return {
      provider: flight?.provider,
      id: flight?.id,
      tag,
      adult: counts.adult,
      child: counts.child,
      infants: counts.infants,
      segments: Array.isArray(flight?.segments) ? flight.segments : [],
    };
  };

  const extractRevalidatedFlight = (payload) => {
    if (!payload || typeof payload !== "object") return null;

    const candidates = [
      payload,
      payload.data,
      payload.data?.flight,
      payload.data?.offer,
      payload.data?.result,
      payload.flight,
      payload.offer,
      payload.result,
    ];

    for (const candidate of candidates) {
      if (candidate && Array.isArray(candidate.segments) && candidate.segments.length) {
        return candidate;
      }
    }

    return null;
  };

  const handleFlightSelect = async (index) => {
    const selectedFlightData = flights[index];
    if (!selectedFlightData) return;

    if (isPackageMode || isEditMode) {
      handleFlightSelection(selectedFlightData, true);
      return;
    }

    if (revalidatingIndex !== null) return;

    setRevalidatingIndex(index);
    try {
      const payload = buildRevalidatePayload(selectedFlightData);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/flights/revalidate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        throw new Error(
          data?.error?.message ||
            data?.message ||
            "Flight revalidation failed. Please try again.",
        );
      }

      const revalidated = extractRevalidatedFlight(data);
      if (!revalidated) {
        throw new Error("Invalid revalidate response. Please try another flight.");
      }

      const checkoutFlight = {
        ...revalidated,
        // Keep search criteria only if API omitted it (needed for passenger form)
        search_criteria: {
          ...(selectedFlightData.search_criteria || {}),
          ...(revalidated.search_criteria || {}),
          legs:
            revalidated.search_criteria?.legs?.length
              ? revalidated.search_criteria.legs
              : selectedFlightData.search_criteria?.legs || [],
          AirTripType:
            revalidated.search_criteria?.AirTripType ||
            selectedFlightData.search_criteria?.AirTripType,
          adult:
            revalidated.search_criteria?.adult ??
            selectedFlightData.search_criteria?.adult ??
            payload.adult,
          child:
            revalidated.search_criteria?.child ??
            selectedFlightData.search_criteria?.child ??
            payload.child,
          infant:
            revalidated.search_criteria?.infant ??
            selectedFlightData.search_criteria?.infant ??
            payload.infants,
        },
        provider: revalidated.provider || selectedFlightData.provider || payload.provider,
        id:
          revalidated.offer_id ||
          revalidated.id ||
          selectedFlightData.offer_id ||
          selectedFlightData.id ||
          payload.id,
        offer_id:
          revalidated.offer_id ||
          revalidated.id ||
          selectedFlightData.offer_id ||
          selectedFlightData.id ||
          payload.id,
        tag: revalidated.tag == null ? payload.tag : revalidated.tag,
        trip_type:
          selectedFlightData.trip_type === "multicity" ||
          selectedFlightData.search_criteria?.AirTripType === "MultiCity"
            ? "multicity"
            : revalidated.trip_type || selectedFlightData.trip_type,
        pricing: revalidated.pricing || selectedFlightData.pricing,
        segments: revalidated.segments || selectedFlightData.segments || [],
        _fromRevalidate: true,
      };

      setSelectedFlight(checkoutFlight);
      router.push("/flights/checkout");
    } catch (err) {
      notifications.show({
        title: "Unable to continue",
        message: err?.message || "Please try another flight.",
        color: "red",
        autoClose: 3500,
      });
    } finally {
      setRevalidatingIndex(null);
    }
  };

  const handleSameFlightSelect = (flight) => {
    if (isPackageMode || isEditMode) {
      handleFlightSelection(flight, true);
      return;
    }
  };
  // Helper to group segments for round trips and multi-city
  const groupSegments = (flight) => {
    if (!flight || !flight.segments) return [];
    const tripKind = resolveTripKind(flight, urlMultiCityLegs);
    const legs = resolveSearchLegs(flight, urlMultiCityLegs);

    if (tripKind === "return") {
      const midpoint = Math.ceil(flight.segments.length / 2);
      return [
        { segments: flight.segments.slice(0, midpoint), label: "Departure" },
        { segments: flight.segments.slice(midpoint), label: "Return" },
      ];
    }

    if (tripKind === "multicity") {
      return groupMulticitySegments(flight.segments, legs);
    }

    return [{ segments: flight.segments, label: "Departure" }];
  };

  return (
    <div className={styles.flightCardList}>
      {flights.length === 0 && (
        <div className={styles.emptyState}>
          <Image
            src="/images/search-not-found.svg"
            alt="No Flights Found"
            width={150}
            height={200}
          />
          <h4 className={styles.emptyStateTitle}>No Flights Found</h4>
          <p className={styles.emptyStateText}>
            We couldn&apos;t find any flights that match your search details. Try
            adjusting your dates, destination, or filters to see more options.
          </p>
        </div>
      )}

      {(isPackageMode || isEditMode) && selectedData?.flight && (
        <FlightCardItem
          flight={selectedData.flight}
          segmentGroups={groupSegments(selectedData.flight)}
          urlMultiCityLegs={urlMultiCityLegs}
          onSelect={() => handleSameFlightSelect(selectedData.flight)}
          includedBanner
        />
      )}

      {flights.map((item, index) => (
        <FlightCardItem
          key={index}
          flight={item}
          segmentGroups={groupSegments(item)}
          urlMultiCityLegs={urlMultiCityLegs}
          selecting={revalidatingIndex === index}
          onSelect={() => handleFlightSelect(index)}
        />
      ))}
    </div>
  );
}
