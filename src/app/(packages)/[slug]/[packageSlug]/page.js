'use client';
import Link from "next/link";
import React, { useState, useEffect, use, useMemo } from "react";
import { BiCategory, BiPhone } from "react-icons/bi";
import PackageGalleryImages from "@/components/Package/Detail/PackageGalleryImages";
import { BsHeadset, BsWhatsapp } from "react-icons/bs";
import { FaBus,FaCalendarAlt, FaCalendarCheck, FaCheckCircle, FaHotel, FaMoon, FaPlane, FaShieldAlt, FaStar, FaTimes, FaUserFriends, FaWhatsapp,} from "react-icons/fa";
import moment from "moment";
import PackageDetailFaqs from "@/components/Package/Detail/PackageDetailFaqs";
import PackageDetailIteniry from "@/components/Package/Detail/PackageDetailIteniry";
import PriceDisplay from "@/components/Currency/PriceDisplay";
import BookNowButton from "@/components/Package/Detail/BookNowButton";
import PackageHotelDetail from "@/components/Package/Detail/PackageHotelDetail";
import PackageFlightDetail from "@/components/Package/Detail/PackageFlightDetail";
import { GiPassport, GiMedal } from "react-icons/gi";
import styles from "./PackageDetail.module.css";

/** ~3–4 lines of body text; shorter copy needs no Read more */
const DESC_PREVIEW_CHARS = 260;

const hasHtmlTags = (text) => /<\/?[a-z][\s\S]*>/i.test(text || '');

