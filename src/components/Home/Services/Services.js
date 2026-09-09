'use client'
import React from 'react'
import style from './Services.module.css'
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import image1 from '../../../../public/images/home/makkah.jpg'
import image2 from '../../../../public/images/home/madinah.jpg'
import image3 from '../../../../public/images/home/Dubai.png'
import image4 from '../../../../public/images/home/london.jpg'
export default function Services() {
    const router = useRouter();
    
    // Save to recent hotel searches
    const saveToRecentSearches = (locationData) => {
        const currentRecent = JSON.parse(localStorage.getItem('recentHotelSearches') || '[]');
        
        // Remove if already exists (case-insensitive comparison)
        const filtered = currentRecent.filter(item => {
            const isSameName = item.name?.trim().toLowerCase() !== locationData.name?.trim().toLowerCase();
            return isSameName;
        });
        
        // Add to beginning
        const newList = [locationData, ...filtered].slice(0, 5);
        localStorage.setItem('recentHotelSearches', JSON.stringify(newList));
    };
    
    const HotelListing = (cname) => {
        var lat ;
        var lng ;
        var code ;
        var location ;
        var country ;
        var city = '';
        var icon = '📍';
        
        if(cname === 'makkah'){
            lat = 21.4240968;
            lng = 39.81733639999999;
            code = 'SA';
            location = 'Makkah Saudi Arabia';
            country = 'Saudi Arabia';
            city = 'Makkah';
            icon = '🕋';
        }else if(cname === 'madinah'){
            lat = 24.4672132;
            lng = 39.6024496;
            code = 'SA';
            location = 'Madinah Saudi Arabia';
            country = 'Saudi Arabia';
            city = 'Madinah';
            icon = '🕌';
        }else if(cname === 'london'){
            lat = 51.5072178;
            lng = -0.1275862;
            code = 'GB';
            location = 'London';
            country = 'United Kingdom';
            city = 'London';
            icon = '🎡';
        }else if(cname === 'dubai'){
            lat = 25.2048493;
            lng = 55.2707828;
            code = 'AE';
            location = 'Dubai - United Arab Emirates';
            country = 'United Arab Emirates';
            city = 'Dubai';
            icon = '🏙️';
        }
        
        // Save to recent searches
        saveToRecentSearches({
            name: city,
            country: country,
            icon: icon,
            lat: lat,
            lng: lng,
            city: city,
            code: code
        });
        
        const queryParams = new URLSearchParams();

        queryParams.set('checkIn', moment().add(1, "days").format("YYYY-MM-DD"))
        queryParams.set('checkOut', moment().add(2, "days").format("YYYY-MM-DD"))
        queryParams.set('currency', 'GBP')
         queryParams.set('place', location)
        queryParams.set('city', city)
        queryParams.set('lat', lat)
        queryParams.set('lng', lng)
        queryParams.set('code', code)
        queryParams.set('location', location)
        queryParams.set('country', country)
        const roomsArray = [
            {
                "adults": 2,
                "children": []
            }
        ]
        localStorage.setItem('searchRoomSelection', JSON.stringify(roomsArray));
        router.push(`/hotels?${queryParams.toString()}`);
    }
    return (
        <div className={style.serviceswrapper}>
            <div className='container'>
                <p className='text-muted h5 text-center'>Find the best hotels with premium stays</p>
                <h2 className={style.topheading}>Choose Your Next Destination</h2>
                <div className="row">
                    <div className="col-lg-3 mb-3">
                        <div className={style.packageBox} onClick={()=>HotelListing('makkah')}>
                            <Image
                                height={400}
                                width={300}
                                quality={100}
                                src={image1}
                                alt="Package Side"
                                className="object-fit-cover rounded-3"
                            />
                            <div className={style.packageBoxHeading}>
                                <h4 className='mb-0'>Makkah</h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 mb-3">
                        <div className={style.packageBox} onClick={()=>HotelListing('madinah')}>
                            <Image
                                height={400}
                                width={300}
                                quality={100}
                                src={image2}
                                alt="Package Side"
                                className="object-fit-cover rounded-3"
                            />
                            <div className={style.packageBoxHeading}>
                                <h4 className="mb-1">Madinah</h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 mb-3">
                        <div className={style.packageBox} onClick={()=>HotelListing('dubai')}>
                            <Image
                                height={400}
                                width={300}
                                quality={100}
                                src={image3}
                                alt="Package Side"
                                className="object-fit-cover rounded-3"
                            />
                            <div className={style.packageBoxHeading}>
                                <h4 className='mb-0'>Dubai</h4>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 mb-3">
                        <div className={style.packageBox} onClick={()=>HotelListing('london')}>
                            <Image
                                height={400}
                                width={300}
                                quality={100}
                                src={image4}
                                alt="Package Side"
                                className="object-fit-cover rounded-3"
                            />
                            <div className={style.packageBoxHeading}>
                                <h4 className='mb-0'>London</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
