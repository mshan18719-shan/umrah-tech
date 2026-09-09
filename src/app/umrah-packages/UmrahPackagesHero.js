'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { MdEdit, MdCardTravel } from 'react-icons/md';
import PackageSearch from '@/components/Home/Search/PackageSearch';
import styles from './UmrahHero.module.css';

function formatMobileDate(value) {
  if (!value) return null;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function UmrahPackagesHero({
  title = 'Umrah Packages',
  defaultCategory = 'umrah-packages',
}) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchParams = useSearchParams();
  const dateLabel = useMemo(
    () => formatMobileDate(searchParams.get('date')),
    [searchParams]
  );

  return (
    <>
      {/* Mobile: compact summary + collapsible search */}
      <div className="d-block d-md-none">
        <div className={styles.mobileSearchBar}>
          <div
            className={styles.mobileSearchTrigger}
            onClick={() => setShowMobileSearch((prev) => !prev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowMobileSearch((prev) => !prev)}
          >
            <div className={styles.mobileSearchIcon}>
              <MdCardTravel size={20} />
            </div>
            <div className={styles.mobileSearchInfo}>
              <div className={styles.mobileSearchTitle}>{title}</div>
              <div className={styles.mobileSearchSubtitle}>
                {dateLabel ? `Departure · ${dateLabel}` : 'Tap to search packages'}
              </div>
            </div>
            <button
              type="button"
              className={styles.mobileModifyBtn}
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileSearch((prev) => !prev);
              }}
            >
              <MdEdit size={13} />
              Search
            </button>
          </div>
        </div>

        <div
          className={styles.mobileSearchCollapse}
          style={{ maxHeight: showMobileSearch ? '420px' : '0' }}
        >
          <div className={styles.mobileSearchCollapseInner}>
            <PackageSearch
              variant="listing"
              defaultCategory={defaultCategory}
              initialDate={searchParams.get('date') || ''}
              onSearch={() => setShowMobileSearch(false)}
            />
          </div>
        </div>
      </div>

      {/* Desktop: hero image + overlapping search */}
      <div className={`${styles.heroSection} d-none d-md-block`}>
        <div className={styles.heroImageWrap}>
          <Image
            src="/images/home/makkah.jpg"
            alt={`${title} — Masjid al-Haram, Makkah`}
            fill
            priority
            sizes="100vw"
            className={styles.heroImage}
            quality={75}
          />
          <div className={styles.heroOverlay} aria-hidden="true" />
          <div className={`container ${styles.heroTitleWrap}`}>
            <h1 className={styles.heroTitle}>{title}</h1>
            <p className={styles.heroSubtitle}>with the experience you love</p>
          </div>
        </div>
        <div className={styles.searchPanel}>
          <div className="container">
            <div className={styles.searchCard}>
              <PackageSearch
                variant="listing"
                defaultCategory={defaultCategory}
                initialDate={searchParams.get('date') || ''}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
