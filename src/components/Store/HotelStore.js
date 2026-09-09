"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useHotelStore = create(
  persist(
    (set, get) => ({
      hotelsSearch: {},
      availabilityData: {},

      // ✅ Set hotels list
      //   setHotelsList: (data) => set({ hotelsList: data }),

      // ✅ Set availability response
      setAvailabilityData: (data) => set({ availabilityData: data }),
      setSearchData: (data) => set({ hotelsSearch: data }),
      // ✅ Clear data if needed
      clearHotelsData: () => set({ hotelsSearch: {}, availabilityData: {} }),
    }),
    {
      name: "hotel-storage", // storage key name
      getStorage: () => localStorage, // persist in localStorage
    }
  )
);
