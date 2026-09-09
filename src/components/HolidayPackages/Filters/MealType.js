import React from 'react'
import { Checkbox } from '@mantine/core';
import { usePackageList } from '../PackageListingContext';

export default function MealType() {
    const {meal, setMeal} = usePackageList();

    const handleCheckboxChange = (value) => {
        if (meal.includes(value)) {
            setMeal(meal.filter((s) => s !== value));
        } else {
            setMeal([...meal, value]);
        }
    };

    return (
        <div>
            <p className='small fw-bold'>Meal Type</p>
            <div>
                <Checkbox checked={meal.includes('room only')} onChange={() => handleCheckboxChange('room only')} className='mt-2' label="Room Only" />
                <Checkbox checked={meal.includes('breakfast')} onChange={() => handleCheckboxChange('breakfast')} className='mt-2' label="Breakfast" />
                <Checkbox checked={meal.includes('bed and breakfast')} onChange={() => handleCheckboxChange('bed and breakfast')} className='mt-2' label="Bed and Breakfast" />
                <Checkbox checked={meal.includes('half board')} onChange={() => handleCheckboxChange('half board')} className='mt-2' label="Half Board" />
                <Checkbox checked={meal.includes('full board')} onChange={() => handleCheckboxChange('full board')} className='mt-2' label="Full Board" />
                <Checkbox checked={meal.includes('dinner')} onChange={() => handleCheckboxChange('dinner')} className='mt-2' label="Dinner" />
            </div>
        </div>
    )
}
