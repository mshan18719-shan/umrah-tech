"use client";
import React, { useEffect, useState } from "react";
import { RangeSlider } from "@mantine/core";
import { useTransferList } from "../TransferListingContext";
import { useCurrency } from "@/util/currency";

export default function PriceRange() {
  const { minPrice, maxPrice, resetPrice, setPriceRange } = useTransferList();
  const { currency } = useCurrency();
  const [selectedValues, setSelectedValues] = useState([minPrice, maxPrice]);

  useEffect(() => {
    setSelectedValues([minPrice, maxPrice]);
  }, [minPrice, maxPrice, resetPrice]);

  const handleChange = (values) => {
    setSelectedValues(values);
  };

  const handleChangeEnd = (values) => {
    setPriceRange(values);
  };

  const formatAmount = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toFixed(2);
  };

  return (
    <div className="hotel-filter-section">
      <p className="hotel-filter-section__label">Your Budget</p>
      {/* <div className="hotel-filter-price-summary">
        <span className="hotel-filter-price-summary__min">
          {currency} {formatAmount(selectedValues[0])}
        </span>
        <span className="hotel-filter-price-summary__max">
          Up to {currency} {formatAmount(selectedValues[1])}
        </span>
      </div> */}
      <RangeSlider
        className="hotel-filter-slider mb-1"
        min={minPrice}
        max={maxPrice}
        color="#1B3B6F"
        value={selectedValues}
        onChange={handleChange}
        onChangeEnd={handleChangeEnd}
        minRange={0.1}
        step={0.01}
        label={null}
      />
      <div className="hotel-filter-price-values">
        <div className="hotel-filter-price-badge">
          Min
          <strong>{currency} {formatAmount(selectedValues[0])}</strong>
        </div>
        <div className="hotel-filter-price-badge">
          Max
          <strong>{currency} {formatAmount(selectedValues[1])}</strong>
        </div>
      </div>
    </div>
  );
}