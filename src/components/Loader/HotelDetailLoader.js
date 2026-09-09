import React from 'react';

export default function HotelDetailLoader() {
  return (
    <div className="hotel-detail-layout" aria-hidden="true">
      {/* Title */}
      <div className="hotel-detail-hero-head">
        <span className="hotel-detail-skel hotel-detail-skel--title" />
        <span className="hotel-detail-skel hotel-detail-skel--subtitle" />
      </div>

      {/* Gallery — hero + thumbs */}
      <div className="hotel-detail-gallery">
        <div className="hotel-detail-gallery__hero">
          <span className="hotel-detail-skel hotel-detail-skel--hero" />
        </div>
        <div className="hotel-detail-gallery__thumb-row">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="hotel-detail-skel hotel-detail-skel--thumb"
            />
          ))}
        </div>
      </div>

      {/* About card */}
      <section className="hotel-detail-card">
        <span className="hotel-detail-skel hotel-detail-skel--section-title" />
        <span className="hotel-detail-skel hotel-detail-skel--line" />
        <span className="hotel-detail-skel hotel-detail-skel--line" />
        <span className="hotel-detail-skel hotel-detail-skel--line hotel-detail-skel--line-short" />
      </section>

      {/* Info chips */}
      <div className="hotel-detail-skel-info-row">
        <span className="hotel-detail-skel hotel-detail-skel--info" />
        <span className="hotel-detail-skel hotel-detail-skel--info" />
        <span className="hotel-detail-skel hotel-detail-skel--info" />
      </div>

      {/* Facilities / rooms blocks */}
      <section className="hotel-detail-card">
        <span className="hotel-detail-skel hotel-detail-skel--section-title" />
        <div className="hotel-detail-skel-chip-row">
          <span className="hotel-detail-skel hotel-detail-skel--chip" />
          <span className="hotel-detail-skel hotel-detail-skel--chip" />
          <span className="hotel-detail-skel hotel-detail-skel--chip" />
          <span className="hotel-detail-skel hotel-detail-skel--chip" />
          <span className="hotel-detail-skel hotel-detail-skel--chip" />
        </div>
      </section>

      <section className="hotel-detail-card">
        <span className="hotel-detail-skel hotel-detail-skel--section-title" />
        <span className="hotel-detail-skel hotel-detail-skel--block" />
        <span className="hotel-detail-skel hotel-detail-skel--block" />
      </section>
    </div>
  );
}
