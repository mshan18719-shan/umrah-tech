'use client';
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";
import { IoLocationSharp } from "react-icons/io5";
import { FaRegStar, FaStar, FaStarHalfAlt, FaCar, FaWifi, FaTint, FaShuttleVan } from "react-icons/fa";
import { FiClock, FiExternalLink } from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import GalleryImages from "@/components/Activities/Detail/GalleryImages";
import "@mantine/dates/styles.css";
import WhatExpect from "@/components/Activities/Detail/WhatExpect";
import IncludedExcluded from "@/components/Activities/Detail/IncludedExcluded";
import Faqs from "@/components/Activities/Detail/Faqs";
import Selection from "@/components/Activities/Detail/Selection";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import ActivityDetailLoader from "@/components/Loader/ActivityDetailLoader";
import styles from "./ActivityDetail.module.css";

const FACILITY_PREVIEW_COUNT = 4;
/** ~3–4 lines of body text; shorter copy needs no Read more */
const DESC_PREVIEW_CHARS = 260;

const hasHtmlTags = (text) => /<\/?[a-z][\s\S]*>/i.test(text || '');

const getFacilityIcon = (name = '') => {
  const value = name.toLowerCase();
  if (value.includes('wifi')) return <FaWifi className={styles.facilityPillIcon} />;
  if (value.includes('water') || value.includes('bottle')) return <FaTint className={styles.facilityPillIcon} />;
  if (value.includes('transport') || value.includes('vehicle') || value.includes('car')) {
    return <FaCar className={styles.facilityPillIcon} />;
  }
  if (value.includes('shuttle') || value.includes('pickup')) return <FaShuttleVan className={styles.facilityPillIcon} />;
  return <IoMdCheckmarkCircleOutline className={styles.facilityPillIcon} />;
};