// CMS content sometimes includes empty <p>/<li> tags (just a <br>, &nbsp;, or
// whitespace). Every item here gets its own pill via CSS, so empty ones show
// as blank boxes with only the icon.
function stripEmptyListItems(html) {
    if (!html) return '';
    return html
        .replace(/<li[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/li>/gi, '')
        .replace(/<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
        .trim();
}

const formatTripType = (type) => {
    const labels = {
        'one-way': 'One Way',
        return: 'Return',
        'all-round': 'All Round',
    };
    return labels[type] || type;
};

function findRoomPrice(prices, keyword) {
    return prices.find((p) =>
        String(p?.type || '').toLowerCase().includes(keyword)
    );
}

/** Prefer Quad → Triple → Double for the hero price box */
function getFeaturedRoomPrice(prices) {
    return (
        findRoomPrice(prices, 'quad') ||
        findRoomPrice(prices, 'triple') ||
        findRoomPrice(prices, 'double') ||
        prices[0] ||
        null
    );
}

export default function page({ params }) {
    const { packageSlug: slug } = use(params);
    const [PackageDetail, setPackageDetail] = useState({});
    const [PriceDetail, setPriceDetail] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentURL, setCurrentURL] = useState("");
    const [descExpanded, setDescExpanded] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setCurrentURL(window.location.href);
        }
    }, []);

    useEffect(() => {
        const fetchPackageData = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages/${slug}`, {
                    cache: 'no-store',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                const response = await res.json();
                if (response.Success) {
                    setPackageDetail(response?.Content?.package);
                    setPriceDetail(response?.Content?.package?.price_Details ? response?.Content?.package?.price_Details : []);
                }
            } catch (error) {
                console.error('Error fetching package:', error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchPackageData();
        }
    }, [slug]);

    const isHtmlDescription = useMemo(
        () => hasHtmlTags(PackageDetail?.description),
        [PackageDetail?.description]
    );

    const plainDescription = useMemo(() => {
        if (!PackageDetail?.description) return '';
        if (isHtmlDescription) {
            return PackageDetail.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        return PackageDetail.description;
    }, [PackageDetail?.description, isHtmlDescription]);

    const needsReadMore = plainDescription.length > DESC_PREVIEW_CHARS;
    const shouldClampDescription = needsReadMore && !descExpanded;

    useEffect(() => {
        setDescExpanded(false);
    }, [PackageDetail?.description, slug]);

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>;
    }

    if (!PackageDetail || Object.keys(PackageDetail).length === 0) {
        return null;
    }

    const waMsg = encodeURIComponent(`Hello! I want to inquire about this package: ${currentURL}`);
    const waLink = `https://wa.me/+447309803307?text=${waMsg}`;

    const roomPrices = PriceDetail.filter((p) => p.type !== 'without_beds');
    const featuredPrice = getFeaturedRoomPrice(roomPrices);
    const nights = Math.max(
        moment(PackageDetail?.end_date).diff(moment(PackageDetail?.start_date), 'days'),
        0
    );
    const days = nights + 1;
    const starCount = Math.floor(Number(PackageDetail?.star_rating) || 0);
    const heroBg =
        PackageDetail?.featured_image ||
        PackageDetail?.gallery_images?.[0] ||
        '/images/home/makkah.jpg';
    const galleryImages = PackageDetail?.gallery_images || [];
    const includedItemsHtml = stripEmptyListItems(PackageDetail?.included_items);
    const excludedItemsHtml = stripEmptyListItems(PackageDetail?.excluded_items);

    return (
        <div className={`package-Detail ${styles.pageWrapper}`}>

            {/* ══ HERO – image overlay + rooms left / price box right ══ */}
            <section
                className={styles.heroSection}
                style={{ backgroundImage: `url(${heroBg})` }}
            >
                <div className={styles.heroOverlay} aria-hidden="true" />

                <div className={`container ${styles.heroInner}`}>
                    <div className={styles.heroGrid}>
                        {/* LEFT — info + room price cards */}
                        <div className={styles.heroLeft}>
                            <nav className={styles.heroCrumb} aria-label="breadcrumb">
                                <Link href="/">Home</Link>
                                <span className={styles.heroCrumbSep}>›</span>
                                <Link href="/umrah-packages">Packages</Link>
                                <span className={styles.heroCrumbSep}>›</span>
                                <span className={styles.heroCrumbCurrent}>
                                    {PackageDetail?.category?.name || 'Detail'}
                                </span>
                            </nav>

                            {PackageDetail?.category?.name && (
                                <div className={styles.heroCatTag}>
                                    <BiCategory size={11} />
                                    {PackageDetail.category.name}
                                </div>
                            )}

                            <h1 className={styles.heroTitle}>{PackageDetail?.title}</h1>

                            <p className={styles.heroLocation}>Makkah &amp; Madinah</p>

                            <div className={styles.heroMeta}>
                                <span className={styles.heroMetaItem}>
                                    <FaCalendarAlt aria-hidden="true" />
                                    {days} Days / {nights} Nights
                                </span>
                                <span className={styles.heroMetaItem}>
                                    <FaUserFriends aria-hidden="true" />
                                    {PackageDetail?.pax
                                        ? `Pax ${PackageDetail.pax}`
                                        : 'Individual & Groups'}
                                </span>
                                {starCount > 0 && (
                                    <span className={styles.heroMetaItem}>
                                        <FaStar className={styles.heroMetaStar} aria-hidden="true" />
                                        {Number(PackageDetail.star_rating).toFixed(1)}
                                        {' '}
                                        ({starCount}★)
                                    </span>
                                )}
                            </div>

                            {roomPrices.length > 0 && (
                                <div className={styles.heroRoomRow}>
                                    {roomPrices.map((item, i) => (
                                        <div key={i} className={styles.heroRoomCard}>
                                            <div className="d-flex align-items-center gap-2 justify-content-between">
                                            <span className={styles.heroRoomType}>{item?.type}</span>
                                            <span className={styles.heroRoomPp}>PP</span>
                                            </div>
                                            <span className={styles.heroRoomPrice}>
                                                <PriceDisplay
                                                    price={item?.sale_per_person}
                                                    currency={PackageDetail?.currency_code}
                                                />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT — glass price box */}
                        <div className={styles.heroRight}>
                            <div className={styles.heroPriceBox}>
                                {featuredPrice && (
                                    <>
                                        <div className={styles.heroPriceMain}>
                                            <PriceDisplay
                                                price={featuredPrice?.sale_per_person}
                                                currency={PackageDetail?.currency_code}
                                            />
                                        </div>
                                        <p className={styles.heroPriceSub}>
                                            Vat and Taxes included <br /> <span>per person</span> 
                                            {/* {featuredPrice?.type
                                                ? ` · ${String(featuredPrice.type)}`
                                                : ''} */}
                                        </p>
                                    </>
                                )}

                                <div className={styles.heroPriceDetails}>
                                    <p className="d-flex align-item-center gap-2 justify-content-between">
                                        <span>Departure:{' '}</span>
                                        
                                        <strong>
                                            {PackageDetail?.start_date
                                                ? moment(PackageDetail.start_date).format('DD MMM YYYY')
                                                : 'Multiple Dates Available'}
                                        </strong>
                                    </p>
                                    <p className="d-flex align-item-center gap-2 justify-content-between">
                                    <span>Availability:{' '}</span>
                                        
                                        <span className={styles.heroAvail}>Limited Seats</span>
                                    </p>
                                </div>

                                

                                <div className={styles.heroPriceActions}>
                                    <div className={styles.heroBookWrap}>
                                        <BookNowButton PackageDetail={PackageDetail} />
                                    </div>
                                    <Link
                                        href=''
                                        target="_blank"
                                        className={styles.heroQuoteBtn}
                                    >
                                        Request Custom Quote
                                    </Link>
                                </div>

                                <hr className="my-4" />

                                <ul className={styles.heroTrustList}>
                                    <li>
                                        <FaShieldAlt aria-hidden="true" />
                                        ATOL Protected
                                    </li>
                                    <li>
                                        <BiPhone aria-hidden="true" />
                                        24/7 Support Available
                                    </li>
                                    <li>
                                        <GiMedal aria-hidden="true" />
                                        Best Price Guarantee
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* <div className={styles.heroFeatureBar}>
                    <div className={styles.heroFeat}><GiPassport size={16} /> Visa Included</div>
                    <div className={styles.heroFeat}><FaPlane size={14} /> Flights Included</div>
                    <div className={styles.heroFeat}><FaHotel size={14} /> Hotels Included</div>
                    <div className={styles.heroFeat}><FaBus size={14} /> Transfers Included</div>
                    <div className={styles.heroFeat}><BsHeadset size={14} /> 24/7 Support</div>
                </div> */}
            </section>

            {/* MAIN CONTENT */}
            <div className="container mt-4">

                {/* Gallery — separate section below hero */}
                {/* {galleryImages.length > 0 && (
                    <div className={styles.gallerySection}>
                        <h5 className={styles.galleryHeading}>Photo Gallery</h5>
                        <div className={styles.galleryWrapper}>
                            <PackageGalleryImages imageList={galleryImages} />
                        </div>
                    </div>
                )} */}

                {/* Package Summary */}


                <div className={`${styles.sectionCard} my-4`}>
                    <h5 className={styles.sectionHeading}>Package Summary</h5>

                    {/* Description */}
                <div className={styles.descriptionBlock}>
                    {(PackageDetail?.description || plainDescription) && (
                        <>
                            {isHtmlDescription && descExpanded ? (
                                <div
                                    className={styles.descriptionContent}
                                    dangerouslySetInnerHTML={{ __html: PackageDetail.description }}
                                />
                            ) : (
                                <p
                                    className={`${styles.descriptionContent}${
                                        shouldClampDescription ? ` ${styles.descriptionClamped}` : ''
                                    }`}
                                >
                                    {isHtmlDescription ? plainDescription : PackageDetail.description}
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
                </div>

                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryLabel}><FaCalendarCheck size={11} /> Departure</div>
                            <div className={styles.summaryValue}>{moment(PackageDetail?.start_date).format('DD MMM YYYY')}</div>
                        </div>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryLabel}><FaCalendarAlt size={11} /> Return</div>
                            <div className={styles.summaryValue}>{moment(PackageDetail?.end_date).format('DD MMM YYYY')}</div>
                        </div>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryLabel}><FaMoon size={11} /> Duration</div>
                            <div className={styles.summaryValue}>
                                {nights} Nights
                            </div>
                        </div>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryLabel}>Rating</div>
                            <div className={`${styles.summaryValue} ${styles.starsWrap}`}>
                                {Array(starCount)
                                    .fill(0)
                                    .map((_, index) => (
                                        <FaStar className="text-warning" key={index} size={15} />
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* TWO-COLUMN LAYOUT */}
                <div className="row g-4">
                    <div className="col-md-8 col-12">

                        {!!PackageDetail?.itineraries?.length &&
                            <PackageDetailIteniry itinrList={PackageDetail?.itineraries || []} />
                        }

                        {/* 1. Accommodation */}
                        <PackageHotelDetail PackageDetail={PackageDetail} />

                        {/* 2. Flights */}
                        {!!PackageDetail?.flights?.length &&
                            <PackageFlightDetail PackageDetail={PackageDetail} />
                        }

                        {/* 3. Ground Transfers */}
                        {!!PackageDetail?.transfers?.length &&
                            <div className={styles.transferSection}>
                                <div className={styles.detailSectionHeader}>
                                    <span className={styles.detailSectionIcon} aria-hidden="true">
                                        <FaBus size={15} />
                                    </span>
                                    <h5 className={styles.detailSectionTitle}>Ground Transfers</h5>
                                </div>
                                <div className={styles.transferList}>
                                    {PackageDetail.transfers.map((item, index) => {
                                        const transferMeta =
                                            [item?.vehicle, formatTripType(item?.trip_type)]
                                                .filter(Boolean)
                                                .join(' · ') || 'Transfer';
                                        const locations = item?.locations || [];

                                        return (
                                            <div key={index} className={styles.transferCard}>
                                                <div className={styles.transferCardHeader}>
                                                    <span className={styles.transferBarIcon} aria-hidden="true">
                                                        <FaBus size={16} />
                                                    </span>
                                                    <div className={styles.transferBarMeta}>
                                                        {transferMeta}
                                                    </div>
                                                </div>

                                                <div className={styles.transferRoutes}>
                                                    {locations.length > 0 ? (
                                                        locations.map((location, locIndex) => (
                                                            <div
                                                                key={`${index}-${locIndex}`}
                                                                className={styles.transferRouteRow}
                                                            >
                                                                <div className={styles.transferBarRoute}>
                                                                    {location?.pickup_address || 'Pickup'}
                                                                    {' → '}
                                                                    {location?.dropoff_address || 'Dropoff'}
                                                                </div>
                                                                {(location?.duration || item?.duration) && (
                                                                    <span className={styles.transferBarDuration}>
                                                                        {location?.duration || item?.duration}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className={styles.transferRouteRow}>
                                                            <div className={styles.transferBarRoute}>
                                                                Transfer details included
                                                            </div>
                                                            {item?.duration && (
                                                                <span className={styles.transferBarDuration}>
                                                                    {item.duration}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        }

                        {/* 4. Visa */}
                        {!!PackageDetail?.visas?.length &&
                            <div className={styles.visaSection}>
                                <div className={styles.detailSectionHeader}>
                                    <span className={styles.detailSectionIcon} aria-hidden="true">
                                        <GiPassport size={16} />
                                    </span>
                                    <h5 className={styles.detailSectionTitle}>Visa Details</h5>
                                </div>
                                <div className={styles.visaList}>
                                    {PackageDetail.visas.map((item, index) => (
                                        <div key={index} className={styles.visaBar}>
                                            <div className={styles.visaBarBody}>
                                                <div className={styles.visaBarTitle}>
                                                    {item?.visa_type || 'Visa Option Included'}
                                                </div>
                                                {item?.visa_description && (
                                                    <div className={styles.visaBarMeta}>
                                                        {item.visa_description}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={styles.visaBarTag}>
                                                {item?.visa_type || 'Included'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        }

                        {/* 5. Included / Excluded */}
                        {(includedItemsHtml || excludedItemsHtml) && (
                        <div className={styles.inclExclSection}>
                            {includedItemsHtml && (
                            <div className={styles.inclExclBlock}>
                                <h5 className={styles.inclExclTitle}>{"What's Included"}</h5>
                                <div className={`${styles.inclExclContent} ${styles.inclContent}`}>
                                    <div dangerouslySetInnerHTML={{ __html: includedItemsHtml }} />
                                </div>
                            </div>
                            )}
                            {excludedItemsHtml && (
                            <div className={styles.inclExclBlock}>
                                <h5 className={styles.inclExclTitle}>{"What's Not Included"}</h5>
                                <div className={`${styles.inclExclContent} ${styles.exclContent}`}>
                                    <div dangerouslySetInnerHTML={{ __html: excludedItemsHtml }} />
                                </div>
                            </div>
                            )}
                        </div>
                        )}
                    </div>

                    <div className={`col-md-4 col-12 ${styles.sidebarCol}`}>
                        <div className={styles.sidebar}>
                            {/* Price Breakdown */}
                            <div className={styles.bookingCard}>
                                <h4 className={styles.bookingCardTitle}>Price Breakdown</h4>

                                {PriceDetail.map((item, index) => (
                                    <div key={index} className={styles.priceRow}>
                                        <span className={styles.priceType}>
                                            {item?.type === 'without_beds' ? 'Without Beds' : item?.type}
                                        </span>
                                        <span className={styles.priceAmount}>
                                            <PriceDisplay
                                                price={item?.sale_per_person}
                                                currency={PackageDetail?.currency_code}
                                            />
                                            <sup>(pp)</sup>
                                        </span>
                                    </div>
                                ))}

                                {/* {featuredPrice && (
                                    <>
                                        <div className={styles.priceDivider} />
                                        <div className={styles.priceTotalRow}>
                                            <span className={styles.priceTotalLabel}>Starting Price</span>
                                            <div className={styles.priceTotalRight}>
                                                <div className={styles.priceTotalValue}>
                                                    <PriceDisplay
                                                        price={featuredPrice?.sale_per_person}
                                                        currency={PackageDetail?.currency_code}
                                                    />
                                                </div>
                                                <span className={styles.priceTotalNote}>per person</span>
                                                <span className={styles.priceTotalNote}>
                                                    Vat and Taxes included
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )} */}

                                {featuredPrice && (
                                    <p className={styles.priceTaxNote}>VAT and taxes included</p>
                                )} 

                                <div className={styles.bookNowWrapper}>
                                    <BookNowButton PackageDetail={PackageDetail} />
                                </div>
                            </div>

                            {PackageDetail?.cancellation_policy && (
                                <div className={`${styles.cancellationCard} ${PackageDetail.cancellation_policy.cancel_policy === 'refundable'
                                        ? styles.cancellationRefundable
                                        : styles.cancellationNonRefundable
                                    }`}>
                                    <div className={styles.cancellationTitle}>
                                        {PackageDetail.cancellation_policy.cancel_policy === 'refundable'
                                            ? <FaCheckCircle size={13} />
                                            : <FaTimes size={12} />
                                        }
                                        Cancellation Policy
                                    </div>
                                    {PackageDetail.cancellation_policy.cancel_policy === 'refundable' &&
                                        !!PackageDetail.cancellation_policy.cancellation_policies?.length && (
                                            <div className={styles.cancellationPolicyList}>
                                                {PackageDetail.cancellation_policy.cancellation_policies.map((policy, i) => (
                                                    <div key={i} className={styles.cancellationPolicyItem}>
                                                        <span className={styles.cancellationPolicyDot} />
                                                        <span>
                                                            If cancelled <strong>{policy.time_duration} hours</strong> before departure, a{' '}
                                                            {policy.type === 'percentage'
                                                                ? <><strong>{policy.value}%</strong> cancellation charge</>
                                                                : <>fixed cancellation charge of <strong><PriceDisplay price={policy.value} currency={PackageDetail?.currency_code} /></strong></>
                                                            }{' '}will apply.
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    {PackageDetail.cancellation_policy.cancel_policy !== 'refundable' && (
                                        <p className={styles.cancellationText}>
                                            This booking is non-refundable. No refund will be issued for cancellations.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Need Help */}
                            <div className={styles.contactCard}>
                                <div className={styles.contactContent}>
                                    <h4 className={styles.contactTitle}>Need Help?</h4>
                                    <p className={styles.contactSubtitle}>
                                        Our travel experts are available 24/7 to assist you with your booking.
                                    </p>
                                    <div className={styles.contactActions}>
                                        <a href="/" className={styles.contactBtnCall}>
                                            <BiPhone size={15} /> Call Us Now
                                        </a>
                                        <a
                                            target="_blank"
                                            // href={waLink}
                                            rel="noreferrer"
                                            className={styles.contactBtnWa}
                                        >
                                            <FaWhatsapp size={15} /> Live Chat
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {!!PackageDetail?.faqs?.length &&
                    <PackageDetailFaqs faqsList={PackageDetail?.faqs || []} />
                }
            </div>
        </div>
    );
}
