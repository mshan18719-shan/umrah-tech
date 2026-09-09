'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function UmrahGetawayAiSearch({ searchResponse }) {
  const router = useRouter()

  useEffect(() => {
    if (searchResponse) {
      navigateToFlights()
    }
  }, [searchResponse])

  const navigateToFlights = () => {
    const searchList = {
      journey_type: searchResponse.journeyType,
      departure_city: searchResponse.departureCity,
      madinah_nights: searchResponse.madinahNights,
      makkah_nights: searchResponse.makkahNights,
      departure_date: searchResponse.departureDate,
      dateType: searchResponse.dateType,
      flexibleDays: searchResponse.flexibleDays,
      rooms: searchResponse.rooms.map(room => ({
        adults: room.adults,
        children: room?.children ? room?.children.length : 0,
        childrenAges: room?.children ? room?.children.map(child => child.age) : []
      }))
    };
    const queryParams = new URLSearchParams();
    queryParams.set('journey_type', searchResponse.journeyType);
    queryParams.set('madinah_nights', searchResponse.madinahNights);
    queryParams.set('makkah_nights', searchResponse.makkahNights);
    queryParams.set('departure_city', searchResponse.departureCity);
    queryParams.set('departure_date', searchResponse.departureDate);
    if (searchResponse.dateType === 'flexible') {
      queryParams.set('flexibleDays', searchResponse.flexibleDays);
    }
    if(localStorage.getItem('umrah_getaway_search')) {
      localStorage.removeItem('umrah_getaway_search');
    }
    localStorage.setItem('umrah_getaway_search', JSON.stringify(searchList));
    router.push(`/umrah-getaway/search?${queryParams.toString()}`);
  }


  return null;
}
