'use client'
import React, { useMemo } from 'react'
import { useFlightList } from '../FlightListingContext'
import PriceDisplay from '@/components/Currency/PriceDisplay';
export default function SortOption() {
    const { allFlights, sort, setSort, setCurrentPage } = useFlightList();

    // Calculate prices for each sort option
    const prices = useMemo(() => {
        if (!allFlights || allFlights.length === 0) {
            return { cheapest: 0, fastest: 0, recommended: 0, mostExpensive: 0 };
        }

        const flightPrices = allFlights.map(f => parseFloat(f.pricing?.total_amount || 0));
        const cheapest = Math.min(...flightPrices);
        const mostExpensive = Math.max(...flightPrices);

        // Find fastest flight
        const flightWithDuration = allFlights.map(flight => ({
            price: parseFloat(flight.pricing?.total_amount || 0),
            duration: flight.segments?.reduce((sum, seg) => sum + seg.duration, 0) || 0
        }));
        
        const fastest = flightWithDuration.sort((a, b) => a.duration - b.duration)[0]?.price || 0;
        const recommended = flightPrices[0] || 0;

        return { cheapest, fastest, recommended, mostExpensive };
    }, [allFlights]);

    const handleSortChange = (sortType) => {
        setSort(sortType);
        setCurrentPage(1);
    };

    const currency = allFlights[0]?.pricing?.currency || 'GBP';

    return (
        <div className='row Flight-sort-filter g-0 mb-3'>
            <div className='col-lg-3 col-md-4 col-sm-6 col-6 p-1'>
                <button 
                    className={sort === 'recommended' ? 'fs-active' : ''}
                    onClick={() => handleSortChange('recommended')}
                >
                    <div className='d-flex w-100 flex-column text-start'>
                        <div className='FS-heading'>Recommended</div>
                        <div className='FS-value'><PriceDisplay price={prices.recommended} currency={currency} /></div>
                    </div>
                </button>
            </div>
            <div className='col-lg-3 col-md-4 col-sm-6 col-6 p-1'>
                <button 
                    className={sort === 'price-asc' ? 'fs-active' : ''}
                    onClick={() => handleSortChange('price-asc')}
                >
                    <div className='d-flex w-100 flex-column text-start'>
                        <div className='FS-heading'>Cheapest</div>
                        <div className='FS-value'><PriceDisplay price={prices.cheapest} currency={currency} /></div>
                    </div>
                </button>
            </div>
            <div className='col-lg-3 col-md-4 col-sm-6 col-6 p-1'>
                <button 
                    className={sort === 'duration-asc' ? 'fs-active' : ''}
                    onClick={() => handleSortChange('duration-asc')}
                >
                    <div className='d-flex w-100 flex-column text-start'>
                        <div className='FS-heading'>Fastest</div>
                        <div className='FS-value'><PriceDisplay price={prices.fastest} currency={currency} /></div>
                    </div>
                </button>
            </div>
            <div className='col-lg-3 col-md-4 col-sm-6 col-6 p-1'>
                <button 
                    className={sort === 'price-desc' ? 'fs-active' : ''}
                    onClick={() => handleSortChange('price-desc')}
                >
                    <div className='d-flex w-100 flex-column text-start'>
                        <div className='FS-heading'>Most Expensive</div>
                        <div className='FS-value'><PriceDisplay price={prices.mostExpensive} currency={currency} /></div>
                    </div>
                </button>
            </div>
        </div>
    )
}
