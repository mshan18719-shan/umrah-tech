"use client";
import React, { useEffect, useState } from "react";
import { RangeSlider } from "@mantine/core";
import { useHotelList } from "../HotelListingContext";
import { useCurrency } from "@/util/currency";

export default function PriceRange() {
  const { minPrice, maxPrice, resetPrice, setPriceRange } = useHotelList();
  const { currency } = useCurrency();
  const [selectedValues, setSelectedValues] = useState([minPrice, maxPrice]);

  useEffect(() => {
    const min = Number.isFinite(Number(minPrice)) ? Number(minPrice) : 0;
    const max = Number.isFinite(Number(maxPrice)) ? Number(maxPrice) : min;
    setSelectedValues([min, max > min ? max : min]);
  }, [minPrice, maxPrice, resetPrice]);

  const handleChange = (values) => {
    setSelectedValues(values);
    setPriceRange(values);
  };

  const formatAmount = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toFixed(2);
  };

  return (
    <div className="hotel-filter-section">
      <p className="hotel-filter-section__label">Price Per Person</p>
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
        min={Number.isFinite(Number(minPrice)) ? Number(minPrice) : 0}
        max={
          Number.isFinite(Number(maxPrice)) && Number(maxPrice) > Number(minPrice)
            ? Number(maxPrice)
            : Number(minPrice) + 1
        }
        color="#1B3B6F"
        value={selectedValues}
        onChange={handleChange}
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
