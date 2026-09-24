'use client'
import React, { useState, useEffect } from 'react'
import { Modal, Grid, GridCol } from '@mantine/core';
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import { FaStar } from 'react-icons/fa';
import { IoLocationSharp } from 'react-icons/io5';


export default function GalleryImages({ imageList, type, hotelName, address, stars }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [basicExampleOpen, setBasicExampleOpen] = useState(false);
  const [otherImages, setOtherImages] = useState(true);
  const [modalSize, setModalSize] = useState('70%');

  const starCount = Math.round(Number(stars)) || 0;

  const handlemodalopenclose = () => {
    setModalOpen(!modalOpen)
  };

  useEffect(() => {
    const updateLayout = () => {
      const screenWidth = window.innerWidth;
      const isMobile = screenWidth < 768;
      setModalSize(isMobile ? '96%' : '70%');
      if (type === 'umrah-getaway') {
        setOtherImages(!isMobile);
      } else {
        setOtherImages(true);
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [type]);

  const normalizeImageSrc = (raw) => {
    if (!raw) return '/images/hotelloadimg.jpg';
    // If already a data URL or local path, return as-is
    if (raw.startsWith('data:') || raw.startsWith('/')) return raw;
    // If absolute with protocol, return as-is
    if (/^https?:\/\//i.test(raw)) return raw;
    // If protocol-relative (//example.com/path) prefix with current protocol
    if (raw.startsWith('//')) {
      if (typeof window !== 'undefined') return window.location.protocol + raw;
      return 'https:' + raw;
    }
    // If looks like host/path (e.g. 127.0.0.1/...), prefix with http://
    return 'http://' + raw.replace(/^\/+/, '');
  };
  const openLightboxAt = (index) => {
    setCurrentIndex(index);
    setBasicExampleOpen(true);
  };
  return (
    <div className="hotel-detail-gallery">
      <div className="hotel-detail-gallery__hero">
        <Image
          onClick={() => openLightboxAt(0)}
          height={420}
          unoptimized
          className="hotel-detail-gallery__hero-img"
          alt={hotelName || 'Hotel image'}
          width={1200}
          src={normalizeImageSrc(imageList[0]?.url)}
          onError={e => { e.currentTarget.src = '/images/hotelloadimg.jpg'; }}
        />
        <div className="hotel-detail-gallery__overlay" />
        <div className="hotel-detail-gallery__content">
          {starCount > 0 && (
            <div className="hotel-detail-gallery__stars" aria-label={`${starCount} star hotel`}>
              {Array.from({ length: starCount }).map((_, idx) => (
                <FaStar key={idx} />
              ))}
              <span>{starCount} Star{starCount > 1 ? 's' : ''}</span>
            </div>
          )}
          <h2 className="hotel-detail-gallery__name">{hotelName || 'Hotel'}</h2>
          {address && (
            <p className="hotel-detail-gallery__address">
              <IoLocationSharp />
              <span>{address}</span>
            </p>
          )}
        </div>
        <button onClick={handlemodalopenclose} className="hotel-detail-gallery__all-btn">See All Photos</button>
      </div>

      {otherImages && (
        <div className="hotel-detail-gallery__thumb-row">
          {imageList.slice(1, 5).map((ListItem, index) => (
            <button
              key={index}
              type="button"
              onClick={() => openLightboxAt(index + 1)}
              className="hotel-detail-gallery__thumb-btn"
            >
              <Image
                unoptimized
                height={170}
                width={360}
                alt={`Hotel image ${index + 2}`}
                className="hotel-detail-gallery__thumb-img"
                src={normalizeImageSrc(ListItem?.url)}
                onError={e => { e.currentTarget.src = '/images/hotelloadimg.jpg'; }}
              />
            </button>
          ))}
        </div>
      )}
      <Modal
        lockScroll
        trapFocus
        centered
        withinPortal
        zIndex={12000}
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        opened={modalOpen}
        onClose={handlemodalopenclose}
        size={modalSize}
        title="Hotel Images"
        classNames={{
          content: 'hotel-images-modal',
          body: 'hotel-images-modal-body',
        }}
      >
        <Grid className="hotel-images-modal-grid" grow gutter="xs">
          <GridCol span={{ base: 12, md: 12, lg: 8 }}>
            <Grid grow gutter="xs">
              {imageList.map((image, index) => {
                let spanValue;
                if (index === 0) {
                  spanValue = { base: 12, md: 6 };
                } else if (index === 1 || index === 2) {
                  spanValue = { base: 6, md: 3 };
                } else {
                  spanValue = { base: 6, md: 4 };
                }

                return (
                  <GridCol key={index} span={spanValue}>
                    <Image
                      height='200'
                      width="300"
                      unoptimized
                      onClick={() => openLightboxAt(index)}
                      className="w-100 object-fit-cover rounded"
                      src={normalizeImageSrc(image?.url)}
                      alt={`Hotel image ${index + 1}`}
                      onError={e => { e.currentTarget.src = '/images/hotelloadimg.jpg'; }}
                    />
                  </GridCol>
                );
              })}

            </Grid>
          </GridCol>
        </Grid>
      </Modal>
      <Lightbox
        open={basicExampleOpen}
        close={() => setBasicExampleOpen(false)}
        slides={imageList.map((img) => ({ src: normalizeImageSrc(img?.url) }))}
        index={currentIndex}
        styles={{ root: { zIndex: 13000 } }}
      />
    </div>
  )
}
