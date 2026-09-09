'use client';
import { useEffect, useState } from 'react';
import moment from 'moment';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Playfair } from 'next/font/google';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { GiGearStickPattern } from 'react-icons/gi';
import { GoPerson } from 'react-icons/go';
import { PiSuitcaseRolling } from 'react-icons/pi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css/pagination';
import styles from './TopTransfers.module.css';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import VehicleDetail from '@/components/Transfer/Listing/VehicleDetail';
import { useTransferStore } from '@/components/Store/TransferStore';
const playfair = Playfair({
  subsets: ['latin'],
  weight: ['600', '700'],
});

const SEARCH_PAYLOAD = {
  dropoffLocation: 'Madinah',
  fromCountry: 'Saudi Arabia',
  fromLat: '21.4240968',
  fromLng: '39.81733639999999',
  passengers: '1',
  pickupLocation: 'Makkah',
  pickupTime: '00:00:00',
  toLat: '24.4672132',
  toLng: '39.6024496',
  transferType: 'one-way',
};

function TransferCardSkeleton() {
  return (
    <article className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
      <div className={styles.cardHeader}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonCategory}`} />
      </div>
      <div className={`${styles.imageWrap} ${styles.skeletonImage}`} />
      <div className={styles.features}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonBadge}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonBadge}`} />
        <div className={`${styles.skeletonBlock} ${styles.skeletonBadge}`} />
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.priceBlock}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonPrice}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonTax}`} />
        </div>
        <div className={`${styles.skeletonBlock} ${styles.skeletonBtn}`} />
      </div>
    </article>
  );
}

function TransferCard({ transfer, onViewDetail }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.vehicleName}>{transfer.vehicle_details.name}</h3>
        <p className={styles.vehicleCategory}>{transfer.vehicle_details.category}</p>
      </div>

      <div
        className={styles.imageWrap}
        onClick={() => onViewDetail(transfer)}
        onKeyDown={(e) => e.key === 'Enter' && onViewDetail(transfer)}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${transfer.vehicle_details.name}`}
      >
        <Image
          src={transfer.vehicle_image}
          alt={transfer.vehicle_details.name}
          fill
          className={styles.cardImage}
          sizes="(max-width: 767px) 90vw, (max-width: 991px) 50vw, 33vw"
        />
      </div>

      <div className={styles.features}>
        <span className={styles.featureBadge}>
          <GoPerson className={styles.featureIcon} aria-hidden="true" />
          {transfer.vehicle_details?.passenger_capacity} Pax
        </span>
        <span className={styles.featureBadge}>
          <PiSuitcaseRolling className={styles.featureIcon} aria-hidden="true" />
          {transfer.vehicle_details?.luggage_capacity} Luggage
        </span>
        <span className={styles.featureBadge}>
          <GiGearStickPattern className={styles.featureIcon} aria-hidden="true" />
          {transfer.vehicle_details?.transmission_type}
        </span>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.priceBlock}>
          <div className={styles.priceRow}>
            <span className={styles.priceValue}>
              <PriceDisplay price={transfer.fare} currency={transfer.currency} />{' '}
              <span style={{ fontSize: '12px' }}>Total</span>
            </span>
          </div>
          <span className={styles.taxNote}>Vat and Taxes included</span>
        </div>

        <button
          type="button"
          onClick={() => onViewDetail(transfer)}
          className={styles.viewBtn}
        >
          View Detail
          <FaArrowRight className={styles.viewBtnIcon} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default function TopTransfers() {
  const router = useRouter();
  const { setSelectedTransfer } = useTransferStore();
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleQuantity, setVehicleQuantity] = useState(1);


  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transfers/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...SEARCH_PAYLOAD,
            pickupDate: moment().add(1, 'days').format('YYYY-MM-DD'),
          }),
        });

        const result = await response.json();
        const apiTransfers = result?.data?.transfers;

        if (response.ok && result?.success && Array.isArray(apiTransfers)) {
          setTransfers(apiTransfers);
        } else {
          setHasError(true);
        }
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransfers();
  }, []);

  if (!isLoading && (hasError || !transfers.length)) return null;

  const handleViewDetail = (transfer) => {
    setSelectedVehicle(transfer);
    setVehicleQuantity(1);
  };

  const handleBooking = (transfer) => {
    if (!transfer) return;

    const searchParams = {
      ...SEARCH_PAYLOAD,
      pickupDate: moment().add(1, 'days').format('YYYY-MM-DD'),
    };

    setSelectedTransfer({
      ...transfer,
      searchParams,
      quantity: vehicleQuantity,
    });
    router.push('/transfers/checkout');
  };
  return (
    <section className={`${styles.section} gray-simple`} aria-label="Top Transfers">
      <div className="container">
        <header className={styles.header}>
          <span className={styles.tag}>Transfer</span>
          <h2 className={`${styles.title} ${playfair.className}`}>
             Premium Transfers for Every Travel Need
          </h2>
          <p className={styles.subtitle}>
          Browse professional transportation services designed around comfort and convenience.
          </p>
        </header>

        {isLoading ? (
          <div className={styles.skeletonGrid} aria-busy="true" aria-label="Loading transfers">
            <TransferCardSkeleton />
            <TransferCardSkeleton />
            <TransferCardSkeleton />
          </div>
        ) : (
          <div className={styles.sliderWrap}>
            <div className={styles.controls}>
              <button
                type="button"
                className={`${styles.navBtn} topTransfers-prev`}
                aria-label="Previous transfers"
              >
                <FaArrowLeft />
              </button>
              <button
                type="button"
                className={`${styles.navBtn} topTransfers-next`}
                aria-label="Next transfers"
              >
                <FaArrowRight />
              </button>
            </div>

            <Swiper
              modules={[Pagination, Navigation]}
              spaceBetween={16}
              slidesPerView={1}
              slidesPerGroup={1}
              watchOverflow
              pagination={{ clickable: true, dynamicBullets: true }}
              navigation={{
                nextEl: '.topTransfers-next',
                prevEl: '.topTransfers-prev',
              }}
              breakpoints={{
                0: {
                  slidesPerView: 1,
                  slidesPerGroup: 1,
                  spaceBetween: 16,
                },
                768: {
                  slidesPerView: 2,
                  slidesPerGroup: 2,
                  spaceBetween: 20,
                },
                992: {
                  slidesPerView: 3,
                  slidesPerGroup: 3,
                  spaceBetween: 24,
                },
              }}
              className={styles.transferSwiper}
            >
              {transfers.map((transfer) => (
                <SwiperSlide key={transfer.id}>
                  <TransferCard transfer={transfer} onViewDetail={handleViewDetail} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
      <VehicleDetail
        showModal={!!selectedVehicle}
        handleCloseModal={() => setSelectedVehicle(null)}
        selectedTransferDetail={selectedVehicle}
        handleBookNow={() => handleBooking(selectedVehicle)}
        vehicleQuantity={vehicleQuantity}
        setVehicleQuantity={setVehicleQuantity}
      />
    </section>
  );
}
