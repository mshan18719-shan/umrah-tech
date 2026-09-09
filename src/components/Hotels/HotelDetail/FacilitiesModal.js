'use client';
import React from 'react';
import { Modal } from '@mantine/core';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import { IoClose } from 'react-icons/io5';

export default function FacilitiesModal({
  opened,
  onClose,
  title = 'Hotel Facilities',
  subtitle = '',
  facilities = [],
}) {
  const facilityList = facilities.filter(Boolean);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      centered
      size="lg"
      padding={0}
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 2 }}
      classNames={{ content: 'hotel-facilities-modal__content', body: 'hotel-facilities-modal__body' }}
    >
      <div className="hotel-facilities-modal">
        <div className="hotel-facilities-modal__header">
          <div className="hotel-facilities-modal__header-top">
            {/* <h4 className="hotel-facilities-modal__title">{title}</h4> */}
            <h4 className="hotel-facilities-modal__title">Amenities</h4>
            <button
              type="button"
              className="hotel-facilities-modal__close"
              onClick={onClose}
              aria-label="Close"
            >
              <IoClose />
            </button>
          </div>
          {/* {subtitle && <p className="hotel-facilities-modal__subtitle">{subtitle}</p>} */}
          {/* <span className="hotel-facilities-modal__badge">
            {facilityList.length} facilit{facilityList.length === 1 ? 'y' : 'ies'}
          </span> */}
        </div>

        <div className="hotel-facilities-modal__grid">
          {facilityList.map((item, index) => {
            const label = typeof item === 'string' ? item : item?.description?.content || item?.name || '';
            if (!label) return null;
            return (
              <span key={index} className="hotel-facilities-modal__pill">
                <IoMdCheckmarkCircleOutline />
                {label}
              </span>
            );
          })}
        </div>

        {/* <div className="hotel-facilities-modal__footer">
          <button type="button" className="hotel-facilities-modal__cta" onClick={onClose}>
            Understood
          </button>
        </div> */}
      </div>
    </Modal>
  );
}
