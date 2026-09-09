'use client'
import React, { useState } from 'react'
import { Modal, Grid, GridCol } from '@mantine/core';
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";

export default function PackageGalleryImages({ imageList = [] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [basicExampleOpen, setBasicExampleOpen] = useState(false);

  if (!imageList.length) return null;

  const handlemodalopenclose = () => {
    setModalOpen(!modalOpen)
  };
  const openLightboxAt = (index) => {
    setCurrentIndex(index);
    setBasicExampleOpen(true);
  };

  const thumbs = imageList.slice(0, 3);

  return (
    <div>
      <Grid grow gutter="xs">
        <GridCol span={{ base: 12, md: 12, lg: 12 }} className="position-relative">
          <Image
            onClick={() => openLightboxAt(0)}
            height={310}
            className="w-100 object-fit-cover rounded"
            alt="Package gallery"
            width={400}
            src={imageList[0]}
            style={{ cursor: 'pointer' }}
          />
          <button
            type="button"
            onClick={handlemodalopenclose}
            className="btn btn-light text-success position-absolute bottom-0 start-0 m-2 fw-bold"
          >
            See All Photos
          </button>
        </GridCol>
        {thumbs.length > 0 && (
          <GridCol span={{ base: 12, md: 12, lg: 12 }}>
            <Grid grow gutter="xs">
              {thumbs.map((ListItem, index) => (
                <GridCol key={index} span={{ base: 4, md: 4, lg: 4 }}>
                  <Image
                    onClick={() => openLightboxAt(index)}
                    height={150}
                    width={200}
                    alt={`Package image ${index + 1}`}
                    className="w-100 object-fit-cover rounded"
                    src={ListItem}
                    style={{ cursor: 'pointer' }}
                  />
                </GridCol>
              ))}
            </Grid>
          </GridCol>
        )}
      </Grid>
      <Lightbox
        open={basicExampleOpen}
        close={() => setBasicExampleOpen(false)}
        slides={imageList.map((img) => ({ src: img }))}
        index={currentIndex}
      />
      <Modal
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        opened={modalOpen}
        onClose={handlemodalopenclose}
        size="auto"
        title="Images"
      >
        <Grid grow gutter="xs">
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
                      height={200}
                      width={300}
                      onClick={() => openLightboxAt(index)}
                      className="w-100 object-fit-cover rounded"
                      src={image}
                      quality={100}
                      alt={`Package image ${index + 1}`}
                      style={{ cursor: 'pointer' }}
                    />
                  </GridCol>
                );
              })}
            </Grid>
          </GridCol>
        </Grid>
      </Modal>
    </div>
  )
}
