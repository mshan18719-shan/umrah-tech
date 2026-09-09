'use client';

import React from 'react';
import { Modal } from '@mantine/core';
import { GoPerson } from 'react-icons/go';
import { PiSuitcaseRolling } from 'react-icons/pi';
import { GiGearStickPattern } from 'react-icons/gi'
import { FaCar, FaCheck, FaStar } from 'react-icons/fa6';
import { MdOutlineAccessTime, MdLocationOn } from 'react-icons/md';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import moment from 'moment';
import styles from './VehicleDetail.module.css';

const DEFAULT_INCLUDED = [
  'Meet & Greet',
  'Flight Monitoring',
  'Luggage Assistance',
  'Air Conditioned Vehicle',
];

const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatDuration = (value) => {
  if (!value && value !== 0) return null;
  if (typeof value === 'string') return value.trim() || null;
  const mins = Number(value);
  if (!Number.isFinite(mins) || mins <= 0) return null;
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

const parseIncludedItems = (transfer) => {
  const raw =
    transfer?.included_items ||
    transfer?.inclusions ||
    transfer?.whats_included ||
    transfer?.amenities;

  if (Array.isArray(raw)) {
    return raw.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof raw === 'string' && raw.trim()) {
    const stripped = raw.replace(/<[^>]*>/g, '|').replace(/\s+/g, ' ');
    const items = stripped
      .split(/[|,•\n;]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 1);
    if (items.length) return items;
  }

  return DEFAULT_INCLUDED;
};

export default function VehicleDetail({
  showModal,
  handleCloseModal,
  selectedTransferDetail,
  searchParams,
  handleBookNow,
  type,
  isPackageMode,
  isEditMode,
  vehicleQuantity,
  setVehicleQuantity,
}) {
  if (!selectedTransferDetail) return null;

  const transfer = selectedTransferDetail;
  const search = transfer?.searchParams || searchParams || {};
  const firstLocation = transfer?.locations?.[0];
  const vehicle = transfer?.vehicle_details || {};

  const pickupTitle =
    firstLocation?.pickup_title ||
    search?.pickupLocation ||
    firstLocation?.pickup_address ||
    'Pickup location';

  const dropoffTitle =
    firstLocation?.dropoff_title ||
    search?.dropoffLocation ||
    firstLocation?.dropoff_address ||
    'Drop-off location';

  const pickupSubAddress =
    firstLocation?.pickup_address &&
    firstLocation.pickup_address !== pickupTitle
      ? firstLocation.pickup_address
      : null;

  const dropoffSubAddress =
    firstLocation?.dropoff_address &&
    firstLocation.dropoff_address !== dropoffTitle
      ? firstLocation.dropoff_address
      : null;

  const pickupDateTime = (() => {
    if (!search?.pickupDate) return null;
    const datePart = moment(search.pickupDate).format('DD MMM');
    if (!search?.pickupTime) return datePart;
    return `${datePart} (${moment(search.pickupTime, 'HH:mm:ss').format('hh:mm A')})`;
  })();

  const duration =
    formatDuration(firstLocation?.duration) ||
    formatDuration(transfer?.duration) ||
    formatDuration(transfer?.estimated_duration) ||
    formatDuration(transfer?.travel_duration) ||
    '—';

  const passengers = vehicle?.passenger_capacity || '—';
  const luggage = vehicle?.luggage_capacity;
  const rating =
    vehicle?.rating != null && vehicle?.rating !== ''
      ? Number(vehicle.rating).toFixed(1)
      : vehicle?.stars != null && vehicle?.stars !== ''
        ? Number(vehicle.stars).toFixed(1)
        : null;

  const reviewCount =
    transfer?.reviews_count ||
    transfer?.review_count ||
    vehicle?.reviews_count ||
    null;

  const vehicleType =
    vehicle?.vehicle_type ||
    vehicle?.category ||
    transfer?.vehiclecategory?.name ||
    'Standard';

  const vehicleNumber =
    vehicle?.vehicle_number ||
    vehicle?.registration_number ||
    transfer?.vehicle_number ||
    null;

  const includedItems = parseIncludedItems(transfer);

  const priceContent =
    transfer?.convertedCurrency && transfer?.convertedPrice != null ? (
      <>
        {transfer.convertedCurrency} {transfer.convertedPrice}
      </>
    ) : transfer?.fare != null ? (
      <PriceDisplay price={transfer.fare} currency={transfer.currency} />
    ) : (
      '—'
    );

  const isCheckoutView = type === 'checkout';

  return (
    <Modal
      opened={showModal}
      onClose={handleCloseModal}
      title="Transfer Details"
      size="lg"
      centered
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      classNames={{
        content: styles.modalContent,
        header: styles.modalHeader,
        title: styles.modalTitle,
        close: styles.modalClose,
        body: styles.modalBody,
      }}
    >
      <div className={styles.content}>
        <p className={styles.sectionLabel}>Pickup</p>

        {/* <div className={styles.durationRow}>
          <span className={styles.durationRowLabel}>Total Duration</span>
          <span className={styles.durationRowValue}>{duration}</span>
        </div> */}

        <div className={styles.timeline}>
          <div className={styles.timelineItem}>
            <span className={styles.timelineIcon} aria-hidden="true">
              <FaCar />
            </span>
            <h4 className={styles.timelineTitle}>{pickupTitle}</h4>
            {pickupDateTime && <p className={styles.timelineSub}>{pickupDateTime}</p>}
            {pickupSubAddress && <p className={styles.timelineSub}>{pickupSubAddress}</p>}

            <div className={styles.timelineMeta}>
              {vehicleNumber && (
                <span className={styles.timelineMetaItem}>
                  Vehicle No : <strong>{vehicleNumber}</strong>
                </span>
              )}
              <span className={styles.timelineMetaItem}>
                Vehicle Type : <strong>{capitalize(vehicleType)}</strong>
              </span>
              {/* <span className={styles.timelineMetaItem}>
                Duration : <strong>{duration}</strong>
              </span> */}
            </div>

            {/* {luggage != null && (
              <div className={styles.bagTags}>
                <span className={styles.bagTag}>{luggage} Large Bags</span>
                <span className={styles.bagTag}>1 Cabin Bag</span>
              </div>
            )} */}
          </div>

          <div className={styles.timelineItem}>
            <span className={styles.timelineIcon} aria-hidden="true">
              <MdLocationOn />
            </span>
            <h4 className={styles.timelineTitle}>{dropoffTitle}</h4>
            {dropoffSubAddress && <p className={styles.timelineSub}>{dropoffSubAddress}</p>}
            {duration !== '—' && (
              <p className={styles.timelineSub}>~ {duration} later</p>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <GoPerson className={styles.statIcon} />
            <div>
              <p className={styles.statValue}>{passengers}</p>
              <p className={styles.statLabel}>Passengers</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <PiSuitcaseRolling className="checkout-review-pill-icon" />
            <div>
              <p className={styles.statValue}>{vehicle.luggage_capacity} </p>
              <p className={styles.statLabel}>
                {reviewCount ? `${reviewCount} reviews` : 'bags'}
              </p>
            </div>
          </div>

          <div className={styles.statCard}>
            <GiGearStickPattern className="checkout-review-pill-icon" />
            <div>
              <p className={styles.statValue}>{vehicle.transmission_type} </p>
              <p className={styles.statLabel}>transmission</p>
            </div>
          </div>
        </div>

        {/* <h5 className={styles.sectionTitle}>What&apos;s Included</h5>
        <div className={styles.includedGrid}>
          {includedItems.map((item) => (
            <div key={item} className={styles.includedItem}>
              <FaCheck className={styles.includedCheck} aria-hidden="true" />
              <span>{item}</span>
            </div>
          ))}
        </div> */}

        {vehicle?.vehicle_description && (
          <p className="text-muted small mb-3">{vehicle.vehicle_description}</p>
        )}

        {transfer?.cancel_policy && (
          <div className={styles.policySection}>
            <h5 className={styles.sectionTitle}>Cancellation Policy</h5>
            {transfer.cancel_policy === 'refundable' ? (
              <>
                <div className={`${styles.policyCard} ${styles.policySuccess}`}>
                  This transfer is fully refundable.
                  {transfer.cancellation_policies?.length > 0 && (
                    <>
                      {' '}
                      Free cancellation before{' '}
                      <strong>
                        {moment(transfer.cancellation_policies[0].from).format('DD MMM YYYY')}
                      </strong>
                      .
                    </>
                  )}
                </div>
                {transfer.cancellation_policies?.map((policy, idx) => (
                  <div key={idx} className={`${styles.policyCard} ${styles.policyWarning}`}>
                    If cancelled from{' '}
                    <strong>{moment(policy.from).format('DD MMM YYYY')}</strong>, a fee of{' '}
                    <strong>
                      <PriceDisplay price={policy.amount} currency={transfer.currency} />
                    </strong>{' '}
                    will be charged.
                  </div>
                ))}
              </>
            ) : (
              <div className={`${styles.policyCard} ${styles.policyDanger}`}>
                This transfer is non-refundable. No refund will be issued in case of cancellation.
              </div>
            )}
          </div>
        )}

        {/* {vehicle?.transmission_type && (
          <div className="d-flex align-items-center gap-2 small text-muted mb-2">
            <PiSuitcaseRolling />
            <span>
              {vehicle.luggage_capacity} bags · {vehicle.transmission_type} transmission
            </span>
          </div>
        )} */}
      </div>

      {!isCheckoutView && (
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <p className={styles.footerPrice}>{priceContent}</p>
            <p className={styles.footerCaption}>VAT and taxes included</p>

            {!isPackageMode && !isEditMode && (
              <div className={styles.quantityRow}>
                <label htmlFor="vehicleQuantity" className={styles.quantityLabel}>
                  Quantity:
                </label>
                <select
                  id="vehicleQuantity"
                  className={`form-select ${styles.quantitySelect}`}
                  value={vehicleQuantity}
                  onChange={(e) => setVehicleQuantity(Number(e.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.bookBtn}
            onClick={() => handleBookNow(vehicleQuantity)}
          >
            {isPackageMode || isEditMode ? 'Select Transfer' : 'Book Now'}
          </button>
        </div>
      )}
    </Modal>
  );
}
