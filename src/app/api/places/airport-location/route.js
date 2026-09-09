import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const airportName = searchParams.get('airportName');
    const cityName = searchParams.get('cityName');
    const countryName = searchParams.get('countryName');
    
    if (!airportName || !cityName || !countryName) {
        return NextResponse.json({ 
            error: 'Airport name, city, and country are required' 
        }, { status: 400 });
    }

    try {
        // Step 1: Search for the airport using Text Search API
        const searchQuery = `${airportName} ${cityName} ${countryName}`;
        const searchResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        
        const searchData = await searchResponse.json();
        
        if (searchData.status !== 'OK' || !searchData.candidates || searchData.candidates.length === 0) {
            return NextResponse.json({ 
                error: 'Airport location not found',
                fallback: true 
            }, { status: 404 });
        }

        const placeId = searchData.candidates[0].place_id;

        // Step 2: Get detailed information including lat/lng
        const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry,address_components,name&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        
        const detailsData = await detailsResponse.json();
        
        if (detailsData.status !== 'OK' || !detailsData.result) {
            return NextResponse.json({ 
                error: 'Failed to fetch airport details',
                fallback: true 
            }, { status: 404 });
        }

        const place = detailsData.result;
        
        // Extract location data
        const locationData = {
            lat: place.geometry?.location?.lat || null,
            lng: place.geometry?.location?.lng || null,
            city: cityName,
            country: countryName,
            countryCode: null,
            airportName: airportName,
            formattedAddress: place.formatted_address
        };

        // Extract more precise data from address components
        if (place.address_components) {
            place.address_components.forEach(component => {
                if (component.types.includes('locality')) {
                    locationData.city = component.long_name;
                } else if (component.types.includes('administrative_area_level_1')) {
                    if (!locationData.city) locationData.city = component.long_name;
                }
                if (component.types.includes('country')) {
                    locationData.country = component.long_name;
                    locationData.countryCode = component.short_name;
                }
            });
        }

        return NextResponse.json({
            success: true,
            location: locationData
        });

    } catch (error) {
        console.error('Error fetching airport location:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch airport location details',
            fallback: true 
        }, { status: 500 });
    }
}
