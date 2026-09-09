'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import { usePackageStore } from '@/components/Store/PackageStore';
import GuestForm from '@/components/Package/Checkout/GuestForm';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import styles from './PackageCheckout.module.css';

export const dynamic = 'force-dynamic';

export default function PackageCheckoutPage() {
  const { selectedPackage } = usePackageStore();
  const [packageDetail, setPackageDetail] = useState({});
  const [servicesTotal, setServicesTotal] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [roomList, setRoomList] = useState([]);
  const [expandedRooms, setExpandedRooms] = useState([]);
  const formRef = useRef(null);

  useEffect(() => {
    setPackageDetail(selectedPackage || {});
    setRoomList(selectedPackage?.selected_rooms || []);
    const services = selectedPackage?.selected_services || [];
    setSelectedServices(services);
    setServicesTotal(
      Number(selectedPackage?.services_total) ||
      services.reduce((acc, s) => acc + Number(s.total || 0), 0)
    );
  }, [selectedPackage]);

  useEffect(() => {
    if (!roomList.length) {
      setExpandedRooms([]);
      return;
    }
    const expanded = [];
    roomList.forEach((room) => {
      const numRooms = Number(room.rooms) || 1;
      let remAdults = Number(room.adults) || 0;
      let remChildren = Number(room.children) || 0;
      let remInfants = Number(room.infants) || 0;
      let remAdultsWB = Number(room.adults_without_bed) || 0;
      let remChildrenWB = Number(room.children_without_bed) || 0;
      let remInfantsWB = Number(room.infants_without_bed) || 0;
      for (let i = 0; i < numRooms; i++) {
        const remaining = numRooms - i;
        const adultsInRoom = i === numRooms - 1 ? remAdults : Math.ceil(remAdults / remaining);
        const childrenInRoom = i === numRooms - 1 ? remChildren : Math.ceil(remChildren / remaining);
        const infantsInRoom = i === numRooms - 1 ? remInfants : Math.ceil(remInfants / remaining);
        remAdults -= adultsInRoom;
        remChildren -= childrenInRoom;
        remInfants -= infantsInRoom;
        const adultsWB = Math.min(remAdultsWB, 1);
        remAdultsWB -= adultsWB;
        const maxChildWB = adultsWB > 0 ? 1 : 2;
        const childrenWB = Math.min(remChildrenWB, maxChildWB);
        remChildrenWB -= childrenWB;
        const infantsWB = Math.min(remInfantsWB, 1);
        remInfantsWB -= infantsWB;
        expanded.push({
          ...room,
          roomIndex: i + 1,
          adultsInRoom,
          childrenInRoom,
          infantsInRoom,
          adultsWB,
          childrenWB,
          infantsWB,
        });
      }
    });
    setExpandedRooms(expanded);
  }, [roomList]);

  const withoutBedTotal = expandedRooms
    .filter((r) => r.adultsInRoom > 0 || r.childrenInRoom > 0 || r.infantsInRoom > 0)
    .reduce(
      (acc, room) =>
        acc +
        room.adultsWB * Number(room.adult_without_bed_price || 0) +
        room.childrenWB * Number(room.child_without_bed_price || 0) +
        room.infantsWB * Number(room.infant_without_bed_price || 0),
      0
    );

  const grandTotal = Number(packageDetail?.total_amount || 0) + servicesTotal;
  const passengerCount = (packageDetail?.selected_rooms || []).reduce(
    (acc, room) =>
      acc +
      (Number(room.adults) || 0) +
      (Number(room.children) || 0) +
      (Number(room.infants) || 0) +
      (Number(room.adults_without_bed) || 0) +
      (Number(room.children_without_bed) || 0) +
      (Number(room.infants_without_bed) || 0),
    0
  );

  const reviewHref =
    packageDetail?.category?.slug
      ? `/${packageDetail.category.slug}/review`
      : '/';

  if (!packageDetail?.id && !packageDetail?.title) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.empty}>No booking in progress. Please select a package first.</p>
          <Link href="/" className={styles.backTextLink}>Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>Checkout</h1>
          <p className={styles.subtitle}>
            Complete your booking — enter passenger and payment details.
          </p>
        </header>

        <div className={styles.layout}>
          <div className={styles.mainCol}>
            <GuestForm
              ref={formRef}
              packageDetail={packageDetail}
              servicesTotal={servicesTotal}
              selectedServices={selectedServices}
              expandedRooms={expandedRooms}
              withoutBedTotal={withoutBedTotal}
              passengerCount={passengerCount}
            />
          </div>

          <aside className={styles.sidebar}>

            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>

              {expandedRooms
                .filter(
                  (room) =>
                    room.adultsInRoom > 0 ||
                    room.childrenInRoom > 0 ||
                    room.infantsInRoom > 0
                )
                .map((room, index) => (
                  <div key={index} className={styles.summaryBlock}>
                    <div className={styles.summaryBlockTitle}>
                      Room {room.roomIndex} – {room.type}
                    </div>
                    {room.adultsInRoom > 0 && (
                      <div className={styles.summaryRow}>
                        <span>Adult × {room.adultsInRoom}</span>
                        <strong>
                          <PriceDisplay
                            price={Number(room.sale_per_person) * room.adultsInRoom}
                            currency={packageDetail?.currency_code}
                          />
                        </strong>
                      </div>
                    )}
                    {room.childrenInRoom > 0 && (
                      <div className={styles.summaryRow}>
                        <span>Child × {room.childrenInRoom}</span>
                        <strong>
                          <PriceDisplay
                            price={Number(room.child_sale_per_person) * room.childrenInRoom}
                            currency={packageDetail?.currency_code}
                          />
                        </strong>
                      </div>
                    )}
                    {room.infantsInRoom > 0 && (
                      <div className={styles.summaryRow}>
                        <span>Infant × {room.infantsInRoom}</span>
                        <strong>
                          <PriceDisplay
                            price={Number(room.infant_sale_per_person) * room.infantsInRoom}
                            currency={packageDetail?.currency_code}
                          />
                        </strong>
                      </div>
                    )}
                    {(room.adultsWB > 0 || room.childrenWB > 0 || room.infantsWB > 0) && (
                      <div className={styles.wbBlock}>
                        <div className={styles.wbLabel}>Without Bed</div>
                        {room.adultsWB > 0 && (
                          <div className={styles.summaryRow}>
                            <span>Adult × {room.adultsWB}</span>
                            <strong>
                              <PriceDisplay
                                price={Number(room.adult_without_bed_price) * room.adultsWB}
                                currency={packageDetail?.currency_code}
                              />
                            </strong>
                          </div>
                        )}
                        {room.childrenWB > 0 && (
                          <div className={styles.summaryRow}>
                            <span>Child × {room.childrenWB}</span>
                            <strong>
                              <PriceDisplay
                                price={Number(room.child_without_bed_price) * room.childrenWB}
                                currency={packageDetail?.currency_code}
                              />
                            </strong>
                          </div>
                        )}
                        {room.infantsWB > 0 && (
                          <div className={styles.summaryRow}>
                            <span>Infant × {room.infantsWB}</span>
                            <strong>
                              <PriceDisplay
                                price={Number(room.infant_without_bed_price) * room.infantsWB}
                                currency={packageDetail?.currency_code}
                              />
                            </strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

              {selectedServices.length > 0 && (
                <div className={styles.addonsSection}>
                  <div className={styles.addonsLabel}>ADD-ONS</div>
                  {selectedServices.map((service, index) => (
                    <div key={index} className={styles.summaryRow}>
                      <span>
                        {service?.name} × {service?.quantity}
                      </span>
                      <strong>
                        <PriceDisplay
                          price={Number(service?.total)}
                          currency={packageDetail?.currency_code}
                        />
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              {withoutBedTotal > 0 && (
                <div className={styles.summaryRow}>
                  <span>Without Bed total</span>
                  <strong>
                    <PriceDisplay
                      price={withoutBedTotal}
                      currency={packageDetail?.currency_code}
                    />
                  </strong>
                </div>
              )}

              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <strong>
                  <PriceDisplay price={grandTotal} currency={packageDetail?.currency_code} />
                </strong>
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
                <strong>
                  <PriceDisplay price={grandTotal} currency={packageDetail?.currency_code} />
                </strong>
              </div>
              <p className={styles.taxNote}>VAT and taxes included</p>

              <div className={styles.trustBadge}>
                <HiOutlineShieldCheck size={15} />
                ATOL Protected · Secure Checkout
              </div>

              <Link href={reviewHref} className={styles.backTextLink}>
                ← Back to Review
              </Link>
            </div>

            {packageDetail?.cancellation_policy && (
              <div
                className={`${styles.cancellationCard} ${packageDetail.cancellation_policy.cancel_policy === 'refundable'
                    ? styles.cancellationRefundable
                    : styles.cancellationNonRefundable
                  }`}
              >
                <div className={styles.cancellationTitle}>
                  {packageDetail.cancellation_policy.cancel_policy === 'refundable' ? (
                    <FaCheckCircle size={14} />
                  ) : (
                    <FaTimes size={13} />
                  )}
                  Cancellation Policy
                </div>
                {packageDetail.cancellation_policy.cancel_policy === 'refundable' &&
                  !!packageDetail.cancellation_policy.cancellation_policies?.length && (
                    <ul className={styles.cancellationList}>
                      {packageDetail.cancellation_policy.cancellation_policies.map(
                        (policy, i) => (
                          <li key={i}>
                            If cancelled <strong>{policy.time_duration} hours</strong> before
                            departure, a{' '}
                            {policy.type === 'percentage' ? (
                              <>
                                <strong>{policy.value}%</strong> cancellation charge
                              </>
                            ) : (
                              <>
                                fixed cancellation charge of{' '}
                                <strong>
                                  <PriceDisplay
                                    price={policy.value}
                                    currency={packageDetail?.currency_code}
                                  />
                                </strong>
                              </>
                            )}{' '}
                            will apply.
                          </li>
                        )
                      )}
                    </ul>
                  )}
                {packageDetail.cancellation_policy.cancel_policy !== 'refundable' && (
                  <p className={styles.cancellationText}>
                    This booking is non-refundable. No refund will be issued for cancellations.
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
