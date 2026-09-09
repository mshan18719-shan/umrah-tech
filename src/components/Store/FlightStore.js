"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useFlightStore = create(
  persist(
    (set, get) => ({
      selectedFlight: {},
    

      // ✅ Set flight 
      setSelectedFlight: (data) => set({ selectedFlight: data }),
      // ✅ Clear data if needed
      clearFlightData: () => set({selectedFlight: {} }),
    }),
    {
      name: "flight-storage", // storage key name
      getStorage: () => localStorage, // persist in localStorage
    }
  )
);
