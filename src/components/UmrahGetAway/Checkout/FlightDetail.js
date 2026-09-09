import React from 'react'
import styles from './Checkout.module.css';
import { FaPlane } from 'react-icons/fa';
import moment from 'moment';
import { IoAirplaneSharp } from 'react-icons/io5';
import Image from 'next/image';
import airline from "@/util/airlines.json"
export default function FlightDetail({ FlightData, type }) {

  const groupSegments = (flight) => {
    if (flight.trip_type === 'return') {
      const legs = flight?.search_criteria?.legs || [];
      if (legs.length === 0) {
        const midpoint = Math.ceil(flight.segments.length / 2);
        return [
          { segments: flight.segments.slice(0, midpoint), label: 'Departure' },
          { segments: flight.segments.slice(midpoint), label: 'Return' }
        ];
      }

      const groupedLegs = [];
      let segmentIndex = 0;
      const labels = ['Departure', 'Return'];

      legs.forEach((leg, legIndex) => {
        const legSegments = [];
        while (segmentIndex < flight.segments.length) {
          const segment = flight.segments[segmentIndex];
          legSegments.push(segment);
          segmentIndex++;
          if (segment.arrival?.airport_code === leg.destination) break;
        }
        if (legSegments.length) {
          groupedLegs.push({
            segments: legSegments,
            label: labels[legIndex] || `Flight ${legIndex + 1}`,
          });
        }
      });

      return groupedLegs;
    }
    return [{ segments: flight.segments, label: 'Departure' }];
  };

  const capitalizeFirstLetter = (str) => {
    if (!str || typeof str !== "string") return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderLeft}>
          <div className={styles.usectiontitleIconBox}>
            <FaPlane size={22} className={styles.usectiontitleIcon} />
          </div>
          <div>
            <div className={styles.usectiontitleTitle}>
              Flights
            </div>
            <p className={styles.usectiontitleSubtitle}>
              {capitalizeFirstLetter(FlightData?.trip_type)}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.flightInnerWrap}>
        <div>
          {groupSegments(FlightData).map((group, idx) => {
            const firstSegment = group.segments[0];
            const lastSegment = group.segments[group.segments.length - 1];
            const totalTime = group.segments.reduce((acc, seg, idx) => {
              let t = acc + (seg.duration || 0);
              const next = group.segments[idx + 1];
              if (next) t += moment(next.departure.datetime).diff(moment(seg.arrival.datetime), 'minutes');
              return t;
          }, 0);
            const airlineData = airline.find((a) => a.iata === firstSegment.airline.code);
            return (
              <div key={idx} className={styles.flightDetailBox}>
                <div className='col-xl-12 col-lg-12 col-md-12'>
                  <div className='d-flex align-items-center mb-2'>
                    <span className={`${styles.flightLegBadge} ${idx === 0 ? styles.flightLegBadgeDeparture : styles.flightLegBadgeReturn} me-2`}>{group.label}</span>
                    <span className='text-muted small'>{moment(firstSegment.departure.datetime).format('ll')} {type === 'receipt' && `(Flight No: ${firstSegment.flight_number})`}</span>
                  </div>
                </div>
                <div className='col-xl-12 col-lg-12 col-md-12'>
                  <div className='row gx-lg-5 gx-3 gy-4 align-items-center'>
                    <div className='col-sm-auto'>
                      <div className='d-flex align-items-center justify-content-start'>
                        <div className='d-start fl-pic'>
                          {firstSegment.airline?.logo_url ? (
                            <Image src={firstSegment.airline.logo_url} height={30} width={30} quality={50} className="me-1" alt={firstSegment.airline.code + '-' + idx} />
                          ) : airlineData?.logo ? (
                            <Image src={airlineData.logo} height={30} width={30} quality={50} className="me-1" alt={airlineData.icao + '-' + idx} />
                          ) : null}
                        </div>
                        <div className="d-end fl-title ps-2">
                          <div className="text-dark fw-medium">{firstSegment.airline.name || airlineData?.name || firstSegment.airline.code}</div>
                          <div className="small text-muted">{firstSegment.cabin_class?.name || ''}</div>
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
            )
          })}
        </div>
      </div>

    </div>
  )
}