const GetActivityDetail = () => {
  const [packageDetail, setPackageDetail] = React.useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const params = useParams();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      const language = searchParams.get('language');

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/${params.slug}?from=${from}&to=${to}&language=${language}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const response = await res.json();
        setIsLoading(false);
        if (response.Success) {
          setPackageDetail(response?.Content?.activity || {});
          setIsLoading(false);
        }
      } catch (error) {
        console.log("Error fetching activity detail:", error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params, searchParams]);

  const PackageDetail = packageDetail;

  const isHtmlDescription = useMemo(
    () => hasHtmlTags(PackageDetail?.content),
    [PackageDetail?.content]
  );

  const plainDescription = useMemo(() => {
    if (!PackageDetail?.content) return '';
    if (isHtmlDescription) {
      return PackageDetail.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return PackageDetail.content;
  }, [PackageDetail?.content, isHtmlDescription]);

  const needsReadMore = plainDescription.length > DESC_PREVIEW_CHARS;
  const shouldClampDescription = needsReadMore && !descExpanded;

  useEffect(() => {
    setDescExpanded(false);
  }, [PackageDetail?.content, params?.slug]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <ActivityDetailLoader />
      </div>
    );
  }

  if (!PackageDetail || Object.keys(PackageDetail).length === 0) {
    return (
      <div className={styles.page}>
        <h2 className="text-center my-5">Activity detail not found.</h2>
      </div>
    );
  }

  const getYouTubeId = (url) => {
    const regExp = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const cityName = PackageDetail?.city
    ? (typeof PackageDetail.city === 'object' ? PackageDetail.city?.name : PackageDetail.city)
    : '';

  const countryName = PackageDetail?.country
    ? (typeof PackageDetail.country === 'object' ? PackageDetail.country?.name : PackageDetail.country)
    : '';

  const locationLabel = cityName && countryName
    ? `${cityName}, ${countryName}`
    : (PackageDetail?.address || 'Location not specified');

  const shortLocationLabel = cityName || locationLabel;

  const rating = Number(PackageDetail?.rating_stars || 0);
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;

  const facilities = PackageDetail?.facilities || [];
  const visibleFacilities = showAllFacilities
    ? facilities
    : facilities.slice(0, FACILITY_PREVIEW_COUNT);
  const hasMoreFacilities = facilities.length > FACILITY_PREVIEW_COUNT;

  const lat = PackageDetail?.lat || PackageDetail?.latitude;
  const lng = PackageDetail?.lng || PackageDetail?.longitude;
  const mapQuery = lat && lng
    ? `${lat},${lng}`
    : encodeURIComponent(PackageDetail?.address || locationLabel);
  const mapsUrl = lat && lng
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const mapEmbedUrl = lat && lng
    ? `https://maps.google.com/maps?q=${lat},${lng}&t=&z=13&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  const distanceValue = PackageDetail?.distance_from_haram
    || PackageDetail?.distance
    || (cityName?.toLowerCase().includes('makkah') || cityName?.toLowerCase().includes('mecca')
      ? '2.9 km from Haram'
      : 'Distance not specified');

  const walkTimeValue = PackageDetail?.walk_time
    || PackageDetail?.walking_time
    || 'Walk time not specified';

  const ratingValue = PackageDetail?.rating_stars
    ? `${PackageDetail.rating_stars} / 5.0`
    : 'Not rated';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'included', label: 'Included/Excluded' },
  ];

  return (
    <div className={styles.page}>
      <div className="container">
        <div className="mb-3 pt-4">
          <GalleryImages imageList={PackageDetail?.gallery_images || []} />
        </div>

        <div className="row">
          <div className="col-md-8">
            <section id="overview">
              <div className={styles.headerCard}>
                {/* <div className={styles.badgeRow}>
                  {PackageDetail?.category && (
                    <span className={styles.categoryBadge}>
                      <IoLocationSharp />
                      {typeof PackageDetail?.category === 'object' ? PackageDetail?.category?.name : PackageDetail?.category}
                    </span>
                  )}
                  <span className={styles.verifiedBadge}>
                    <MdVerified />
                    Verified Experience
                  </span>
                </div> */}

                {PackageDetail?.rating_stars && (
                  <div className={styles.ratingRow}>
                    {Array.from({ length: 5 }).map((_, index) => {
                      if (index < fullStars) {
                        return <FaStar key={index} className="text-warning" style={{ fontSize: '0.95rem' }} />;
                      }
                      if (index === fullStars && hasHalfStar) {
                        return <FaStarHalfAlt key={index} className="text-warning" style={{ fontSize: '0.95rem' }} />;
                      }
                      return <FaRegStar key={index} className="text-warning" style={{ fontSize: '0.95rem' }} />;
                    })}
                    <span className={styles.ratingValue}>{PackageDetail.rating_stars}</span>
                  </div>
                )}

                <h1 className={styles.title}>{PackageDetail?.title}</h1>

                <div className={styles.metaRow}>
                  <span className={styles.metaItem}>
                    <IoLocationSharp className={styles.metaIcon} />
                    {shortLocationLabel}
                  </span>
                  {PackageDetail?.activity_duration && (
                    <span className={styles.metaItem}>
                      <FaCar className={styles.metaIcon} />
                      {PackageDetail.activity_duration}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.tabBar}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <>
                  <div className={styles.contentCard}>
                    <h3 className={styles.sectionTitle}>Description</h3>
                    {(PackageDetail?.content || plainDescription) && (
                      <>
                        {isHtmlDescription && descExpanded ? (
                          <div
                            className={styles.descriptionContent}
                            dangerouslySetInnerHTML={{ __html: PackageDetail.content }}
                          />
                        ) : (
                          <p
                            className={`${styles.descriptionContent}${
                              shouldClampDescription ? ` ${styles.descriptionClamped}` : ''
                            }`}
                          >
                            {isHtmlDescription ? plainDescription : PackageDetail.content}
                          </p>
                        )}
                        {needsReadMore && (
                          <button
                            type="button"
                            className={styles.viewMoreBtn}
                            onClick={() => setDescExpanded((prev) => !prev)}
                          >
                            {descExpanded ? 'Read less' : 'Read more'}
                          </button>
                        )}
                      </>
                    )}

                    {PackageDetail?.youtube_video_link && getYouTubeId(PackageDetail?.youtube_video_link) && (
                      <div className="ratio ratio-16x9 mt-4">
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeId(PackageDetail?.youtube_video_link)}`}
                          title="YouTube video"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>

                  {/* <div className={styles.infoCardsRow}>
                    <div className={styles.infoCard}>
                      <div className={styles.infoIconWrap}>
                        <HiOutlineBuildingOffice2 />
                      </div>
                      <div>
                        <span className={styles.infoLabel}>Distance</span>
                        <span className={styles.infoValue}>{distanceValue}</span>
                      </div>
                    </div>
                    <div className={styles.infoCard}>
                      <div className={styles.infoIconWrap}>
                        <FiClock />
                      </div>
                      <div>
                        <span className={styles.infoLabel}>Walk Time</span>
                        <span className={styles.infoValue}>{walkTimeValue}</span>
                      </div>
                    </div>
                    <div className={styles.infoCard}>
                      <div className={styles.infoIconWrap}>
                        <FaStar />
                      </div>
                      <div>
                        <span className={styles.infoLabel}>Rating</span>
                        <span className={styles.infoValue}>{ratingValue}</span>
                      </div>
                    </div>
                  </div> */}

                  {facilities.length > 0 && (
                    <div className={styles.contentCard}>
                      <div className={styles.facilitiesSection}>
                        <h3 className={styles.sectionTitle}>Facilities</h3>
                        <div className={styles.facilityPills}>
                          {visibleFacilities.map((item, index) => (
                            <span key={index} className={styles.facilityPill}>
                              {getFacilityIcon(item.name)}
                              {item.name}
                            </span>
                          ))}
                          {hasMoreFacilities && !showAllFacilities && (
                            <button
                              type="button"
                              className={styles.viewMoreBtn}
                              onClick={() => setShowAllFacilities(true)}
                            >
                              View More+
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'itinerary' && (
                (PackageDetail?.what_to_expect && PackageDetail?.what_to_expect.length > 0) ? (
                  <WhatExpect expectData={PackageDetail?.what_to_expect} />
                ) : (
                  <div className={`${styles.contentCard} ${styles.emptyState}`}>
                    <p className="mb-0">No itinerary information available.</p>
                  </div>
                )
              )}

              {activeTab === 'included' && (
                <IncludedExcluded
                  included={PackageDetail?.included_items || ""}
                  excluded={PackageDetail?.excluded_items || ""}
                />
              )}
            </section>

            <section className={styles.contentCard}>
              <h3 className={styles.meetingTitle}>
                <IoLocationSharp className={styles.meetingTitleIcon} />
                Meeting Pickups
              </h3>

              <div className={styles.meetingGrid}>
                <div className={styles.meetingBox}>
                  <span className={styles.meetingLabel}>Meeting Point</span>
                  <p className={styles.meetingText}>
                    {PackageDetail?.meeting_and_pickup || 'Meeting point details will be shared after booking.'}
                  </p>
                </div>
                <div className={styles.meetingBox}>
                  <span className={styles.meetingLabel}>End Point</span>
                  <p className={styles.meetingText}>
                    This activity ends back at the meeting point.
                  </p>
                </div>
              </div>
            </section>

            {/* <section className={styles.mapSection}>
              <div className={styles.mapWrap}>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.openMapsBtn}
                >
                  Open in Maps
                  <FiExternalLink />
                </a>
                <iframe
                  title="Activity location map"
                  className={styles.mapFrame}
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </section> */}

            <Faqs faqsList={PackageDetail?.faqs || []} />
          </div>

          <div className="col-md-4">
            <Selection PackageDetail={PackageDetail} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetActivityDetail;
