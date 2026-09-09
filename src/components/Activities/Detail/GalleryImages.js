'use client'
import React, { useState } from 'react'
import { Modal, Grid, GridCol } from '@mantine/core';
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import styles from './GalleryImages.module.css';

export default function GalleryImages({ imageList }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [basicExampleOpen, setBasicExampleOpen] = useState(false);

  if (!imageList?.length) return null;

  const thumbnailImages = imageList.slice(1, 5);

  const handlemodalopenclose = () => {
    setModalOpen(!modalOpen)
  };

  const openLightboxAt = (index) => {
    setCurrentIndex(index);
    setBasicExampleOpen(true);
  };

  return (
    <div className={styles.gallery}>
      <div className={styles.heroWrap}>
        <div className={styles.heroImageWrap} onClick={() => openLightboxAt(0)}>
          <Image
            fill
            priority
            className={styles.heroImage}
            alt="Activity image"
            src={imageList[0]}
            sizes="(max-width: 768px) 100vw, 66vw"
          />
        </div>
        <button
          onClick={handlemodalopenclose}
          type="button"
          className={`btn btn-light text-success fw-bold ${styles.seeAllBtn}`}
        >
          See All Photos
        </button>
      </div>

      {thumbnailImages.length > 0 && (
        <div className={styles.thumbRow}>
          {thumbnailImages.map((image, index) => (
            <div
              key={index}
              className={styles.thumbItem}
              onClick={() => openLightboxAt(index + 1)}
            >
              <Image
                fill
                className={styles.thumbImage}
                alt={`Activity image ${index + 2}`}
                src={image}
                sizes="(max-width: 768px) 25vw, 16vw"
              />
            </div>
          ))}
        </div>
      )}

      <Modal overlayProps={{ backgroundOpacity: 0.55, blur: 3, }} opened={modalOpen} onClose={handlemodalopenclose} size='auto' title="Activity Images">
        <Grid className='p-3' grow gutter="xs">
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
                      onClick={() => openLightboxAt(index)}
                      className="w-100 object-fit-cover rounded"
                      src={image}
                      alt={`Activity image ${index + 1}`}
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
        slides={imageList.map((img) => ({ src: img }))}
        index={currentIndex}
      />
    </div>
  )
}
