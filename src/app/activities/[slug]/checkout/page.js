'use client'
import React, { useEffect, useState } from 'react'
import { useActivityStore } from '@/components/Store/ActivityStore';
import { FaStar, FaCar } from 'react-icons/fa';
import { FaLocationDot } from 'react-icons/fa6';
import { HiUserGroup } from "react-icons/hi";
import { BiTimeFive } from "react-icons/bi";
import { MdOutlineTranslate } from "react-icons/md";
import moment from 'moment';
import Summery from '@/components/Activities/Checkout/Summery';
import DetailForm from '@/components/Activities/Checkout/DetailForm';
import { getCancellationDisplay } from '@/components/Activities/Detail/cancellationPolicyUtils';
import { IoInformationCircleOutline } from 'react-icons/io5';
import './checkout.css';

export const dynamic = 'force-dynamic';

const PAX_LABELS = {
    ADULT: 'Adult',
    CHILD: 'Child',
    SENIOR: 'Senior',
    INFANT: 'Infant',
};

function formatSessionLabel(codeOrName) {
    if (!codeOrName) return '';
    const value = typeof codeOrName === 'object'
        ? (codeOrName.name || codeOrName.code)
        : codeOrName;
    if (!value) return '';
    const parsed = moment(value, ['HH:mm', 'H:mm', 'hh:mm A'], true);
    return parsed.isValid() ? parsed.format('hh:mm A') : String(value);
}

