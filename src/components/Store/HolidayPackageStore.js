"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCurrency } from "@/util/currency";
export const useHolidayPackageStore = create(

  persist(
    (set, get) => ({
      // Package configuration
      isActive: false,
      packageConfig: {
        selectedServices: {
          hotel: false,
          flight: false,
          transfer: false,
        },
        searchData: {},
      },

      // Selected service data
      selectedData: {
        packageInfo: {
          package_id: '',
          currency: '',
          total_price: 0,
          total_travelers: 0,
          total_nights: 0,
          savings: 0,
        },
        hotel: null, // { hotelData, selectedRoom, roomPrice }
        flight: null, // Flight object with price
        transfer: null, // Transfer object with price
      },

      // Package pricing
      packagePricing: {
        hotelPrice: 0,
        hotelCurrency: '',
        flightPrice: 0,
        flightCurrency: '',
        transferPrice: 0,
        transferCurrency: '',
        totalPrice: 0,
      },

      // Service order (fixed priority)
      SERVICE_ORDER: ["hotel", "flight", "transfer"],

      // ============================================
      // INITIALIZATION
      // ============================================
      initializePackage: (services, searchData) =>
        set({
          isActive: true,
          packageConfig: {
            selectedServices: services,
            searchData: searchData,
          },
          selectedData: {
            packageInfo: {
              package_id: '',
              currency: '',
              total_price: 0,
              total_travelers: 0,
              total_nights: 0,
              savings: 0,
            },
            hotel: null,
            flight: null,
            transfer: null,
          },
          packagePricing: {
            hotelPrice: 0,
            hotelCurrency: '',
            flightPrice: 0,
            flightCurrency: '',
            transferPrice: 0,
            transferCurrency: '',
            totalPrice: 0,
          },
        }),

      // ============================================
      // SERVICE FLOW HELPERS
      // ============================================
      getServiceFlow: () => {
        const { packageConfig, SERVICE_ORDER } = get();
        return SERVICE_ORDER.filter(
          (service) => packageConfig.selectedServices[service]
        );
      },

      getNextService: (type) => {
        const flow = get().getServiceFlow();
        const currentIndex = flow.indexOf(type);

        if (currentIndex === -1) {
          // type not in flow (e.g. "packageInfo"), return first service
          return flow.length > 0 ? flow[0] : null;
        }

        // Return the next service after the current one, or null if at end
        return currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null;
      },

      getNextRoute: (type) => {
        const nextService = get().getNextService(type);
        const { packageConfig } = get();
        if (!nextService) {
          return "/holiday-packages/checkout";
        }

        // For hotel, just return the listing page (it reads from store)
        if (nextService === "hotel") {
          return "/holiday-packages/hotels";
        }

        // For flight, build URL with search parameters
        if (nextService === "flight") {
          const flightData = packageConfig.searchData.flight || {};
          const dates = packageConfig.searchData.dates || {};
          const guests = packageConfig.searchData.totalGuests || {};

          const params = new URLSearchParams();
          params.append("packageMode", "true");
          params.append("DepartureCode", flightData.from || "");
          params.append("ArrivalCode", flightData.to || "");
          params.append("DepartureDate", dates.checkIn || "");
          params.append("ReturnDate", dates.checkOut || "");
          params.append("adult", guests.adults || 1);
          params.append("child", guests.children || 0);
          params.append("infant", 0);
          params.append("CabinType", flightData.cabinClass || "Y");
          params.append("AirTripType", "Return");
          return `/flights?${params.toString()}`;
        }

        // For transfer, build URL with search parameters
        debugger
        if (nextService === "transfer") {
          const hotelData = packageConfig.searchData.hotel || {};
          const flightData = packageConfig.searchData.flight || {};
          const dates = packageConfig.searchData.dates || {};
          const guests = packageConfig.searchData.totalGuests || {};

          // Determine pickup location (hotel if available, otherwise departure airport)
          let pickupLat, pickupLng, pickupLocation, pickupCountry;
          let dropoffLat, dropoffLng, dropoffLocation, dropoffCountry;

          if (hotelData.lat && hotelData.lng) {
            // Use hotel location for pickup
            pickupLat = hotelData.lat;
            pickupLng = hotelData.lng;
            pickupLocation = hotelData.location || hotelData.city;
            pickupCountry = hotelData.country;
          } else if (flightData.fromLocation?.lat) {
            // Use departure arrival location for pickup
            pickupLat = flightData.toLocation.lat;
            pickupLng = flightData.toLocation.lng;
            pickupLocation = `${flightData.toLocation.city}`;
            pickupCountry = flightData.toLocation.country;  
          }

          // Use arrival airport for dropoff if available
          // if (flightData.toLocation?.lat) {
          //   dropoffLat = flightData.toLocation.lat;
          //   dropoffLng = flightData.toLocation.lng;
          //   dropoffLocation = flightData.toLocation.city;
          //   dropoffCountry = flightData.toLocation.country;
          // } else if (hotelData.lat && hotelData.lng) {
          //   // Fallback to hotel location
          //   dropoffLat = hotelData.lat;
          //   dropoffLng = hotelData.lng;
          //   dropoffLocation = hotelData.location || hotelData.city;
          //   dropoffCountry = hotelData.country;
          // }

          const params = new URLSearchParams();
          params.append("packageMode", "true");
          params.append("transferType", "all-round");
          params.append("fromLat", pickupLat || "");
          params.append("fromLng", pickupLng || "");
          params.append("pickupLocation", pickupLocation || "");
          params.append("fromCountry", pickupCountry || "");
          // comment start
          // params.append("toLat", dropoffLat || "");
          // params.append("toLng", dropoffLng || "");
          // params.append("dropoffLocation", dropoffLocation || "");
          // params.append("toCountry", dropoffCountry || "");
          // comment end 
          params.append("toLat", "");
          params.append("toLng", "");
          params.append("dropoffLocation", "");
          params.append("toCountry", "");
          params.append("pickupDate", dates.checkOut || "");
          params.append("pickupTime", "00:00:00");
          params.append("passengers", guests.adults + guests.children || 1);

          return `/transfers?${params.toString()}`;
        }

        return "/holiday-packages/checkout";
      },

      // ============================================
      // SET SERVICE DATA
      // ============================================
      setHotelData: (hotelData, selectedRoom) => {
        let total = 0;
        let currencySymbol = '';

        selectedRoom.forEach(selected => {
          const room = hotelData?.rooms.find(r => r.id === selected.roomId);
          if (room) {
            const rate = room.rates.find(rt => rt.rate_key === selected.ratekey);
            if (rate) {
              currencySymbol = rate.currency || currencySymbol;
              total += (Number(rate.price) * selected.qty);
            }
          }
        });
        set((state) => ({
          selectedData: {
            ...state.selectedData,
            hotel: {
              hotelData,
              selectedRoom,
            },
          },
          packagePricing: {
            ...state.packagePricing,
            hotelPrice: total,
            hotelCurrency: currencySymbol,
          },
        }));

        get().calculateTotalPrice();
        return get().getNextRoute('hotel');
      },

      setFlightData: (flightData) => {
        const flightPrice = Number(flightData?.pricing?.total_amount) || 0;
        const flightCurrency = flightData?.pricing?.currency || '';
        set((state) => ({
          selectedData: {
            ...state.selectedData,
            flight: flightData,

          },
          packagePricing: {
            ...state.packagePricing,
            flightPrice,
            flightCurrency,
          },
        }));

        get().calculateTotalPrice();
        return get().getNextRoute('flight');
      },

      setTransferData: (transferData) => {
        const transferPrice = Number(transferData?.fare) || 0;
        const transferCurrency = transferData?.currency || '';

        set((state) => ({
          selectedData: {
            ...state.selectedData,
            transfer: transferData,
          },
          packagePricing: {
            ...state.packagePricing,
            transferPrice,
            transferCurrency,
          },
        }));

        get().calculateTotalPrice();
        return get().getNextRoute('transfer');
      },
      setPackageInfo: (packageInfo) => {
        set((state) => ({
          selectedData: {
            ...state.selectedData,
            packageInfo: {
              package_id: packageInfo.package_id || '',
              currency: packageInfo.currency || '',
              total_price: packageInfo.total_price || 0,
              total_travelers: packageInfo.total_travelers || 0,
              total_nights: packageInfo.total_nights || 0,
              savings: packageInfo.savings || 0,
            },
          },
        }));

        get().calculateTotalPrice();
        return get().getNextRoute('packageInfo');
      },
      // ============================================
      // UPDATE SERVICE (for changes in checkout)
      // ============================================
      updateHotelRoom: (newRoom) => {
        const { selectedData } = get();
        if (!selectedData.hotel) return;
        let total = 0;
        let currencySymbol = '';

        newRoom.forEach(selected => {
          const room = selectedData.hotel?.hotelData?.rooms.find(r => r.id === selected.roomId);
          if (room) {
            const rate = room.rates.find(rt => rt.rate_key === selected.ratekey);
            if (rate) {
              currencySymbol = rate.currency || currencySymbol;
              total += (Number(rate.price) * selected.qty);
            }
          }
        });

        set((state) => ({
          selectedData: {
            ...state.selectedData,
            hotel: {
              ...state.selectedData.hotel,
              selectedRoom: newRoom,
            },
          },
          packagePricing: {
            ...state.packagePricing,
            hotelPrice: total,
            hotelCurrency: currencySymbol,
          },
        }));

        get().calculateTotalPrice();
      },

      updateFlight: (newFlight) => {
        const flightPrice = Number(newFlight?.pricing?.total_amount) || 0;
        const flightCurrency = newFlight?.pricing?.currency || '';

        set((state) => ({
          selectedData: {
            ...state.selectedData,
            flight: newFlight,
          },
          packagePricing: {
            ...state.packagePricing,
            flightPrice,
            flightCurrency,
          },
        }));

        get().calculateTotalPrice();
      },

      updateTransfer: (newTransfer) => {
        const transferPrice = Number(newTransfer?.fare) || 0;
        const transferCurrency = newTransfer?.currency || '';

        set((state) => ({
          selectedData: {
            ...state.selectedData,
            transfer: newTransfer,
          },
          packagePricing: {
            ...state.packagePricing,
            transferPrice,
            transferCurrency,
          },
        }));

        get().calculateTotalPrice();
      },

      // ============================================
      // REMOVE SERVICE (in checkout)
      // ============================================
      removeService: (serviceType) => {
        set((state) => ({
          selectedData: {
            ...state.selectedData,
            [serviceType]: null,
          },
          packagePricing: {
            ...state.packagePricing,
            [`${serviceType}Price`]: 0,
          },
          packageConfig: {
            ...state.packageConfig,
            selectedServices: {
              ...state.packageConfig.selectedServices,
              [serviceType]: false,
            },
          },
        }));

        get().calculateTotalPrice();
      },

      // ============================================
      // PRICE CALCULATION
      // ============================================
      calculateTotalPrice: () => {
        const { packagePricing } = get();
        const total =
          packagePricing.hotelPrice +
          packagePricing.flightPrice +
          packagePricing.transferPrice;

        set((state) => ({
          packagePricing: {
            ...state.packagePricing,
            totalPrice: total,
          },
        }));

        return total;
      },

      // ============================================
      // GETTERS FOR COMPONENTS
      // ============================================
      getPackagePrice: () => {
        return get().packagePricing.totalPrice;
      },

      getSelectedServicePrice: (serviceType) => {
        const { packagePricing } = get();
        return packagePricing[`${serviceType}Price`] || 0;
      },

      isServiceSelected: (serviceType) => {
        return get().packageConfig.selectedServices[serviceType];
      },

      getSelectedService: (serviceType) => {
        return get().selectedData[serviceType];
      },

      // ============================================
      // VALIDATION
      // ============================================
      validatePackage: () => {
        const { packageConfig, selectedData } = get();
        const errors = [];

        // Check if at least 2 services selected
        const selectedCount = Object.values(
          packageConfig.selectedServices
        ).filter(Boolean).length;

        if (selectedCount < 2) {
          errors.push("At least 2 services must be selected");
        }

        // Check if all selected services have data
        Object.entries(packageConfig.selectedServices).forEach(
          ([service, isSelected]) => {
            if (isSelected && !selectedData[service]) {
              errors.push(`${service} must be selected`);
            }
          }
        );

        return {
          isValid: errors.length === 0,
          errors,
        };
      },

      // ============================================
      // RESET
      // ============================================
      clearPackageData: () =>
        set({
          isActive: false,
          packageConfig: {
            selectedServices: {
              hotel: false,
              flight: false,
              transfer: false,
            },
            searchData: {},
          },
          selectedData: {
            packageInfo: {
              package_id: '',
              currency: '',
              total_price: 0,
              total_travelers: 0,
              total_nights: 0,
              savings: 0,
            },
            hotel: null,
            flight: null,
            transfer: null,
          },
          packagePricing: {
            hotelPrice: 0,
            flightPrice: 0,
            transferPrice: 0,
            totalPrice: 0,
          },
        }),
    }),
    {
      name: "holiday-package-storage",
      getStorage: () => localStorage,
    }
  )
);
