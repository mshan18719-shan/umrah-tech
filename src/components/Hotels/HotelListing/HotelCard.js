'use client'
import PriceDisplay from '@/components/Currency/PriceDisplay';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react'
import { IoLocationSharp } from 'react-icons/io5';
import { useHotelList } from './HotelListingContext';
import { useSearchParams } from "next/navigation";
import moment from 'moment';
import { FaCheck, FaHome, FaStar } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';

const normalizeImageSrc = (raw) => {
  if (!raw) return '/images/hotelloadimg.jpg';
  if (raw.startsWith('data:') || raw.startsWith('/')) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) {
    if (typeof window !== 'undefined') return window.location.protocol + raw;
    return 'https:' + raw;
  }
  return 'http://' + raw.replace(/^\/+/, '');
};

const encodeProvider = (str) => {
  return [...str].map(c => (c.charCodeAt(0) + 3).toString(36)).join('');
};

const makingSlug = (name) => {
  return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
};

const ProviderShortNames = (encodedProvider) => {
  if (!encodedProvider) return '';
  return encodeProvider(encodedProvider).toLowerCase();
};

/** Same rule as HotelMap: free cancel if any rate has policies whose dates are all still in the future. */
const hasFreeCancellation = (hotel) => {
  if (!hotel?.rooms?.length) return false;
  const now = moment.utc();
  for (const room of hotel.rooms) {
    for (const rate of room?.rates || []) {
      const policies = rate?.cancellation_policies;
      if (!Array.isArray(policies) || policies.length === 0) continue;
      const allDatesInFuture = policies.every(
        (policy) => policy?.from && moment.utc(policy.from).isAfter(now)
      );
      if (allDatesInFuture) return true;
    }
  }
  return false;
};

