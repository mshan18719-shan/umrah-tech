"use client";

import Image from "next/image";
import React, { useState } from "react";
import { GiGearStickPattern } from "react-icons/gi";
import { GoPerson } from "react-icons/go";
import { PiSuitcaseRolling } from "react-icons/pi";
import { FaCar, FaStar } from "react-icons/fa6";
import { useTransferStore } from "@/components/Store/TransferStore";
import { useRouter } from "next/navigation";
import VehicleDetail from "./VehicleDetail";
import { usePackageMode } from "@/components/Store/PackageModeHelper";
import { useHolidayPackageStore } from "@/components/Store/HolidayPackageStore";
import PriceDisplay from "@/components/Currency/PriceDisplay";
import styles from "./TransferCard.module.css";

const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatTripType = (tripType) => {
  if (!tripType) return "";
  return tripType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatTransmission = (value) => {
  if (!value) return "—";
  const lower = String(value).toLowerCase();
  if (lower.includes("auto")) return "Auto";
  if (lower.includes("manual")) return "Manual";
  return capitalizeFirstLetter(value);
};

export default function TransferCard({ transfers, searchParams }) {
  const { setSelectedTransfer } = useTransferStore();
  const { selectedData } = useHolidayPackageStore();
  const [vehicleQuantity, setVehicleQuantity] = useState(1);
  const router = useRouter();
  const { isPackageMode, isEditMode, handleTransferSelection } =
    usePackageMode();
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  if (
    (!transfers || transfers.length === 0) &&
    !(isPackageMode || isEditMode) &&
    !selectedData?.transfer
  ) {
    return (
      <div className="container">
        <div className="text-center my-5">
          <Image
            src="/images/search-not-found.svg"
            alt="No transfers found"
            className="w-100"
            width={150}
            height={200}
          />
          <h4 className="mt-3">No Transfer Found</h4>
          <p className="text-muted">
            No transfers found matching your criteria. Try adjusting your
            filters.
          </p>
        </div>
      </div>
    );
  }

  const handleBooking = (transfer) => {
    if (!transfer) return;
    transfer.searchParams = searchParams;
    transfer.quantity = vehicleQuantity;
    setSelectedTransfer(transfer);

    if (isPackageMode || isEditMode) {
      handleTransferSelection(transfer, true);
      return;
    }
    router.push("/transfers/checkout");
  };

  const handleViewDetail = (transfer) => {
    setSelectedVehicle(transfer);
    setVehicleQuantity(1);
  };

  const getCardTitle = (item) => {
    const name = capitalizeFirstLetter(item?.vehicle_details?.name);
    const category = item?.vehiclecategory?.name
      ? capitalizeFirstLetter(item.vehiclecategory.name)
      : "";
    const trip = formatTripType(item?.trip_type);
    if (name && category && trip) return `${name} – ${category} (${trip})`;
    if (name && trip) return `${name} (${trip})`;
    return name || "Transfer";
  };

  const getRating = (item) => {
    const rating =
      item?.vehicle_details?.rating ||
      item?.rating ||
      item?.vehicle_details?.stars;
    if (rating == null || rating === "") return null;
    const num = Number(rating);
    return Number.isFinite(num) ? num.toFixed(1) : null;
  };

  const renderTransferCard = (
    item,
    key,
    { isIncluded = false, priceContent } = {},
  ) => {
    const rating = getRating(item);
    const description =
      item?.vehicle_details?.vehicle_description ||
      item?.vehicle_details?.description ||
      "";
    const luggage = item?.vehicle_details?.luggage_capacity;
    const passengers = item?.vehicle_details?.passenger_capacity;
    const transmission = formatTransmission(
      item?.vehicle_details?.transmission_type,
    );

    return (
      <article
        className={`${styles.transferCard} ${isIncluded ? styles.includedCard : ""}`}
        key={key}
      >
        <div
          className={styles.cardImageWrap}
          // onClick={() => handleViewDetail(item)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleViewDetail(item);
          }}
        >
          {item?.vehicle_image ? (
            <Image
              src={item.vehicle_image}
              alt={item?.vehicle_details?.name || "Transfer vehicle"}
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
              quality={100}
              className={styles.cardImage}
            />
          ) : (
            <div className={styles.cardImagePlaceholder}>
              <FaCar />
            </div>
          )}
        </div>

        <div className={styles.cardBody}>
          <div className={styles.titleRow}>
            <h3
              className={styles.cardTitle}
              // onClick={() => handleViewDetail(item)}
            >
              {getCardTitle(item)}
            </h3>
            {rating && (
              <span className={styles.rating}>
                <FaStar className={styles.ratingStar} />
                {rating}
              </span>
            )}
          </div>

          {description ? (
            <p
              className={styles.cardDescription}
              // onClick={() => handleViewDetail(item)}
            >
              {description}
            </p>
          ) : (
            <p className={styles.cardDescriptionMuted}>Private transfer service</p>
          )}

          <div className={styles.featureTags}>
            <span className={styles.featureTag} title="Luggage capacity">
              <PiSuitcaseRolling />
              {luggage ?? "—"}
            </span>
            <span className={styles.featureTag} title="Transmission">
              <GiGearStickPattern />
              {transmission}
            </span>
            <span className={styles.featureTag} title="Passenger capacity">
              <GoPerson />
              {passengers ?? "—"}
            </span>
          </div>

          <div className={styles.cardFooter}>
            <div className={styles.footerActions}>
              <button
                type="button"
                onClick={() => handleBooking(item)}
                className={styles.selectBtn}
              >
                {isPackageMode || isEditMode ? "Select" : "Select"}
              </button>
              <button
                type="button"
                onClick={() => handleViewDetail(item)}
                className={styles.detailsBtn}
              >
                View Details
              </button>
            </div>

            <div className={styles.priceBlock}>
              <span className={styles.priceLabel}>From</span>
              <p className={styles.priceValue}>{priceContent}</p>
              <span className={styles.priceLabel}>VAT and taxes included</span>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <>
      <div className="px-0">
        {(isPackageMode || isEditMode) && selectedData?.transfer && (
          <div className="mb-3">
            <div className={`alert alert-info ${styles.includedAlert}`}>
              <strong>✓ Transfer Included</strong> - You&apos;ve selected a
              different transfer from the available options.
            </div>

            {renderTransferCard(selectedData.transfer, "included-transfer", {
              isIncluded: true,
              priceContent: (
                <PriceDisplay
                  price={selectedData.transfer.price}
                  currency={selectedData.transfer.currency}
                />
              ),
            })}
          </div>
        )}

        <div className={styles.transferGrid}>
          {transfers.map((item, index) =>
            renderTransferCard(item, index, {
              priceContent: (
                <>
                  {item?.convertedCurrency} {item?.convertedPrice}
                </>
              ),
            }),
          )}
        </div>
      </div>

      <VehicleDetail
        showModal={!!selectedVehicle}
        handleCloseModal={() => setSelectedVehicle(null)}
        selectedTransferDetail={selectedVehicle}
        searchParams={searchParams}
        handleBookNow={() => handleBooking(selectedVehicle)}
        isPackageMode={isPackageMode}
        isEditMode={isEditMode}
        setVehicleQuantity={setVehicleQuantity}
        vehicleQuantity={vehicleQuantity}
      />
    </>
  );
}
