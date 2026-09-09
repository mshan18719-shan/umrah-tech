'use client'
import React, { useEffect, useState } from 'react'
import { useActivityStore } from '@/components/Store/ActivityStore';
import { FaStar, FaCar } from 'react-icons/fa';
import { FaLocationDot } from 'react-icons/fa6';
import { HiUserGroup } from "react-icons/hi";
import Summery from '@/components/Activities/Checkout/Summery';
import DetailForm from '@/components/Activities/Checkout/DetailForm';
import './checkout.css';

export const dynamic = 'force-dynamic';

export default function page() {
    const { selectedActivity } = useActivityStore();
    const [activityDetail, setActivityDetail] = useState({});

    useEffect(() => {
        setActivityDetail(selectedActivity);
    }, [selectedActivity]);

    const totalGuests = (activityDetail?.adults || 0) + (activityDetail?.children || 0);

    const guestLabel = () => {
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

                        {(activityDetail?.duration || totalGuests > 0) && (
                            <div className='checkout-review-pills'>
                                {activityDetail?.duration && (
                                    <div className='checkout-review-pill'>
                                        <FaCar className='checkout-review-pill-icon' />
                                        <span>{activityDetail.duration}</span>
                                    </div>
                                )}
                                {totalGuests > 0 && (
                                    <div className='checkout-review-pill'>
                                        <HiUserGroup className='checkout-review-pill-icon' />
                                        <span>Pax {totalGuests}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <div className='row g-4 checkout-main-row'>
                    <div className='col-lg-8 col-12 order-2 order-lg-1'>

                        {/* {activityDetail?.included_items && (
                            <div className='checkout-included-card'>
                                <h5>What&apos;s Included &amp; Excluded</h5>
                                <div className='row g-3'>
                                    <div className='col-md-6'>
                                        <div className='included-col included'>
                                            <h6>What&apos;s Included</h6>
                                            <p className='col-subtitle'>Everything covered in your experience</p>
                                            <div dangerouslySetInnerHTML={{ __html: activityDetail.included_items }} />
                                        </div>
                                    </div>
                                    <div className='col-md-6'>
                                        <div className='included-col excluded'>
                                            <h6>What&apos;s Excluded</h6>
                                            <p className='col-subtitle'>Items not covered in the price</p>
                                            <div dangerouslySetInnerHTML={{ __html: activityDetail.excluded_items }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )} */}

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
