import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('place_id');
    const photoRef = searchParams.get('ref');
    const maxwidth = searchParams.get('maxwidth') || '96';
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    try {
        let photoReference = photoRef;

        if (!photoReference && placeId) {
            const detailsResponse = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`
            );
            const details = await detailsResponse.json();
            photoReference = details.result?.photos?.[0]?.photo_reference;
        }

        if (!photoReference) {
            return NextResponse.json({ error: 'No photo available' }, { status: 404 });
        }

        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${photoReference}&key=${apiKey}`;

        return NextResponse.redirect(photoUrl, {
            headers: {
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            },
        });
    } catch (error) {
        console.error('Error fetching place photo:', error);
        return NextResponse.json({ error: 'Failed to fetch place photo' }, { status: 500 });
    }
}
