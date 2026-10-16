'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { IoCheckmarkCircle, IoCloseCircle, IoTimeOutline, IoClose } from 'react-icons/io5';
import { FiUsers } from 'react-icons/fi';
import { FaShoppingCart } from 'react-icons/fa';
import { MdOutlineSupportAgent, MdVerifiedUser } from 'react-icons/md';
import { Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import moment from 'moment';
import AdditionalServices from './AdditionalServices';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { useActivityStore } from '@/components/Store/ActivityStore';
import { useRouter, useSearchParams } from 'next/navigation';
import Availability from './Availability';
import ModalityOptions from './ModalityOptions';
import styles from './BookingSidebar.module.css';
import {
  formatDeadlineDate,
  formatPolicyTimeText,
  getCancellationSummary,
  getPolicyCharge,
  getPolicyHours,
  isFromAmountPolicyStyle,
  resolveCancellationPolicies,
  resolveCancellationPolicy,
} from './cancellationPolicyUtils';

export default function Selection({ PackageDetail }) {
  const { setSelectedActivity } = useActivityStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [adultCount, setAdultCount] = useState(0);
  const [childCount, setChildCount] = useState(0);

  const modalities = PackageDetail?.modalities || [];
  const hasModalities = Array.isArray(modalities) && modalities.length > 0;
  const [selectedSession, setSelectedSession] = useState(null);

  const modalitySessions = useMemo(() => {
    const map = new Map();
    modalities.forEach((modality) => {
      ;(modality?.sessions || []).forEach((s) => {
        if (s?.code && !map.has(s.code)) map.set(s.code, s);
      });
      const rateDetails = modality?.rates?.[0]?.rate_details || [];
      rateDetails.forEach((detail) => {
        ;(detail.sessions || []).forEach((s) => {
          if (s?.code && !map.has(s.code)) map.set(s.code, s);
        });
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      String(a.code).localeCompare(String(b.code))
    );
  }, [modalities]);

  useEffect(() => {
    const from = searchParams.get('from');
    if (!from) return;
    const date = moment(from, 'YYYY-MM-DD');
    if (!date.isValid()) return;
    setSelectedDate(date.clone());
  }, [searchParams, PackageDetail?.id]);

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
    const resolved = resolveCancellationPolicies(PackageDetail);
    const fallback = resolveCancellationPolicy(
      PackageDetail?.cancellation_policy,
      PackageDetail?.cancellation_policy_text
    );
    const cancellationPolicy = {
      cancel_policy: resolved.cancel_policy || fallback?.cancel_policy,
      cancellation_policies:
        resolved.cancellation_policies?.length
          ? resolved.cancellation_policies
          : fallback?.cancellation_policies || [],
    };

    if (!cancellationPolicy.cancel_policy && !cancellationPolicy.cancellation_policies.length) {
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

    if (cancellation_policies && cancellation_policies.length > 0) {
      const travelDate = PackageDetail?.travel_date || selectedDate;
      const sessionCode = PackageDetail?.modality?.session?.code || PackageDetail?.modality?.session;

      if (isFromAmountPolicyStyle(cancellation_policies)) {
        const policy = cancellation_policies[0];
        const dateLabel = formatDeadlineDate(policy);
        const amount = Number(policy.amount ?? policy.original_amount ?? 0);
        const currency = PackageDetail?.currency_code || PackageDetail?.currency;

        return (
          <div>
            <div className={`${styles.policyBanner} ${styles.policyBannerPositive}`}>
              <span className={`${styles.policyBannerIcon} ${styles.policyBannerIconPositive}`}>
                <IoCheckmarkCircle size={18} />
              </span>
              <div>
                <h6 className={styles.policyBannerTitle}>Refundable Booking</h6>
                <p className={styles.policyBannerText}>
                  {dateLabel
                    ? `Cancel free before ${dateLabel} and get a full refund.`
                    : 'Free cancellation is available until the deadline below.'}
                </p>
              </div>
            </div>

            <h6 className={styles.policyTimelineTitle}>What happens if you cancel:</h6>

            <div className={`${styles.policyCard} ${styles.policyCardPositive}`}>
              <span className={`${styles.policyCardIcon} ${styles.policyCardIconPositive}`}>
                <IoCheckmarkCircle size={17} />
              </span>
              <div className={styles.policyCardBody}>
                <div className={styles.policyCardHeader}>
                  <div>
                    <p className={styles.policyCardLabel}>Free cancellation</p>
                    <p className={styles.policyCardTime}>
                      {dateLabel ? `Before ${dateLabel}` : 'Before the deadline'}
                    </p>
                  </div>
                  <span className={`${styles.policyCardBadge} ${styles.policyCardBadgePositive}`}>
                    Free
                  </span>
                </div>
                <p className={styles.policyCardText}>Full refund. No cancellation fee.</p>
              </div>
            </div>

            <div className={`${styles.policyCard} ${styles.policyCardNeutral}`}>
              <span className={`${styles.policyCardIcon} ${styles.policyCardIconNeutral}`}>
                <IoTimeOutline size={17} />
              </span>
              <div className={styles.policyCardBody}>
                <div className={styles.policyCardHeader}>
                  <div>
                    <p className={styles.policyCardLabel}>Fee applies</p>
                    <p className={styles.policyCardTime}>
                      {dateLabel ? `On or after ${dateLabel}` : 'After the deadline'}
                    </p>
                  </div>
                  <span className={`${styles.policyCardBadge} ${styles.policyCardBadgeNegative}`}>
                    Fee applies
                  </span>
                </div>
                <p className={styles.policyCardText}>Cancellation fee will be charged.</p>
                {amount > 0 && (
                  <div className={styles.policyCardFee}>
                    Fee: <PriceDisplay price={amount} currency={currency} />
                  </div>
                )}
              </div>
            </div>

            <div className={styles.policyNote}>
              <strong>Tip:</strong>&nbsp;Cancel before the date above to get your money back.
            </div>
          </div>
        );
      }

      const sortedPolicies = [...cancellation_policies].sort((a, b) => {
        const hoursA = getPolicyHours(a, travelDate, sessionCode) ?? 0;
        const hoursB = getPolicyHours(b, travelDate, sessionCode) ?? 0;
        return hoursB - hoursA;
      });

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
              const timeText = formatPolicyTimeText(policy, travelDate, sessionCode);
              const charge = getPolicyCharge(policy);
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
                        <p className={styles.policyCardLabel}>Cancellation window</p>
                        <p className={styles.policyCardTime}>{timeText}</p>
                      </div>
                      <span
                        className={`${styles.policyCardBadge} ${
                          charge.isFree
                            ? styles.policyCardBadgePositive
                            : styles.policyCardBadgeNegative
                        }`}
                      >
                        {charge.refundText}
                      </span>
                    </div>

                    <p className={styles.policyCardText}>{charge.refundDescription}</p>

                    {charge.refundAmount != null && Number(charge.refundAmount) > 0 && (
                      <div className={styles.policyCardFee}>
                        Cancellation Fee:{' '}
                        <PriceDisplay
                          price={charge.refundAmount}
                          currency={PackageDetail?.currency_code || PackageDetail?.currency}
                        />
                      </div>
                    )}

                    {charge.isFree && (
                      <div className={styles.policyCardFee} style={{ color: '#16a34a' }}>
                        Full refund - No cancellation charges
                      </div>
                    )}
                    {charge.isFullCharge && (
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

  const buildBaseActivityData = () => ({
    id: PackageDetail?.id,
    title: PackageDetail?.title,
    address: PackageDetail?.address,
    included_items: PackageDetail?.included_items,
    excluded_items: PackageDetail?.excluded_items,
    banner_image: PackageDetail?.banner_image,
    featured_image: PackageDetail?.featured_image,
    duration: PackageDetail?.activity_duration,
    provider: PackageDetail?.provider,
    payment_methods: PackageDetail?.payment_methods,
    payment_mode: PackageDetail?.payment_mode,
    slug: PackageDetail?.slug,
    travel_date: selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : null,
    meeting_and_pickup: PackageDetail?.meeting_and_pickup,
    rating_stars: PackageDetail?.rating_stars,
    selected_services: selectedServices,
    currency: PackageDetail?.original_currency_code || PackageDetail?.currency_code,
    ppserson_services_total: perPersonServicesTotal,
    pb_services_total: perBookingServicesTotal,
    services_total: perPersonServicesTotal + perBookingServicesTotal,
    city: PackageDetail?.city,
    country: PackageDetail?.country,
    cancellation_policy_text: PackageDetail?.cancellation_policy_text,
    cancellation_policy: PackageDetail?.cancellation_policy,
    questions: PackageDetail?.questions || [],
  });

  const persistCheckoutReturnUrl = () => {
    if (typeof window !== 'undefined') {
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      sessionStorage.setItem('activity_checkout_return_url', returnUrl);
    }
  };

  const resolveOpenHoursTiming = () => {
    if (!selectedDate || !PackageDetail?.open_hours) return null;
    const dayName = moment(selectedDate).format('dddd').toLowerCase();
    const dayInfo = PackageDetail.open_hours[dayName];
    if (!dayInfo || !(dayInfo.enabled === '1' || dayInfo.enabled === true)) return null;
    if (!dayInfo.open || !dayInfo.close) return null;
    return {
      start: dayInfo.open,
      end: dayInfo.close,
      start_label: moment(dayInfo.open, 'HH:mm').format('h:mm A'),
      end_label: moment(dayInfo.close, 'HH:mm').format('h:mm A'),
    };
  };

  const HandleBookNow = () => {
    const openHoursTiming = resolveOpenHoursTiming();
    const activityData = {
      ...buildBaseActivityData(),
      adults: adultCount,
      children: childCount,
      participants_total: participantsTotal,
      grand_total: grandTotal,
      price_per_adult: PackageDetail?.sale_price,
      price_per_child: PackageDetail?.child_sale_price,
      ...(openHoursTiming
        ? {
            start_time: openHoursTiming.start,
            end_time: openHoursTiming.end,
            timing_label: `${openHoursTiming.start_label} – ${openHoursTiming.end_label}`,
          }
        : {}),
    };
    setSelectedActivity(activityData);
    persistCheckoutReturnUrl();
    router.push(`/activities/${PackageDetail.slug}/checkout`);
  };

  const HandleModalityProceed = (selection) => {
    const servicesTotalAmount = perPersonServicesTotal + perBookingServicesTotal;
    const activityData = {
      ...buildBaseActivityData(),
      adults: selection.adults,
      children: selection.children,
      participants_total: selection.participants_total,
      grand_total: selection.participants_total + servicesTotalAmount,
      price_per_adult: selection.price_per_adult,
      price_per_child: selection.price_per_child,
      duration: selection.duration
        ? `${selection.duration.value} ${String(selection.duration.metric || '').toLowerCase()}`
        : PackageDetail?.activity_duration,
      modality: {
        code: selection.modality?.code,
        name: selection.modality?.name,
        unique_identifier: selection.modality?.unique_identifier,
        rate_key: selection.rate_key,
        session: selection.session,
        language: selection.language,
        quantities: selection.quantities,
        selected_pax: selection.selected_pax || [],
        cancellation_policies: selection.cancellation_policies,
        duration: selection.duration,
      },
    };
    setSelectedActivity(activityData);
    persistCheckoutReturnUrl();
    router.push(`/activities/${PackageDetail.slug}/checkout`);
  };

  if (hasModalities) {
    return (
      <div className={styles.bookingCard}>
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
          sessions={modalitySessions}
          selectedSession={selectedSession}
          onSelectSession={setSelectedSession}
        />

        <h4 className={styles.guestsTitle}>Select Options</h4>
        <p className={styles.requirementsNote}>Choose package, language and tickets.</p>

        <div className={styles.guaranteeBanner}>
          <MdVerifiedUser size={20} className={styles.guaranteeIcon} />
          <span className={styles.guaranteeText}>Lowest Price Guarantee</span>
        </div>

        {PackageDetail?.additional_services?.length > 0 && (
          <div className={styles.servicesSection}>
            <AdditionalServices
              Services={PackageDetail.additional_services}
              currency={PackageDetail?.original_currency_code || PackageDetail?.currency_code}
              selectedServices={selectedServices}
              setSelectedServices={setSelectedServices}
              setServicesTotal={() => {}}
            />
          </div>
        )}

        <ModalityOptions
          modalities={modalities}
          currency={PackageDetail?.original_currency_code || PackageDetail?.currency_code}
          selectedDate={selectedDate}
          maxPeople={PackageDetail?.max_people || 12}
          minPeople={PackageDetail?.min_people || 1}
          cancellationPolicy={PackageDetail?.cancellation_policy}
          selectedTime={selectedSession}
          onSelectTime={setSelectedSession}
          hideTimeSection={modalitySessions.length > 0}
          onProceed={HandleModalityProceed}
        />

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
            <button type="button" className={styles.policyCloseBtn} onClick={close} aria-label="Close">
              <IoClose size={18} />
            </button>
          </div>
          <div className={styles.policyModalBody}>{renderCancellationPolicy()}</div>
        </Modal>
      </div>
    );
  }

  return (
    <div className={styles.bookingCard}>
      <div className={styles.priceRow}>
        <span className={styles.priceAmount}>
          <PriceDisplay price={PackageDetail?.sale_price} currency={PackageDetail?.currency_code} />
        </span>
        <span className={styles.priceSuffix}>/ person</span>
      </div>
      {Number(PackageDetail?.child_sale_price) > 0 && (
        <div className={styles.priceRow} style={{ marginTop: 4 }}>
          <span className={styles.priceAmount} style={{ fontSize: '1rem' }}>
            <PriceDisplay price={PackageDetail.child_sale_price} currency={PackageDetail?.currency_code} />
          </span>
          <span className={styles.priceSuffix}>/ child</span>
        </div>
      )}

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