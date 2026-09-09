'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { RangeSlider, SegmentedControl, Center } from '@mantine/core'
import { useFilters } from './FilterContext'
import { useCurrency } from '@/util/currency'
import { ConvertPrice } from '@/components/Currency/ConvertPrice'
import { IoIosPeople, IoIosPerson } from 'react-icons/io';
import styles from './UmrahFilter.module.css';

export default function PriceRange() {
    const { priceRange, setPriceRange, minPrice, maxPrice, priceType, setPriceType, currency: baseCurrency } = useFilters();
    const { currency: selectedCurrency, rates } = useCurrency();
    const [sliderRange, setSliderRange] = useState(priceRange);

    const convertToDisplay = useCallback((value) => {
        if (value == null || isNaN(value)) return 0;
        if (!baseCurrency || !selectedCurrency || !rates[baseCurrency] || !rates[selectedCurrency]) {
            return Number(value);
        }
        if (baseCurrency === selectedCurrency) return Number(value);
        const { newprice } = ConvertPrice(value, baseCurrency, selectedCurrency, rates);
        return Math.round(Number(newprice));
    }, [baseCurrency, selectedCurrency, rates]);

    const convertToBase = useCallback((value) => {
        if (value == null || isNaN(value)) return 0;
        if (!baseCurrency || !selectedCurrency || !rates[baseCurrency] || !rates[selectedCurrency]) {
            return Number(value);
        }
        if (baseCurrency === selectedCurrency) return Number(value);
        const { newprice } = ConvertPrice(value, selectedCurrency, baseCurrency, rates);
        return Math.round(Number(newprice));
    }, [baseCurrency, selectedCurrency, rates]);

    const displayMin = Math.floor(convertToDisplay(minPrice));
    const displayMax = Math.ceil(convertToDisplay(maxPrice));

    useEffect(() => {
        setSliderRange([
            convertToDisplay(priceRange[0]),
            convertToDisplay(priceRange[1]),
        ]);
    }, [priceRange, convertToDisplay]);

    const handleSliderChangeEnd = (values) => {
        setPriceRange([convertToBase(values[0]), convertToBase(values[1])]);
    };

    const formatPrice = (value) => {
        const num = Number(value);
        const formatted = num % 1 === 0
            ? num.toLocaleString('en-GB')
            : Number(num).toFixed(2);
        return `${selectedCurrency} ${formatted}`;
    };

    const sectionLabel = priceType === 'pp' ? 'Price Per Person' : 'Total Price';

    return (
        <div className="hotel-filter-section">
            <p className="hotel-filter-section__label">{sectionLabel}</p>

            <SegmentedControl
                fullWidth
                withItemsBorders={false}
                radius="xl"
                className={`${styles.pillControl} ${styles.priceToggle}`}
                value={priceType}
                onChange={setPriceType}
                data={[
                    {
                        label: (
                            <Center style={{ gap: 5 }}>
                                <IoIosPeople size={15} />
                                <span>Total Price</span>
                            </Center>
                        ),
                        value: "total"
                    },
                    {
                        label: (
                            <Center style={{ gap: 5 }}>
                                <IoIosPerson size={15} />
                                <span>Price Per Person</span>
                            </Center>
                        ),
                        value: "pp"
                    },
                ]}
                mb="md"
            />

            <div className="hotel-filter-price-summary">
                <span className="hotel-filter-price-summary__min">
                    {formatPrice(sliderRange[0])}
                </span>
                <span className="hotel-filter-price-summary__max">
                    Up to {formatPrice(sliderRange[1])}
                </span>
            </div>

            <RangeSlider
                className="hotel-filter-slider mb-1"
                value={sliderRange}
                onChange={setSliderRange}
                onChangeEnd={handleSliderChangeEnd}
                pushOnOverlap={false}
                min={displayMin}
                max={displayMax}
                step={1}
                label={null}
                color="#1B3B6F"
            />
        </div>
    )
}
