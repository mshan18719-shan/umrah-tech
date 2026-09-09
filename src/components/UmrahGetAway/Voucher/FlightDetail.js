import React from 'react'
import styles from '../Checkout/Checkout.module.css';
import { FaPlane } from 'react-icons/fa';
import moment from 'moment';
import { IoAirplaneSharp } from 'react-icons/io5';
import Image from 'next/image';
import airline from "@/util/airlines.json"
export default function FlightDetail({ FlightData, type }) {

  const groupSegments = (flight) => {
    if (flight.trip_type === 'return') {
      const midpoint = Math.ceil(flight.segments.length / 2);
      return [
        { segments: flight.segments.slice(0, midpoint), label: 'Departure' },
        { segments: flight.segments.slice(midpoint), label: 'Return' }
      ];
    }
    return [{ segments: flight.segments, label: 'Departure' }];
  };

  const capitalizeFirstLetter = (str) => {
    if (!str || typeof str !== "string") return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  return (
    <div style={{ borderBottom: '1px solid #e8e8e8', marginTop: '0' }}>
      <div style={{ background: '#004c4c', color: '#ffffff', padding: '0.65rem 1.5rem', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, background: '#c49a2a', borderRadius: 4, flexShrink: 0 }}>
          <FaPlane size={12} />
        </span>
        FLIGHT DETAILS
        <span style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.45), rgba(255,255,255,0))' }} />
      </div>

      <div className={`bg-white pt-3 mb-3 px-3`}>
        <div className="row gy-4 align-items-center justify-content-between">
          <div className="col">
            {groupSegments(FlightData).map((group, idx) => {
              const firstSegment = group.segments[0];
              const lastSegment = group.segments[group.segments.length - 1];
              const totalTime = group.segments.reduce((acc, seg, idx) => {
                let time = acc + seg.duration;
                const nextSeg = group.segments[idx + 1];
                if (nextSeg) {
                  time += moment(nextSeg.departure.datetime).diff(moment(seg.arrival.datetime), 'minutes');
                }
                return time;
              }, 0);
              const airlineData = airline.find((a) => a.iata === firstSegment.airline.code);

              return (
                <div key={idx} className={`row mb-3 ${styles.flightDetailBox} p-3`}>
                  <div className='col-xl-12 col-lg-12 col-md-12'>
                    <div className='d-flex align-items-center mb-2'>
                      <span className={`rounded py-1 px-2 small ${idx === 0 ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'} me-2`}>{group.label}</span>
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

    </div>
  )
}