export default function page() {
    const { selectedActivity } = useActivityStore();
    const [activityDetail, setActivityDetail] = useState({});

    useEffect(() => {
        setActivityDetail(selectedActivity);
    }, [selectedActivity]);

    const totalGuests = (activityDetail?.adults || 0) + (activityDetail?.children || 0);
    const modality = activityDetail?.modality;
    const cancellationDisplay = getCancellationDisplay(
        activityDetail?.cancellation_policy,
        activityDetail?.travel_date
    );

    const guestLabel = () => {
        const modalityPax = modality?.selected_pax;
        if (Array.isArray(modalityPax) && modalityPax.length > 0) {
            return modalityPax
                .filter((p) => Number(p.quantity) > 0)
                .map((p) => {
                    const label = PAX_LABELS[p.paxType] || p.paxType;
                    const plural =
                        p.quantity > 1
                            ? (p.paxType === 'CHILD' ? 'ren' : 's')
                            : '';
                    return `${p.quantity} ${label}${plural}`;
                })
                .join(', ') || '0 Guests';
        }
        const adults = activityDetail?.adults || 0;
        const children = activityDetail?.children || 0;
        const parts = [];
        if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
        if (children > 0) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`);
        return parts.join(', ') || '0 Guests';
    };

    const bannerImage = activityDetail?.banner_image || activityDetail?.featured_image;
    const locationLabel = [activityDetail?.city, activityDetail?.country].filter(Boolean).join(', ');
    const rawDescription = activityDetail?.meeting_and_pickup || activityDetail?.address || '';
    const descriptionText = rawDescription
        && rawDescription.trim().toLowerCase() !== locationLabel.trim().toLowerCase()
        ? rawDescription
        : '';

    return (
        <div className='activity-checkout-container'>
            <div className='container'>

                <div className='checkout-page-header'>
                    <h1>Review Your Booking</h1>
                    <p>Confirm your activity details before completing passenger and payment information.</p>
                </div>

                <section className='checkout-review-hero'>
                    {bannerImage && (
                        <div className='checkout-review-media'>
                            <img
                                src={bannerImage}
                                alt={activityDetail?.title || 'Activity'}
                            />
                        </div>
                    )}

                    <div className='checkout-review-panel'>
                        <div className='checkout-review-title-row'>
                            <h2 className='checkout-review-title'>{activityDetail?.title}</h2>
                            {activityDetail?.rating_stars && (
                                <span className='checkout-review-rating'>
                                    <FaStar className='checkout-review-star' />
                                    {activityDetail.rating_stars}
                                </span>
                            )}
                        </div>

                        {modality?.name && (
                            <p className='checkout-review-desc' style={{ marginBottom: 6 }}>
                                {modality.name}
                            </p>
                        )}

                        {locationLabel && (
                            <p className='checkout-review-location'>
                                <FaLocationDot className='checkout-review-pin' />
                                {locationLabel}
                            </p>
                        )}

                        {descriptionText && (
                            <div className="checkout-review-desc-container">
                                <span className="checkout-review-desc-label">Pick up: </span>
                                <p className='checkout-review-desc'>{descriptionText}</p>
                            </div>
                        )}

                        {(activityDetail?.duration ||
                            totalGuests > 0 ||
                            modality?.session ||
                            modality?.language ||
                            activityDetail?.timing_label ||
                            activityDetail?.start_time ||
                            activityDetail?.travel_date) && (
                            <div className='checkout-review-pills'>
                                {activityDetail?.travel_date && (
                                    <div className='checkout-review-pill'>
                                        <FaCar className='checkout-review-pill-icon' />
                                        <span>
                                            {moment(activityDetail.travel_date).format('ddd, MMM DD, YYYY')}
                                        </span>
                                    </div>
                                )}
                                {(modality?.session || activityDetail?.timing_label || activityDetail?.start_time) && (
                                    <div className='checkout-review-pill'>
                                        <BiTimeFive className='checkout-review-pill-icon' />
                                        <span>
                                            {modality?.session
                                                ? formatSessionLabel(modality.session)
                                                : (activityDetail?.timing_label ||
                                                    formatSessionLabel(activityDetail?.start_time))}
                                        </span>
                                    </div>
                                )}
                                {modality?.language && (
                                    <div className='checkout-review-pill'>
                                        <MdOutlineTranslate className='checkout-review-pill-icon' />
                                        <span>
                                            {modality.language?.description ||
                                                modality.language?.code ||
                                                '—'}
                                        </span>
                                    </div>
                                )}
                                {activityDetail?.duration && (
                                    <div className='checkout-review-pill'>
                                        <FaCar className='checkout-review-pill-icon' />
                                        <span>{activityDetail.duration}</span>
                                    </div>
                                )}
                                {totalGuests > 0 && (
                                    <div className='checkout-review-pill'>
                                        <HiUserGroup className='checkout-review-pill-icon' />
                                        <span>{guestLabel()}</span>
                                    </div>
                                )}
                                {cancellationDisplay && (
                                    <div
                                        className={`checkout-review-pill checkout-review-pill--cancel ${
                                            cancellationDisplay.kind === 'free'
                                                ? 'checkout-review-pill--cancel-free'
                                                : 'checkout-review-pill--cancel-none'
                                        }`}
                                    >
                                        <IoInformationCircleOutline className='checkout-review-pill-icon' />
                                        <span>
                                            {cancellationDisplay.kind === 'free'
                                                ? cancellationDisplay.deadlineLabel
                                                    ? `Free before ${cancellationDisplay.deadlineLabel}`
                                                    : 'Free cancellation available'
                                                : 'Non-refundable'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <div className='row g-4 checkout-main-row'>
                    <div className='col-lg-8 col-12 order-2 order-lg-1'>
                        <div className='checkout-section-header'>
                            <h2>Checkout</h2>
                            <p>Complete your booking — enter passenger and payment details</p>
                        </div>

                        <DetailForm
                            activityDetail={activityDetail}
                            totalGuests={totalGuests}
                            guestLabel={guestLabel()}
                        />
                    </div>

                    <div className='col-lg-4 col-12 order-1 order-lg-2'>
                        <div className='checkout-sidebar'>
                            <Summery
                                activityDetail={activityDetail}
                                totalGuests={totalGuests}
                            />
                         </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
