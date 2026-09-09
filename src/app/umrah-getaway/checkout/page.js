"use client";

import React, { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import styles from "@/components/UmrahGetAway/Checkout/Checkout.module.css";

import { FaLocationDot, FaArrowLeft } from "react-icons/fa6";
import { FaMoon, FaPlaneDeparture } from "react-icons/fa";
import { HiUsers } from "react-icons/hi";

import FlightDetail from "@/components/UmrahGetAway/Checkout/FlightDetail";

import HotelDetail from "@/components/UmrahGetAway/Checkout/HotelDetail";

import Transfer from "@/components/UmrahGetAway/Checkout/Transfer";

import VisaDetail from "@/components/UmrahGetAway/Checkout/VisaDetail";

import SummaryDetail from "@/components/UmrahGetAway/Checkout/SummaryDetail";

import CheckoutSkeleton from "@/components/UmrahGetAway/Checkout/CheckoutSkeleton";

import CheckoutForm from "@/components/UmrahGetAway/Checkout/CheckoutForm";

import { notifications } from "@mantine/notifications";

import { useRouter } from "next/navigation";

export default function page() {
  const [packageDetails, setPackageDetails] = useState(null);

  const [selectedTransfer, setSelectedTransfer] = useState([]);

  const [selectedVisa, setSelectedVisa] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [visibility, setVisibility] = useState("Detail");

  const router = useRouter();

  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchPackageDetails = async () => {
      const packageId = searchParams.get("packageId");

      try {
        setLoading(true);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/customized/packages/details`,
          {
            method: "POST",

            cache: "no-store",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({ package_id: packageId }),
          },
        );

        const data = await response.json();

        if (data.Success) {
          if (data?.Content?.transfer_selected_id !== null) {
            const selectedTransfers = data?.Content?.transfers?.filter(
              (transfer) =>
                Number(data?.Content?.transfer_selected_id) === transfer.id,
            );

            setSelectedTransfer(selectedTransfers);
          }

          if (data?.Content?.visa_selected_id !== null) {
            const selectedVisas = data?.Content?.visas?.filter(
              (visa) => Number(data?.Content?.visa_selected_id) === visa.id,
            );

            setSelectedVisa(selectedVisas);
          }

          const packageContent = data?.Content;
          const cachedRoomDetails = sessionStorage.getItem(
            `umrah_checkout_${packageId}`,
          );

          if (cachedRoomDetails && packageContent) {
            try {
              const roomDetails = JSON.parse(cachedRoomDetails);

              if (packageContent.makkah_hotel) {
                packageContent.makkah_hotel.selected_room_name =
                  packageContent.makkah_hotel.selected_room_name ||
                  roomDetails.makkah?.roomName ||
                  "";
                packageContent.makkah_hotel.selected_board_name =
                  packageContent.makkah_hotel.selected_board_name ||
                  roomDetails.makkah?.boardName ||
                  "";
              }

              if (packageContent.madinah_hotel) {
                packageContent.madinah_hotel.selected_room_name =
                  packageContent.madinah_hotel.selected_room_name ||
                  roomDetails.madinah?.roomName ||
                  "";
                packageContent.madinah_hotel.selected_board_name =
                  packageContent.madinah_hotel.selected_board_name ||
                  roomDetails.madinah?.boardName ||
                  "";
              }
            } catch (parseError) {
              console.error("Error parsing cached room details:", parseError);
            }
          }

          setPackageDetails(packageContent);
        } else {
          notifications.show({
            title: data.Title,

            message: data.Description,

            color: "red",
          });

          router.push("/");
        }
      } catch (err) {
        setError(err.message);

        console.error("Error fetching package details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackageDetails();
  }, []);

  if (loading) {
    return <CheckoutSkeleton />;
  }

  const handleShowForm = () => {
    setVisibility("Form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShowDetail = () => {
    setVisibility("Detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className={`${styles.checkoutPage} p-4`}>
        <div className="container">
          <div className="alert alert-danger" role="alert">
            Error loading package details: {error}
          </div>
        </div>
      </div>
    );
  }

  const totalNights =
    Number(packageDetails?.original_request?.madinahNights) +
    Number(packageDetails?.original_request?.makkahNights);
  const adultCount = Number(packageDetails?.original_request?.adult || 0);
  const childCount = Number(packageDetails?.original_request?.child || 0);

  const travellersLabel = [
    `${adultCount} Adult${adultCount !== 1 ? "s" : ""}`,
    childCount > 0
      ? `${childCount} Child${childCount !== 1 ? "ren" : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  const tripMetaItems = [
    {
      icon: FaLocationDot,
      label: "Journey",
      value:
        packageDetails?.original_request?.journeyType === "makkahFirst"
          ? "Makkah First"
          : "Madinah First",
    },
    {
      icon: FaPlaneDeparture,
      label: "Departure",
      value: packageDetails?.original_request?.departureCity,
    },
    {
      icon: FaMoon,
      label: "Duration",
      value: `${totalNights} Night${totalNights !== 1 ? "s" : ""}`,
    },
    {
      icon: HiUsers,
      label: "Travellers",
      value: travellersLabel,
    },
  ];

  return (
    <div className={styles.checkoutPage}>
      <div className={`container ${styles.checkoutContainer}`}>
        <div className={styles.checkoutPageHeader}>
          {visibility !== "Detail" && (
            <button
              type="button"
              onClick={handleShowDetail}
              className={styles.backBtn}
            >
              <FaArrowLeft />
              Back to booking details
            </button>
          )}

          <h1 className={styles.checkoutPageTitle}>
            {visibility === "Detail"
              ? "Review Your Booking"
              : "Passenger Details"}
          </h1>

          <p className={styles.checkoutPageSub}>
            {visibility === "Detail"
              ? "Confirm your package details before proceeding to passenger information."
              : "Kindly ensure that traveler details are entered exactly as shown on official travel documents."}
          </p>
        </div>

        <div className="row py-4 g-4">
          <div className="col-12 col-md-8 order-2 order-md-1">
            <div className={styles.checkoutMainCol}>
              {visibility !== "Detail" ? (
                <CheckoutForm packageData={packageDetails} />
              ) : (
                <>
                  <div className={styles.tripMetaBar}>
                    <div className={styles.tripMetaGrid}>
                      {tripMetaItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className={styles.tripMetaItem}>
                            <span className={styles.tripMetaIconBox}>
                              <Icon />
                            </span>
                            <div className={styles.tripMetaContent}>
                              <p className={styles.tripMetaLabel}>
                                {item.label}
                              </p>
                              <p className={styles.tripMetaValue}>
                                {item.value}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {packageDetails?.flight && (
                    <FlightDetail FlightData={packageDetails?.flight} />
                  )}

                  {packageDetails?.makkah_hotel && (
                    <HotelDetail HotelData={packageDetails?.makkah_hotel} />
                  )}

                  {packageDetails?.madinah_hotel && (
                    <HotelDetail HotelData={packageDetails?.madinah_hotel} />
                  )}

                  {selectedTransfer.length > 0 && (
                    <Transfer TransferData={selectedTransfer} />
                  )}

                  {selectedVisa.length > 0 && (
                    <VisaDetail VisaDetail={selectedVisa} />
                  )}

                  <div className={styles.checkoutActions}>
                    <button
                      onClick={handleShowForm}
                      className={styles.confirmBtn}
                    >
                      Confirm &amp; Continue
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="col-12 col-md-4 order-1 order-md-2">
            <div className={styles.checkoutSidebar}>
              <SummaryDetail
                PricingDetail={packageDetails?.pricing}
                packageDetails={packageDetails}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
