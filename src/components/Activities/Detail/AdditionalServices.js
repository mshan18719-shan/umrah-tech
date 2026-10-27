'use client'
import React from 'react'
import PriceDisplay from '@/components/Currency/PriceDisplay'
import styles from './AdditionalServices.module.css'

export default function AdditionalServices({
  Services,
  currency,
  selectedServices,
  setSelectedServices,
  setServicesTotal,
}) {
  const handleServiceToggle = (service) => {
    const isSelected = selectedServices.find((s) => s.name === service.name)
    if (isSelected) {
      const updatedServices = selectedServices.filter((s) => s.name !== service.name)
      const Total = updatedServices.reduce((acc, curr) => acc + Number(curr.total), 0)
      setServicesTotal?.(Total)
      setSelectedServices(updatedServices)
    } else {
      const newService = {
        name: service.name,
        type: service.type,
        price: service.price,
        quantity: 1,
        total: Number(service.price),
      }
      const updatedServices = [...selectedServices, newService]
      const Total = updatedServices.reduce((acc, curr) => acc + Number(curr.total), 0)
      setServicesTotal?.(Total)
      setSelectedServices(updatedServices)
    }
  }

  const handleQuantityChange = (serviceName, changeType) => {
    const updatedServices = selectedServices.map((service) => {
      if (service.name === serviceName) {
        if (changeType === 'plus') {
          const newQty = service.quantity + 1
          return { ...service, quantity: newQty, total: newQty * Number(service.price) }
        }
        if (changeType === 'minus' && service.quantity > 1) {
          const newQty = service.quantity - 1
          return { ...service, quantity: newQty, total: newQty * Number(service.price) }
        }
      }
      return service
    })
    const Total = updatedServices.reduce((acc, curr) => acc + Number(curr.total), 0)
    setServicesTotal?.(Total)
    setSelectedServices(updatedServices)
  }

  return (
    <div className={styles.section}>
      <h5 className={styles.title}>Additional Services</h5>
      <p className={styles.subtitle}>Enhance your journey with optional services</p>

      <div className={styles.list}>
        {(Services || []).map((service, index) => {
          const selected = selectedServices.find((s) => s.name === service.name)
          const isSelected = Boolean(selected)
          const qty = Number(selected?.quantity || 1)
          const lineTotal =
            service.type === 'per_person'
              ? qty * Number(service.price || 0)
              : Number(service.price || 0)
          const switchId = `activity-addon-${index + 1}`

          return (
            <div
              key={service.name || index}
              className={`${styles.item}${isSelected ? ` ${styles.itemActive}` : ''}`}
            >
              <div className={styles.itemTop}>
                <div className={styles.toggleWrap}>
                  <div className={styles.switch}>
                    <input
                      id={switchId}
                      type="checkbox"
                      role="switch"
                      className={styles.switchInput}
                      checked={isSelected}
                      onChange={() => handleServiceToggle(service)}
                      aria-checked={isSelected}
                    />
                    <label
                      htmlFor={switchId}
                      className={styles.switchTrack}
                      aria-label={service?.name || 'Toggle service'}
                    />
                  </div>
                  <div className={styles.serviceMeta}>
                    <label htmlFor={switchId} className={styles.serviceName}>
                      {service?.name}
                    </label>
                    <p className={styles.serviceHint}>
                      {service.type === 'per_person' ? 'Optional · billed per person' : 'Optional · billed once'}
                    </p>
                  </div>
                </div>

                <div className={styles.priceBlock}>
                  <span className={styles.unitPrice}>
                    <PriceDisplay price={service.price} currency={currency} />
                  </span>
                  <span className={styles.unitType}>
                    {service.type === 'per_person' ? 'per person' : 'per booking'}
                  </span>
                </div>
              </div>

              {isSelected && service.type === 'per_person' && (
                <div className={styles.itemControls}>
                  <div className={styles.qtyBox}>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => handleQuantityChange(service.name, 'minus')}
                      disabled={qty <= 1}
                      aria-label={`Decrease ${service.name} quantity`}
                    >
                      −
                    </button>
                    <span className={styles.qtyValue}>{qty}</span>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => handleQuantityChange(service.name, 'plus')}
                      aria-label={`Increase ${service.name} quantity`}
                    >
                      +
                    </button>
                  </div>
                  <div className={styles.lineTotal}>
                    <span className={styles.lineTotalLabel}>
                      {qty} × unit
                    </span>
                    <span className={styles.lineTotalValue}>
                      +
                      <PriceDisplay price={lineTotal} currency={currency} />
                    </span>
                  </div>
                </div>
              )}

              {isSelected && service.type !== 'per_person' && (
                <div className={styles.bookingOnlyTotal}>
                  <span>Per booking</span>
                  <strong>
                    +
                    <PriceDisplay price={lineTotal} currency={currency} />
                  </strong>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
