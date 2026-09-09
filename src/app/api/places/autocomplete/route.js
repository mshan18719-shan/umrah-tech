import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');
    
    if (!input) {
        return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    const types = searchParams.get('types');

    try {
        let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
        if (types) {
            url += `&types=${encodeURIComponent(types)}`;
        }

        const response = await fetch(url);
        
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching autocomplete:', error);
        return NextResponse.json({ error: 'Failed to fetch autocomplete' }, { status: 500 });
    }
}
