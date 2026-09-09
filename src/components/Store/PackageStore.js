"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const usePackageStore = create(
  persist(
    (set, get) => ({
      selectedPackage: {},
    

      // ✅ Set package 
      setSelectedPackage: (data) => set({ selectedPackage: data }),
      // ✅ Clear data if needed
      clearPackageData: () => set({selectedPackage: {} }),
    }),
    {
      name: "package-storage", // storage key name
      getStorage: () => localStorage, // persist in localStorage
    }
  )
);