function HotelCardItem({ item, check_in, check_out, daysDiff, allHotels }) {
  const [imgFallback, setImgFallback] = useState(false);

  const { data: detail } = useQuery({
    queryKey: ['hotelDetail', item.id, item.provider, check_in, check_out],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/hotel/basic/details`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: item.provider,
            hotelId: item.id,
            checkIn: check_in,
            checkOut: check_out,
          }),
        }
      );
      const res = await response.json();
      return {
        images:
          Array.isArray(res.data.main_images) && res.data.main_images.length > 0
            ? res.data.main_images[0].url || ''
            : '',
        address: res.data.address || '',
        facilities: res.data.facilities || [],
      };
    },
    enabled: !!item.id && !!check_in && !!check_out,
    cacheTime: 20 * 60 * 1000,
    staleTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const SetRoomsData = (id) => {
    const selectedHotel = allHotels.find(hotel => hotel.id === id);
    if (selectedHotel) {
      localStorage.setItem('roomSelection', JSON.stringify(selectedHotel.rooms));
      localStorage.setItem('selectedHotelMeta', JSON.stringify({
        id: selectedHotel.id,
        stars: selectedHotel.metadata?.stars ?? null,
      }));
    }
  };

  const starCount = item?.metadata?.stars && !isNaN(item.metadata.stars)
    ? Math.round(Number(item.metadata.stars))
    : 0;

  const facilities = detail?.facilities || [];
  const visibleAmenities = facilities.slice(0, 3);
  const moreAmenities = Math.max(facilities.length - visibleAmenities.length, 0);
  const nightsLabel = daysDiff > 1 ? `${daysDiff} nights` : `${daysDiff || 1} night`;
  const freeCancel = hasFreeCancellation(item);

  return (
    <div className="col-12 col-md-6 mb-3">
      <article className="htc-card">
        <div className="htc-card__layout">
          <div className="htc-card__media">
            <Image
              src={
                imgFallback
                  ? '/images/hotelloadimg.jpg'
                  : normalizeImageSrc(detail?.images || '/images/hotelloadimg.jpg')
              }
              width={420}
              height={280}
              className="htc-card__img"
              alt={item.name}
              quality={100}
              placeholder="blur"
              blurDataURL="/images/hotelloadimg.jpg"
              onError={() => setImgFallback(true)}
              unoptimized={true}
            />
            <div className="htc-card__media-badges">
              {item?.provider === 'custom' && (
                <span className="htc-card__badge htc-card__badge--brand">UT</span>
              )}
              <span className="htc-card__badge htc-card__badge--rooms">
                {item?.rooms.length} {item?.rooms.length > 1 ? 'Rooms Left' : 'Room Left'}
              </span>
            </div>
          </div>

          <div className="htc-card__content">
            <div className="htc-card__meta">
              <div className="htc-card__rating">
                {starCount > 0 ? (
                  <>
                    {Array(starCount).fill(0).map((_, i) => (
                      <FaStar key={i} className="htc-card__star" />
                    ))}
                  </>
                ) : item?.metadata?.stars ? (
                  <span className="htc-card__rating-label">{item.metadata.stars === '0' ? 'No Rating' : item.metadata.stars}</span>
                ) : (
                  <span className="htc-card__rating-label htc-card__rating-label--muted">No Rating</span>
                )}
              </div>
              <time className="htc-card__dates">
                {moment(check_in).format('DD MMM YYYY')}
                <span aria-hidden="true">-</span>
                {moment(check_out).format('DD MMM YYYY')}
              </time>
            </div>

            <h3 className="htc-card__title">
              <span className="htc-card__title-name">{item.name}</span>
              {item.distanceLabel ? (
                <span className="htc-card__distance">{item.distanceLabel}</span>
              ) : null}
            </h3>

            {detail ? (
              <p className="htc-card__location">
                <IoLocationSharp aria-hidden="true" />
                <span>{detail.address || 'Address not available'}</span>
              </p>
            ) : (
              <p className="htc-card__location placeholder-glow">
                <IoLocationSharp aria-hidden="true" />
                <span className="placeholder rounded col-6"></span>
              </p>
            )}

            {freeCancel && (
              <span className="htc-card__cancel">
                <FaCheck size={10} aria-hidden="true" /> Free Cancellation
              </span>
            )}

            {detail ? (
              <ul className="htc-card__amenities">
                {visibleAmenities.map((amenity, i) => (
                  <li key={i}>{amenity}</li>
                ))}
                {moreAmenities > 0 && (
                  <li className="htc-card__amenities-more">+{moreAmenities} more</li>
                )}
              </ul>
            ) : (
              <ul className="htc-card__amenities placeholder-glow">
                <li className="placeholder rounded col-3"></li>
                <li className="placeholder rounded col-4"></li>
                <li className="placeholder rounded col-2"></li>
              </ul>
            )}

            <div className="htc-card__footer">
              <div className="htc-card__pricing">
                <p className="htc-card__price-night mb-0">
                  <PriceDisplay price={(item.metadata.min_price / (daysDiff || 1))} currency={item?.metadata.currency} />
                  <span className="htc-card__price-unit"> / Night</span>
                </p>
                <div className="htc-card__price-main">
                  {item?.currency} {item?.price}
                </div>
                <p className="htc-card__price-note mb-0">VAT &amp; taxes included</p>
                <p className="htc-card__price-total mb-0">Total for {nightsLabel}</p>
              </div>

              <Link
                target="_blank"
                onClick={() => SetRoomsData(item.id)}
                href={`/hotels/${makingSlug(item.name)}?id=${item.id}&code=${ProviderShortNames(item.provider)}`}
                className="htc-card__cta"
              >
                Select Hotel
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function HotelCard({ isLoading }) {
  const searchParams = useSearchParams();
  const { hotels, filteredHotels } = useHotelList();
  const check_in = searchParams.get("checkIn");
  const check_out = searchParams.get("checkOut");
  const daysDiff = moment(check_out).diff(moment(check_in), 'days');

  return (
    <div className="hotel-card">
      {hotels.length === 0 && isLoading === false && (
        <div className="alert alert-warning text-center" role="alert">
          <strong>No hotels</strong> found for the selected criteria. Please try adjusting your search.<br />
          <Link href='/'>
            <button className='btn btn-backHome mt-2'><FaHome size={15} /> Go to Home</button>
          </Link>
        </div>
      )}
      <div className="row g-3" id='top_hotel'>
        {hotels.map((item, index) => (
          <HotelCardItem
            key={`${item.provider || 'p'}-${item.id || index}`}
            item={item}
            check_in={check_in}
            check_out={check_out}
            daysDiff={daysDiff}
            allHotels={filteredHotels?.length ? filteredHotels : hotels}
          />
        ))}
      </div>
    </div>
  );
}
