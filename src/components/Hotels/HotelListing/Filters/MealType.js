'use client'
import React from 'react'
import { Checkbox } from '@mantine/core';
import { useHotelList } from '../HotelListingContext';

export default function MealType() {
    const { meal, setMeal } = useHotelList();

    const handleCheckboxChange = (value) => {
        if (meal.includes(value)) {
            setMeal(meal.filter((s) => s !== value));
        } else {
            setMeal([...meal, value]);
        }
    };

    return (
        <div className="hotel-filter-section">
            <p className='hotel-filter-section__label'>Meal Type</p>
            <div className="hotel-filter-checkbox-group">
                <Checkbox checked={meal.includes('room only')} onChange={() => handleCheckboxChange('room only')} className='hotel-filter-checkbox' label="Room Only" />
                <Checkbox checked={meal.includes('breakfast')} onChange={() => handleCheckboxChange('breakfast')} className='hotel-filter-checkbox' label="Breakfast" />
                <Checkbox checked={meal.includes('bed and breakfast')} onChange={() => handleCheckboxChange('bed and breakfast')} className='hotel-filter-checkbox' label="Bed and Breakfast" />
                <Checkbox checked={meal.includes('half board')} onChange={() => handleCheckboxChange('half board')} className='hotel-filter-checkbox' label="Half Board" />
                <Checkbox checked={meal.includes('full board')} onChange={() => handleCheckboxChange('full board')} className='hotel-filter-checkbox' label="Full Board" />
                <Checkbox checked={meal.includes('dinner')} onChange={() => handleCheckboxChange('dinner')} className='hotel-filter-checkbox' label="Dinner" />
            </div>
        </div>
    )
}
