import { NextResponse } from 'next/server';

const photoRefCache = new Map();
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function getPhotoUrl(placeId, apiKey) {
    const cached = photoRefCache.get(placeId);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        return cached.url;
    }

    try {
        const detailsResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`,
            { next: { revalidate: 3600 } }
        );
        const details = await detailsResponse.json();
        const photoReference = details.result?.photos?.[0]?.photo_reference;

        if (!photoReference) return null;

        const url = `/api/places/photo?ref=${encodeURIComponent(photoReference)}&maxwidth=96`;
        photoRefCache.set(placeId, { url, time: Date.now() });
        return url;
    } catch {
        return null;
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');
    const types = searchParams.get('types') || '(regions)';

    if (!input || input.length < 2) {
        return NextResponse.json({ status: 'INVALID_REQUEST', predictions: [], photos: {} });
    }

    const cacheKey = `${input.toLowerCase()}::${types}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        return NextResponse.json(cached.data);
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    try {
        const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=${encodeURIComponent(types)}&key=${apiKey}`;
        const autocompleteResponse = await fetch(autocompleteUrl, { cache: 'no-store' });
        const autocompleteData = await autocompleteResponse.json();

        const predictions = (autocompleteData.predictions || []).slice(0, 5);
        const photos = {};

        await Promise.allSettled(
            predictions.slice(0, 4).map(async (prediction) => {
                const photoUrl = await getPhotoUrl(prediction.place_id, apiKey);
                if (photoUrl) {
                    photos[prediction.place_id] = photoUrl;
                }
            })
        );

        const payload = {
            status: autocompleteData.status,
            predictions,
            photos,
        };

        searchCache.set(cacheKey, { data: payload, time: Date.now() });

        return NextResponse.json(payload);
    } catch (error) {
        console.error('Error fetching activity autocomplete:', error);
        return NextResponse.json({ error: 'Failed to fetch autocomplete' }, { status: 500 });
    }
}
