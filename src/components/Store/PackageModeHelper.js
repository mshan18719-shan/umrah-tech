"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useHolidayPackageStore } from "./HolidayPackageStore";
import { notifications } from "@mantine/notifications";
/**
 * Hook to handle package mode in existing listing pages
 * Non-invasive - easily add to any existing page
 */
export function usePackageMode() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    isActive,
    isServiceSelected,
    setHotelData,
    setFlightData,
    setPackageInfo,
    setTransferData,
    updateHotelRoom,
    updateFlight,
    updateTransfer,
  } = useHolidayPackageStore();

  const isPackageMode = searchParams.get("packageMode") === "true";
  const isEditMode = searchParams.get("edit") === "true";

  useEffect(() => {
    // If package mode but no active package, redirect home
    if (isPackageMode && !isActive) {
      notifications.show({
        title: "No Active Package",
        message: "Please start a new package search",
        color: "orange",
      });
      router.push("/");
    }
  }, [isPackageMode, isActive, router]);

  /**
   * Handle hotel room selection in package mode
   */
  const handleHotelSelection = (hotelData, selectedRoom, message) => {
    if (isEditMode) {
      updateHotelRoom(selectedRoom);
      if (message) {
        notifications.show({
          title: "Room Updated",
          message: "Package updated with new room selection",
          color: "green",
        });
      }
      router.push("/holiday-packages/checkout");
    } else {
      const nextRoute = setHotelData(hotelData, selectedRoom);
      if (message) {
        notifications.show({
          title: "Room Added",
          message: "Proceeding to next service...",
          color: "green",
        });
        router.push(nextRoute);
      }
    }
  };
  /**
     * Handle flight selection in package mode
     */
  const handlePackageData = (data, message) => {
    const nextRoute = setPackageInfo(data);
    // notifications.show({
    //   title: "Flight Added",
    //   message: "Proceeding to next service...",
    //   color: "green",
    // });
    // router.push(nextRoute);
  };
  /**
   * Handle flight selection in package mode
   */
  const handleFlightSelection = (flightData, message) => {
    if (isEditMode) {
      updateFlight(flightData);
      if (message) {
        notifications.show({
          title: "Flight Updated",
          message: "Package updated with new flight",
          color: "green",
        });
      }
      router.push("/holiday-packages/checkout");
    } else {
      const nextRoute = setFlightData(flightData);
      if (message) {
        notifications.show({
          title: "Flight Added",
          message: "Proceeding to next service...",
          color: "green",
        });
        router.push(nextRoute);
      }
    }
  };

  /**
   * Handle transfer selection in package mode
   */
  const handleTransferSelection = (transferData, message) => {
    if (isEditMode) {
      updateTransfer(transferData);
      if (message) {
        notifications.show({
          title: "Transfer Updated",
          message: "Package updated with new transfer",
          color: "green",
        });
      }
      router.push("/holiday-packages/checkout");
    } else {
      const nextRoute = setTransferData(transferData);
      if (message) {
        notifications.show({
          title: "Transfer Added",
          message: "Proceeding to checkout...",
          color: "green",
        });
        router.push(nextRoute);
      }
    }
  };

  return {
    isPackageMode,
    isEditMode,
    isActive,
    handleHotelSelection,
    handleFlightSelection,
    handleTransferSelection,
    handlePackageData,
    isServiceSelected,
  };
}

/**
 * Package Mode Banner Component
 * Shows a banner when user is in package mode
 */
export function PackageModeBanner({ serviceName = "service" }) {
  const { isPackageMode } = usePackageMode();
  const router = useRouter();

  if (!isPackageMode) return null;
  return null
  // return (
  //   <div
  //     style={{
  //       background: "linear-gradient(135deg, #004c4c 0%, #006666 100%)",
  //       color: "white",
  //       padding: "16px 0",
  //       marginBottom: "20px",
  //     }}
  //   >
  //     <div className="container">
  //       <div className="d-flex justify-content-between align-items-center">
  //         <div>
  //           <h5 className="mb-1">
  //             🎉 Building Your Holiday Package
  //           </h5>
  //           <p className="mb-0 small">
  //             Select your {serviceName} to continue building your package
  //           </p>
  //         </div>
  //         <button
  //           className="btn btn-light btn-sm"
  //           onClick={() => router.push("/holiday-packages/checkout")}
  //         >
  //           View Package
  //         </button>
  //       </div>
  //     </div>
  //   </div>
  // );
}
