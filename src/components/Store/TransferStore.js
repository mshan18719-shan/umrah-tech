"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTransferStore = create(
  persist(
    (set, get) => ({
      selectedtransfer: {},

      // ✅ Set transfer 
      setSelectedTransfer: (data) => set({ selectedtransfer: data }),

      updateTransferQuantity: (quantity) => {
        const qty = Math.max(1, Math.min(5, Number(quantity) || 1));
        const current = get().selectedtransfer || {};
        if (!current?.id && !current?.searchParams) return;
        set({
          selectedtransfer: {
            ...current,
            quantity: qty,
          },
        });
      },

      // ✅ Clear data if needed
      clearTransferData: () => set({ selectedtransfer: {} }),
    }),
    {
      name: "transfer-storage", // storage key name
      getStorage: () => localStorage, // persist in localStorage
    }
  )
);
