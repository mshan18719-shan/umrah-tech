'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { IoCheckmarkCircle, IoCloseCircle, IoTimeOutline, IoClose } from 'react-icons/io5';
import { FiUsers } from 'react-icons/fi';
import { FaShoppingCart } from 'react-icons/fa';
import { MdOutlineSupportAgent } from 'react-icons/md';
import { Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import moment from 'moment';
import AdditionalServices from './AdditionalServices';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { useActivityStore } from '@/components/Store/ActivityStore';
import { useRouter } from 'next/navigation';
import Availability from './Availability';
import styles from './BookingSidebar.module.css';
import {
  getCancellationSummary,
  resolveCancellationPolicy,
} from './cancellationPolicyUtils';

export default function Selection({ PackageDetail }) {
  const { setSelectedActivity } = useActivityStore();
  const router = useRouter();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [adultCount, setAdultCount] = useState(0);
  const [childCount, setChildCount] = useState(0);

  const totalPeople = adultCount + childCount;
  const minPeople = PackageDetail?.min_people || 1;
  const maxPeople = PackageDetail?.max_people || 5;
  const isValidPeopleCount = totalPeople >= minPeople && totalPeople <= maxPeople;

  const handleAdultChange = (changeType) => {
    if (changeType === 'plus') {
      if (totalPeople < (PackageDetail?.max_people || 10)) {
        setAdultCount(adultCount + 1);
      }
    } else if (changeType === 'minus' && adultCount > 0) {
      setAdultCount(adultCount - 1);
    }
  };

  const handleChildChange = (changeType) => {
    if (changeType === 'plus') {
      if (totalPeople < (PackageDetail?.max_people || 10)) {
        setChildCount(childCount + 1);
      }
    } else if (changeType === 'minus' && childCount > 0) {
      setChildCount(childCount - 1);
    }
  };

  const adultPrice = adultCount * Number(PackageDetail?.sale_price || 0);
  const childPrice = childCount * Number(PackageDetail?.child_sale_price || 0);
  const participantsTotal = adultPrice + childPrice;

  const perPersonServicesTotal = useMemo(() => {
    return selectedServices
      .filter((service) => service.type === 'per_person')
      .reduce((acc, service) => acc + (service.quantity * Number(service.price)), 0);
  }, [selectedServices]);

  const perBookingServicesTotal = useMemo(() => {
    return selectedServices
      .filter((service) => service.type === 'per_booking')
      .reduce((acc, service) => acc + Number(service.total), 0);
  }, [selectedServices]);

  const grandTotal = participantsTotal + perPersonServicesTotal + perBookingServicesTotal;

  const cancellationInfo = useMemo(
    () => getCancellationSummary(
      PackageDetail?.cancellation_policy,
      PackageDetail?.cancellation_policy_text
    ),
    [PackageDetail?.cancellation_policy, PackageDetail?.cancellation_policy_text]
  );

  const renderCancellationPolicy = () => {
    const cancellationPolicy = resolveCancellationPolicy(
      PackageDetail?.cancellation_policy,
      PackageDetail?.cancellation_policy_text
    );

    if (!cancellationPolicy) {
      return (
        <div className={styles.policyEmptyState}>
          No cancellation policy available.
        </div>
      );
    }

    const { cancel_policy, cancellation_policies } = cancellationPolicy;

    if (cancel_policy === 'non-refundable') {
      return (
        <div className={`${styles.policyBanner} ${styles.policyBannerNegative}`}>
          <span className={`${styles.policyBannerIcon} ${styles.policyBannerIconNegative}`}>
            <IoCloseCircle size={18} />
          </span>
          <div>
            <h6 className={styles.policyBannerTitle}>Non-Refundable</h6>
            <p className={styles.policyBannerText}>
              This booking cannot be cancelled or refunded under any circumstances.
            </p>
          </div>
        </div>
      );
    }

    if (cancel_policy === 'refundable' && cancellation_policies && cancellation_policies.length > 0) {
      const sortedPolicies = [...cancellation_policies].sort((a, b) => b.time_duration - a.time_duration);

      return (
        <div>
          <div className={`${styles.policyBanner} ${styles.policyBannerPositive}`}>
            <span className={`${styles.policyBannerIcon} ${styles.policyBannerIconPositive}`}>
              <IoCheckmarkCircle size={18} />
            </span>
            <div>
              <h6 className={styles.policyBannerTitle}>Refundable Booking</h6>
              <p className={styles.policyBannerText}>
                You can cancel this booking according to the policy below.
              </p>
            </div>
          </div>

          <h6 className={styles.policyTimelineTitle}>Cancellation Timeline:</h6>

          <div>
            {sortedPolicies.map((policy, index) => {
              const timeText = policy.time_duration >= 24
                ? `${policy.time_duration / 24} day${policy.time_duration / 24 > 1 ? 's' : ''}`
                : `${policy.time_duration} hour${policy.time_duration > 1 ? 's' : ''}`;

              let refundText = '';
              let refundAmount = '';
              let refundDescription = '';

              if (policy.type === 'percentage') {
                const refundPercentage = 100 - policy.value;
                refundText = `${policy.value}% Charge`;
                refundDescription = `${policy.value}% cancellation charge applies. You will receive ${refundPercentage}% of the total booking amount back.`;
              } else if (policy.type === 'fixed') {
                refundText = 'Cancellation Fee';
                refundAmount = policy.value;
                refundDescription = 'A fixed cancellation fee will be charged.';
              }

              const isHighlighted = index === 0;

              return (
                <div
                  key={index}
                  className={`${styles.policyCard} ${isHighlighted ? styles.policyCardPositive : styles.policyCardNeutral}`}
                >
                  <span
                    className={`${styles.policyCardIcon} ${
                      isHighlighted ? styles.policyCardIconPositive : styles.policyCardIconNeutral
                    }`}
                  >
                    <IoTimeOutline size={17} />
                  </span>
                  <div className={styles.policyCardBody}>
                    <div className={styles.policyCardHeader}>
                      <div>
                        <p className={styles.policyCardLabel}>Before Activity</p>
                        <p className={styles.policyCardTime}>{timeText}</p>
                      </div>
                      <span
                        className={`${styles.policyCardBadge} ${
                          policy.type === 'percentage'
                            ? styles.policyCardBadgePositive
                            : styles.policyCardBadgeNegative
                        }`}
                      >
                        {refundText}
                      </span>
                    </div>

                    <p className={styles.policyCardText}>{refundDescription}</p>

                    {policy.type === 'fixed' && (
                      <div className={styles.policyCardFee}>
                        Cancellation Fee: <PriceDisplay price={refundAmount} currency={PackageDetail?.currency_code} />
                      </div>
                    )}

                    {policy.type === 'percentage' && policy.value === 0 && (
                      <div className={styles.policyCardFee} style={{ color: '#16a34a' }}>
                        Full refund - No cancellation charges
                      </div>
                    )}
                    {policy.type === 'percentage' && policy.value === 100 && (
                      <div className={styles.policyCardFee}>
                        No refund - 100% cancellation charge
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.policyNote}>
            <strong>Important:</strong>&nbsp;Cancellation must be made before the stated time.
            After this period, the booking is non-refundable.
          </div>
        </div>
      );
    }

    return (
      <div className={`${styles.policyBanner} ${styles.policyBannerPositive}`}>
        <span className={`${styles.policyBannerIcon} ${styles.policyBannerIconPositive}`}>
          <IoCheckmarkCircle size={18} />
        </span>
        <div>
          <h6 className={styles.policyBannerTitle}>Free Cancellation</h6>
          <p className={styles.policyBannerText}>
            This booking can be cancelled free of charge.
          </p>
        </div>
      </div>
    );
  };

  const HandleBookNow = () => {
    const activityData = {
      id: PackageDetail?.id,
      title: PackageDetail?.title,
      address: PackageDetail?.address,
      included_items: PackageDetail?.included_items,
      excluded_items: PackageDetail?.excluded_items,
      banner_image: PackageDetail?.banner_image,
      featured_image: PackageDetail?.featured_image,
      duration: PackageDetail?.activity_duration,
      slug: PackageDetail?.slug,
      travel_date: selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : null,
      adults: adultCount,
      children: childCount,
      meeting_and_pickup: PackageDetail.meeting_and_pickup,
      rating_stars: PackageDetail?.rating_stars,
      participants_total: participantsTotal,
      services_total: perPersonServicesTotal + perBookingServicesTotal,
      grand_total: grandTotal,
      selected_services: selectedServices,
      currency: PackageDetail?.currency_code,
      price_per_adult: PackageDetail?.sale_price,
      price_per_child: PackageDetail?.child_sale_price,
      ppserson_services_total: perPersonServicesTotal,
      pb_services_total: perBookingServicesTotal,
      city: PackageDetail?.city,
      country: PackageDetail?.country,
      cancellation_policy_text: PackageDetail?.cancellation_policy_text,
      cancellation_policy: PackageDetail?.cancellation_policy,
    };
    setSelectedActivity(activityData);

    if (typeof window !== 'undefined') {
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      sessionStorage.setItem('activity_checkout_return_url', returnUrl);
    }

    router.push(`/activities/${PackageDetail.slug}/checkout`);
  };

  return (
    <div className={styles.bookingCard}>
      <div className={styles.priceRow}>
        <span className={styles.priceAmount}>
          <PriceDisplay price={PackageDetail?.sale_price} currency={PackageDetail?.currency_code} />
        </span>
        <span className={styles.priceSuffix}>/ person</span>
      </div>
      {/* <div className={styles.priceSuffix}>VAT and taxes included</div> */}

      {cancellationInfo && (
        <button
          type="button"
          className={`${styles.cancellationRow} ${
            cancellationInfo.variant === 'negative' ? styles.cancellationRowNegative : ''
          }`}
          onClick={open}
        >
          {cancellationInfo.variant === 'negative' ? (
            <IoCloseCircle size={16} />
          ) : (
            <IoCheckmarkCircle size={16} />
          )}
          {cancellationInfo.text}
        </button>
      )}

      <Availability
        PackageDetail={PackageDetail}
        setSelectedDate={setSelectedDate}
        selectedDate={selectedDate}
      />

      <h4 className={styles.guestsTitle}>Number of Guests</h4>
      <p className={styles.requirementsNote}>
        Minimum {minPeople} – Maximum {maxPeople} people
      </p>

      <div className={styles.guestRow}>
        <span className={styles.guestLabel}>Adult</span>
        <div className={styles.counterBar}>
          <button
            type="button"
            onClick={() => handleAdultChange('minus')}
            className={styles.counterBtn}
            disabled={adultCount === 0}
            aria-label="Decrease adults"
          >
            −
          </button>
          <span className={styles.counterValue}>
            <FiUsers className={styles.counterIcon} />
            {adultCount}
          </span>
          <button
            type="button"
            onClick={() => handleAdultChange('plus')}
            className={styles.counterBtn}
            disabled={totalPeople >= maxPeople}
            aria-label="Increase adults"
          >
            +
          </button>
        </div>
      </div>

      {PackageDetail?.has_child_pricing === 1 && (
        <div className={styles.guestRow}>
          <span className={styles.guestLabel}>Child</span>
          <div className={styles.counterBar}>
            <button
              type="button"
              onClick={() => handleChildChange('minus')}
              className={styles.counterBtn}
              disabled={childCount === 0}
              aria-label="Decrease children"
            >
              −
            </button>
            <span className={styles.counterValue}>
              <FiUsers className={styles.counterIcon} />
              {childCount}
            </span>
            <button
              type="button"
              onClick={() => handleChildChange('plus')}
              className={styles.counterBtn}
              disabled={totalPeople >= maxPeople}
              aria-label="Increase children"
            >
              +
            </button>
          </div>
        </div>
      )}

      {PackageDetail?.additional_services && PackageDetail?.additional_services.length > 0 && (
        <div className={styles.servicesSection}>
          <AdditionalServices
            Services={PackageDetail?.additional_services || []}
            currency={PackageDetail?.currency_code}
            selectedServices={selectedServices}
            setSelectedServices={setSelectedServices}
            setServicesTotal={() => {}}
          />
        </div>
      )}

      {totalPeople > 0 && (
        <div className={styles.summaryBox}>
          {adultCount > 0 && childCount === 0 && perPersonServicesTotal === 0 && perBookingServicesTotal === 0 ? (
            <div className={styles.summaryRow}>
              <span>
                <PriceDisplay price={PackageDetail?.sale_price} currency={PackageDetail?.currency_code} />
                {' × '}
                {totalPeople} guest{totalPeople !== 1 ? 's' : ''}
              </span>
              <strong><PriceDisplay price={participantsTotal} currency={PackageDetail?.currency_code} /></strong>
            </div>
          ) : (
            <>
              {adultCount > 0 && (
                <div className={styles.summaryRow}>
                  <span>
                    {adultCount} Adult{adultCount > 1 ? 's' : ''} ×{' '}
                    <PriceDisplay price={PackageDetail?.sale_price} currency={PackageDetail?.currency_code} />
                  </span>
                  <strong><PriceDisplay price={adultPrice} currency={PackageDetail?.currency_code} /></strong>
                </div>
              )}
              {childCount > 0 && (
                <div className={styles.summaryRow}>
                  <span>
                    {childCount} Child{childCount > 1 ? 'ren' : ''} ×{' '}
                    <PriceDisplay price={PackageDetail?.child_sale_price} currency={PackageDetail?.currency_code} />
                  </span>
                  <strong><PriceDisplay price={childPrice} currency={PackageDetail?.currency_code} /></strong>
                </div>
              )}
              {selectedServices.map((service, index) => {
                const serviceTotal = service.type === 'per_person'
                  ? service.quantity * Number(service.price)
                  : Number(service.total);
                return (
                  <div key={index} className={styles.summaryRow}>
                    <span>{service.name}</span>
                    <strong><PriceDisplay price={serviceTotal} currency={PackageDetail?.currency_code} /></strong>
                  </div>
                );
              })}
            </>
          )}

          <hr className={styles.summaryDivider} />
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span className={styles.summaryTotalAmount}>
              <PriceDisplay price={grandTotal} currency={PackageDetail?.currency_code} />
            </span>
          </div>
            <div  className={styles.summaryTax}>Inclusive of VAT and taxes</div>
        </div>
      )}

      {totalPeople > 0 && !isValidPeopleCount && (
        <div className={styles.validationMsg}>
          {totalPeople < minPeople && `Please select at least ${minPeople} participant${minPeople > 1 ? 's' : ''}.`}
          {totalPeople > maxPeople && `Maximum ${maxPeople} participants allowed.`}
        </div>
      )}

      <button
        type="button"
        onClick={HandleBookNow}
        className={styles.checkoutBtn}
        disabled={!selectedDate || !isValidPeopleCount || totalPeople === 0}
      >
        <FaShoppingCart />
        Continue to Checkout
      </button>

      <p className={styles.chargeNote}>You won&apos;t be charged yet</p>

      <hr className={styles.footerDivider} />

      <Link href="/contact-us" className={styles.supportLink}>
        <MdOutlineSupportAgent size={18} />
        Contact Support
      </Link>

      <Modal
        opened={opened}
        onClose={close}
        withCloseButton={false}
        padding={0}
        radius={14}
        size="lg"
        centered
        classNames={{ content: styles.policyModalContent }}
      >
        <div className={styles.policyModalHeader}>
          <div className={styles.policyModalTitleWrap}>
            <p className={styles.policyModalTitle}>Cancellation Policy</p>
            <p className={styles.policyModalSubtitle}>Timeline of refund windows and applicable fees</p>
          </div>
          <button
            type="button"
            className={styles.policyCloseBtn}
            onClick={close}
            aria-label="Close"
          >
            <IoClose size={18} />
          </button>
        </div>
        <div className={styles.policyModalBody}>
          {renderCancellationPolicy()}
        </div>
      </Modal>
    </div>
  );
}