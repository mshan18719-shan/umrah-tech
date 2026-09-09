import React from 'react';
import { FaPlane } from 'react-icons/fa';
import { MdFlight } from 'react-icons/md';
import moment from 'moment';
import styles from './PackageFlightDetail.module.css';

function calcDuration(from, to) {
    const diff = moment(to).diff(moment(from), 'minutes');
    if (!diff || diff < 0) return null;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function airportCode(text) {
    if (!text) return '';
    const match = String(text).match(/\(([A-Z]{3})\)/);
    if (match) return match[1];
    const parts = String(text).trim().split(/[\s,]+/);
    const last = parts[parts.length - 1];
    return last && last.length <= 4 ? last.toUpperCase() : text;
}

function FlightRow({ item }) {
    const duration = calcDuration(item.datetime_from, item.datetime_to);
    const stopsLabel =
        item?.stops_count > 0
            ? `${item.stops_count} Stop${item.stops_count === 1 ? '' : 's'}`
            : 'Direct';

    return (
        <div className={styles.flightRow}>
            <div className={styles.airlineBlock}>
                <span className={styles.airlineIcon} aria-hidden="true">
                    <MdFlight size={14} />
                </span>
                <div className={styles.airlineMeta}>
                    <span className={styles.airlineName}>
                        {item.airline_name || 'Airline'}
                    </span>
                    {item.flight_number && (
                        <span className={styles.flightNumber}>{item.flight_number}</span>
                    )}
                </div>
            </div>

            
            <div className={styles.endpoint}>
                <span className={styles.time}>
                    {moment.utc(item.datetime_from).format('h:mm A')}
                </span>
                <span className={styles.code}>{airportCode(item.departure_from)}</span>
                <span className={styles.place}>{item.departure_from}</span>
            </div>

            <div className={styles.route}>
                <span className={styles.directBadge}>{stopsLabel}</span>
                <span className={styles.routeLine} />
                {duration && <span className={styles.duration}>{duration}</span>}
            </div>

            <div className={`${styles.endpoint} ${styles.endpointEnd}`}>
                <div className={styles.dateTop}>
                    {moment.utc(item.datetime_to).format('DD MMM')}
                </div >
                <span className={styles.time}>
                    {moment.utc(item.datetime_to).format('h:mm A')}
                </span>
                <span className={styles.code}>{airportCode(item.departure_to)}</span>
                <span className={styles.place}>{item.departure_to}</span>
            </div>
        </div>
    );
}

export default function PackageFlightDetail({ PackageDetail }) {
    if (!PackageDetail?.flights || PackageDetail.flights.length === 0) return null;

    const departLegs = [];
    const returnLegs = [];

    PackageDetail.flights.forEach((flight) => {
        (flight.stops || []).forEach((stop) => {
            if (stop.is_return === true) returnLegs.push(stop);
            else departLegs.push(stop);
        });
    });

    const allLegs = [...departLegs, ...returnLegs];
    if (!allLegs.length) return null;

    return (
        <div className={styles.flightSection}>
            <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon} aria-hidden="true">
                    <FaPlane size={15} />
                </span>
                <h5 className={styles.sectionHeading}>Flight Details</h5>
            </div>

            <div className={styles.flightCard}>
                {departLegs.map((item, i) => (
                    <FlightRow key={`dep-${i}`} item={item} />
                ))}
                {returnLegs.map((item, i) => (
                    <FlightRow key={`ret-${i}`} item={item} />
                ))}
            </div>
        </div>
    );
}
