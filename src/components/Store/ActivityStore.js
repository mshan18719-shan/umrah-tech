"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useActivityStore = create(
  persist(
    (set, get) => ({
      selectedActivity: {},
    

      // ✅ Set package 
      setSelectedActivity: (data) => set({ selectedActivity: data }),
      // ✅ Clear data if needed
      clearActivityData: () => set({selectedActivity: {} }),
    }),
    {
      name: "activity-storage", // storage key name
      getStorage: () => localStorage, // persist in localStorage
    }
  )
);
