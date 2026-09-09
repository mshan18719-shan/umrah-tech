'use client'
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image';
import { Radio, Tooltip } from '@mantine/core';
import { useUmrahPackage } from '@/contexts/UmrahPackageContext';
import { GoPerson } from 'react-icons/go';
import { PiSuitcaseRolling } from 'react-icons/pi';
import { GiGearStickPattern } from 'react-icons/gi';
import { FaCar, FaLocationDot, FaCheck, FaPassport, FaPlane, FaClock } from 'react-icons/fa6';
import CheckoutButton from '@/components/Store/CheckoutButton';
import { IoIosPeople, IoIosPerson } from 'react-icons/io';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import styles from './OtherServices.module.css';
export default function OtherServices() {
    const { packageData, selections, updateOtherServicesSelection } = useUmrahPackage();
    const [selectedTransfer, setSelectedTransfer] = useState('none');
    const [selectedVisa, setSelectedVisa] = useState('none');
    const [totalCount, setTotalCount] = useState(0);
    const [priceType, setPriceType] = useState("total");
    const isInitialized = useRef(false);

    // Initialize selections from context on mount
    useEffect(() => {
        if (selections.otherServices && packageData && !isInitialized.current) {
            const { transfer_selected_id, visa_selected_id } = selections.otherServices;

            if (transfer_selected_id !== undefined) {
                if (transfer_selected_id === null) {
                    setSelectedTransfer('none');
                } else {
                    // Find the array index that matches the backend ID
                    const transferIndex = packageData.transfers?.findIndex(t => t.id === transfer_selected_id);
                    setSelectedTransfer(transferIndex !== -1 ? transferIndex.toString() : 'none');
                }
            }
            if (visa_selected_id !== undefined) {
                if (visa_selected_id === null) {
                    setSelectedVisa('none');
                } else {
                    // Find the array index that matches the backend ID
                    const visaIndex = packageData.visas?.findIndex(v => v.id === visa_selected_id);
                    setSelectedVisa(visaIndex !== -1 ? visaIndex.toString() : 'none');
                }
            }
            isInitialized.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [packageData]);

    // Update context when selections change
    useEffect(() => {
        if (!packageData) return;
        setTotalCount(packageData?.original_request?.adult + packageData?.original_request?.child);

        // Prepare selection object with actual backend IDs
        const transfer_selected_id = selectedTransfer === 'none'
            ? null
            : packageData.transfers[parseInt(selectedTransfer)]?.id;

        const visa_selected_id = selectedVisa === 'none'
            ? null
            : packageData.visas[parseInt(selectedVisa)]?.id;

        // Check if selections have actually changed before updating
        const currentTransferId = selections.otherServices?.transfer_selected_id;
        const currentVisaId = selections.otherServices?.visa_selected_id;

        const hasChanged = currentTransferId !== transfer_selected_id || currentVisaId !== visa_selected_id;

        if (hasChanged) {
            updateOtherServicesSelection({ transfer_selected_id, visa_selected_id });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTransfer, selectedVisa, packageData]);

    const capitalizeFirstLetter = (str) => {
        if (!str || typeof str !== "string") return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const getTransferBadge = (index) => {
        if (index === 0) return 'Most Popular';
        if (index === 1) return 'Best Value';
        return null;
    };

    const formatTripType = (tripType) => {
        if (!tripType) return '';
        return tripType.replace(/_/g, ' ').toUpperCase();
    };

    const formatTransferRoute = (location) => {
        const pickup = location?.pickup_address?.trim();
        const dropoff = location?.dropoff_address?.trim();

        if (pickup && dropoff) return `${pickup} → ${dropoff}`;
        return pickup || dropoff || '';
    };

    const parseVisaDisplay = (visa) => {
        const type = visa?.visa_type || '';
        const subtitleSource = visa?.visa_name || visa?.name || visa?.category || visa?.sub_type;

        if (subtitleSource) {
            return {
                title: capitalizeFirstLetter(type),
                subtitle: subtitleSource.toUpperCase(),
            };
        }

        const parts = type.split(/\s*[-–|]\s*/);
        if (parts.length >= 2) {
            return {
                title: capitalizeFirstLetter(parts[0].trim()),
                subtitle: parts.slice(1).join(' ').trim().toUpperCase(),
            };
        }

        return { title: capitalizeFirstLetter(type), subtitle: null };
    };

    const getVisaBadge = (visa, index) => {
        if (index === 0) return { label: 'Recommended', type: 'recommended' };

        const text = `${visa?.visa_type || ''} ${visa?.description || ''} ${visa?.entry_type || ''}`.toLowerCase();
        if (text.includes('multi')) return { label: 'Multi-Entry', type: 'multi' };

        return null;
    };

    const getVisaStay = (visa) => {
        const days = visa?.duration || visa?.permitted_stay || visa?.stay_days || visa?.validity || visa?.validity_days;
        if (days) return `${days} Days Permitted Stay`;

        const match = visa?.description?.match(/(\d+)\s*days?/i);
        if (match) return `${match[1]} Days Permitted Stay`;

        return null;
    };

    const PriceDisplayTotal = (amount, type) => {
        if (priceType === "total") {
            if (type === "transfer") {
                return amount;
            } else {
                const total = amount * totalCount;
                if (total % 1 !== 0) {
                    return total.toFixed(2);
                }
                return total;
            }
        } else {
            if (type === "transfer") {
                const total = amount / totalCount;
                if (total % 1 !== 0) {
                    return total.toFixed(2);
                }
                return total;
            } else {

                return amount;
            }
        }
    }
    return (
        <div>
            <div className={styles.priceToggleWrap}>
                <div className={styles.priceToggle} role="group" aria-label="Price display type">
                    <button
                        type="button"
                        className={`${styles.priceToggleBtn} ${priceType === 'total' ? styles.priceToggleBtnActive : styles.priceToggleBtnInactive}`}
                        onClick={() => setPriceType('total')}
                        aria-pressed={priceType === 'total'}
                    >
                        <IoIosPeople size={16} />
                        Total Price
                    </button>
                    <button
                        type="button"
                        className={`${styles.priceToggleBtn} ${priceType === 'pp' ? styles.priceToggleBtnActive : styles.priceToggleBtnInactive}`}
                        onClick={() => setPriceType('pp')}
                        aria-pressed={priceType === 'pp'}
                    >
                        <IoIosPerson size={16} />
                        Price Per Person
                    </button>
                </div>
            </div>
            {
                (packageData?.transfers.length !== 0 && packageData.transfers.length !== undefined) && (
                    <Radio.Group value={selectedTransfer} onChange={setSelectedTransfer}>
                        <div className={styles.transferSection}>
                            <div className={styles.transferHeader}>
                                <h3 className={styles.transferTitle}>Private Transfer</h3>
                                <p className={styles.transferDesc}>
                                    Trusted vehicles between airports, hotels and the holy cities clean, comfortable and on time.
                                </p>
                            </div>

                            <Radio.Card
                                value="none"
                                radius="md"
                                className={`${styles.withoutTransferCard} ${selectedTransfer === 'none' ? styles.withoutTransferSelected : ''}`}
                            >
                                <div className={styles.withoutTransferInner}>
                                    <div className={styles.withoutTransferLeft}>
                                        <span className={styles.withoutTransferCheck}>
                                            <FaCheck />
                                        </span>
                                        <div>
                                            <p className={styles.withoutTransferTitle}>No Transfer</p>
                                            <p className={styles.withoutTransferSub}>I&apos;ll arrange my own transportation.</p>
                                        </div>
                                    </div>
                                    <span className={styles.freeBadge}>FREE</span>
                                </div>
                            </Radio.Card>

                            <div className={styles.transferGrid}>
                                {packageData?.transfers.map((transfer, index) => {
                                    const isSelected = selectedTransfer === index.toString();
                                    const badge = getTransferBadge(index);
                                    const firstLocation = transfer?.locations?.[0];
                                    const routeText = formatTransferRoute(firstLocation);

                                    return (
                                        <Radio.Card
                                            key={index}
                                            value={index.toString()}
                                            radius="md"
                                            className={`${styles.transferCard} ${isSelected ? styles.transferCardSelected : ''}`}
                                        >
                                            <div className={styles.cardImageWrap}>
                                                {transfer?.vehicle_image ? (
                                                    <Image
                                                        src={transfer.vehicle_image}
                                                        alt={transfer?.vehicle_details?.name || 'Transfer vehicle'}
                                                        fill
                                                        sizes="(max-width: 575px) 100vw, (max-width: 991px) 50vw, 33vw"
                                                        className={styles.cardImage}
                                                    />
                                                ) : (
                                                    <div className={`${styles.cardImage} d-flex align-items-center justify-content-center`}>
                                                        <FaCar size={48} color="#8aa89c" />
                                                    </div>
                                                )}
                                                <div className={styles.cardImageOverlay} />
                                                <div className={styles.cardImageText}>
                                                    <p className={styles.cardVehicleName}>
                                                        {capitalizeFirstLetter(transfer?.vehicle_details?.name)}
                                                    </p>
                                                    <p className={styles.cardVehicleMeta}>
                                                        {transfer?.vehicle_details?.category?.toUpperCase()} · {formatTripType(transfer?.trip_type)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className={styles.cardBody}>
                                                {routeText && (
                                                    <Tooltip
                                                        label={routeText}
                                                        position="top"
                                                        withArrow
                                                        fz="xs"
                                                        multiline
                                                        maw={320}
                                                    >
                                                        <div className={styles.routeRow}>
                                                            <FaLocationDot className={styles.routeIcon} />
                                                            <span className={styles.routeText}>{routeText}</span>
                                                        </div>
                                                    </Tooltip>
                                                )}
                                                <Tooltip
                                                    label={transfer?.vehicle_details?.vehicle_description}
                                                    position="top"
                                                    withArrow
                                                    fz="xs"
                                                    multiline
                                                    maw={320}
                                                >
                                                    <p className={styles.cardDescription}>
                                                        {transfer?.vehicle_details?.vehicle_description}
                                                    </p>
                                                </Tooltip>

                                                <div className={styles.featureTags}>
                                                    <span className={styles.featureTag}>
                                                        <GoPerson />
                                                        1 – {transfer.vehicle_details.passenger_capacity} Pax
                                                    </span>
                                                    <span className={styles.featureTag}>
                                                        <PiSuitcaseRolling />
                                                        {transfer.vehicle_details?.luggage_capacity} Bags
                                                    </span>
                                                    <span className={styles.featureTag}>
                                                        <GiGearStickPattern />
                                                        {transfer.vehicle_details?.transmission_type}
                                                    </span>
                                                </div>

                                                <div className={styles.cardFooter}>
                                                    <div className={styles.priceBlock}>
                                                        <span className={styles.priceLabel}>
                                                            {priceType === 'total' ? 'Total' : 'Per Person'}
                                                        </span>
                                                        <p className={styles.priceValue}>
                                                            <PriceDisplay
                                                                price={PriceDisplayTotal(transfer.fare, 'transfer')}
                                                                currency={packageData?.currency}
                                                            />
                                                        </p>
                                                        <span className={styles.priceNote}>VAT &amp; taxes included</span>
                                                    </div>
                                                    <span className={styles.selectBtn}>
                                                        {isSelected ? 'Selected' : 'Select'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Radio.Card>
                                    );
                                })}
                            </div>
                        </div>
                    </Radio.Group>
                )
            }
            {
                (packageData?.visas.length !== 0 && packageData.visas.length !== undefined) && (
                    <Radio.Group value={selectedVisa} onChange={setSelectedVisa}>
                        <div className={styles.visaSection}>
                            <div className={styles.transferHeader}>
                                <h3 className={styles.transferTitle}>Visa Service</h3>
                                <p className={styles.transferDesc}>
                                    Hassle-free Umrah &amp; tourist visa support pick the option that matches your travel plans.
                                </p>
                            </div>

                            <Radio.Card
                                value="none"
                                radius="md"
                                className={`${styles.withoutTransferCard} ${selectedVisa === 'none' ? styles.withoutTransferSelected : ''}`}
                            >
                                <div className={styles.withoutTransferInner}>
                                    <div className={styles.withoutTransferLeft}>
                                        <span className={styles.withoutTransferCheck}>
                                            <FaCheck />
                                        </span>
                                        <div>
                                            <p className={styles.withoutTransferTitle}>Without Visa</p>
                                            <p className={styles.withoutTransferSub}>I&apos;ll arrange my own visa</p>
                                        </div>
                                    </div>
                                    <span className={styles.freeBadge}>FREE</span>
                                </div>
                            </Radio.Card>

                            <div className={styles.visaGrid}>
                                {packageData?.visas.map((visa, index) => {
                                    const isSelected = selectedVisa === index.toString();
                                    const { title, subtitle } = parseVisaDisplay(visa);
                                    const badge = getVisaBadge(visa, index);
                                    const stayLabel = getVisaStay(visa);

                                    return (
                                        <Radio.Card
                                            key={index}
                                            value={index.toString()}
                                            radius="md"
                                            className={`${styles.visaCard} ${isSelected ? styles.visaCardSelected : ''}`}
                                        >
                                            <span className={styles.visaCardDecor} aria-hidden="true" />
                                            <div className={styles.visaCardContent}>
                                                <div className={styles.visaCardTop}>
                                                    <span className={styles.visaIconCircle}>
                                                        <FaPlane />
                                                    </span>
                                                    <div className={styles.visaTitleWrap}>
                                                        <div className={styles.visaTitleRow}>
                                                            <h4 className={styles.visaTitle}>{title}</h4>

                                                        </div>
                                                        {subtitle && <p className={styles.visaSubtitle}>{subtitle}</p>}
                                                    </div>
                                                </div>
                                                <Tooltip
                                                    label={visa?.description}
                                                    position="top"
                                                    withArrow
                                                    fz="xs"
                                                    multiline
                                                    maw={320}
                                                >
                                                    <p className={styles.visaDescription}>{visa?.description}</p>
                                                </Tooltip>
                                                {stayLabel && (
                                                    <span className={styles.stayBadge}>
                                                        <FaClock />
                                                        {stayLabel}
                                                    </span>
                                                )}

                                                <div className={styles.cardFooter}>
                                                    <div className={styles.priceBlock}>
                                                        <span className={styles.priceLabel}>
                                                            {priceType === 'total' ? 'Total' : 'Per Person'}
                                                        </span>
                                                        <p className={styles.visaPriceValue}>
                                                            <PriceDisplay
                                                                price={PriceDisplayTotal(visa.visa_price, 'visa')}
                                                                currency={packageData?.currency}
                                                            />
                                                        </p>
                                                        <span className={styles.priceNote}>VAT &amp; taxes included</span>
                                                    </div>
                                                    <span className={styles.selectBtn}>
                                                        {isSelected ? 'Selected' : 'Select'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Radio.Card>
                                    );
                                })}
                            </div>
                        </div>
                    </Radio.Group>
                )
            }

            {/* Proceed to Checkout Button */}
            <CheckoutButton />
        </div >
    )
}
