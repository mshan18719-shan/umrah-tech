'use client'
import React, { useState } from 'react'
import { FaStar } from 'react-icons/fa'
import { GoPerson } from 'react-icons/go'
import { useTransferStore } from '@/components/Store/TransferStore'
import { PiSuitcaseRolling } from 'react-icons/pi'
import { GiGearStickPattern } from 'react-icons/gi'
import PriceDisplay from '@/components/Currency/PriceDisplay'
import CheckoutTransfer from '@/components/Transfer/Checkout/CheckoutTransfer.js'
import moment from 'moment'
// import VehicleDetail from '@/components/Transfer/Listing/VehicleDetail'
import { IoInformationCircleOutline } from 'react-icons/io5'
import './checkout.css'

export const dynamic = 'force-dynamic'

function formatTransferType(type) {
    if (!type) return ''
    return type
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

function formatTransferDateTime(date, time) {
    if (!date) return '—'
    const day = moment(date)
    if (!day.isValid()) return '—'

    if (!time) return day.format('DD MMM YYYY')

    const clock = moment(time, ['HH:mm:ss', 'HH:mm', 'hh:mm A'], true)
    if (!clock.isValid()) return day.format('DD MMM YYYY')

    return `${day.format('DD MMM YYYY')}, ${clock.format('hh:mm A')}`
}

export default function Page() {
    const { selectedtransfer, updateTransferQuantity } = useTransferStore()
    const [showModal, setShowModal] = useState(false)

    if (!selectedtransfer || !selectedtransfer.searchParams) {
        return (
            <div className="transfer-checkout-page">
                <div className="container pt-5">
                    <div className="checkout-page-header">
                        <h1>No transfer selected</h1>
                        <p>Please select a transfer from the search page.</p>
                    </div>
                </div>
            </div>
        )
    }

    const vehicle = selectedtransfer?.vehicle_details || {}
    const searchParams = selectedtransfer.searchParams
    const transferTypeLabel = formatTransferType(searchParams?.transferType)
    const vehicleTitle = transferTypeLabel
        ? `${vehicle?.name || 'Transfer'} (${transferTypeLabel})`
        : (vehicle?.name || 'Transfer')

    const rating =
        vehicle?.rating != null && vehicle?.rating !== ''
            ? Number(vehicle.rating).toFixed(1)
            : selectedtransfer?.rating
                ? Number(selectedtransfer.rating).toFixed(1)
                : null

    const description =
        vehicle?.vehicle_description ||
        vehicle?.description ||
        ''

    const quantity = Number(selectedtransfer.quantity) || 1
    const totalPrice = quantity * Number(selectedtransfer?.fare || 0)
    const transferType = searchParams?.transferType || 'one-way'
    const pickupWhen = formatTransferDateTime(searchParams.pickupDate, searchParams.pickupTime)
    const returnWhen = formatTransferDateTime(searchParams.dropoffDate, searchParams.dropoffTime)

    const handleQuantityChange = (e) => {
        updateTransferQuantity(Number(e.target.value))
    }

    const renderRouteBoxes = () => {
        if (transferType === 'all-round') {
            return (
                <div className="checkout-route-boxes checkout-route-boxes--single">
                    <div className="checkout-route-box">
                        <span className="checkout-route-box-badge">All round</span>
                        <span className="checkout-route-box-label">Service location</span>
                        <span className="checkout-route-box-place">
                            {searchParams.pickupLocation || '—'}
                        </span>
                        <span className="checkout-route-box-time">{pickupWhen}</span>
                        <span className="checkout-route-box-note">
                            Vehicle available around this location (no separate drop-off)
                        </span>
                    </div>
                </div>
            )
        }

        if (transferType === 'return') {
            return (
                <div className="checkout-route-boxes">
                    <div className="checkout-route-box">
                        <span className="checkout-route-box-badge">Outbound</span>
                        <span className="checkout-route-box-label">Pick up</span>
                        <span className="checkout-route-box-place">
                            {searchParams.pickupLocation || '—'}
                        </span>
                        <span className="checkout-route-box-meta">
                            Drop off: {searchParams.dropoffLocation || '—'}
                        </span>
                        <span className="checkout-route-box-time">{pickupWhen}</span>
                    </div>
                    <div className="checkout-route-box">
                        <span className="checkout-route-box-badge">Return</span>
                        <span className="checkout-route-box-label">Pick up</span>
                        <span className="checkout-route-box-place">
                            {searchParams.dropoffLocation || '—'}
                        </span>
                        <span className="checkout-route-box-meta">
                            Drop off: {searchParams.pickupLocation || '—'}
                        </span>
                        <span className="checkout-route-box-time">{returnWhen}</span>
                    </div>
                </div>
            )
        }

        // one-way (default)
        return (
            <div className="checkout-route-boxes">
                <div className="checkout-route-box">
                    <span className="checkout-route-box-badge">One way</span>
                    <span className="checkout-route-box-label">Pick up</span>
                    <span className="checkout-route-box-place">
                        {searchParams.pickupLocation || '—'}
                    </span>
                    <span className="checkout-route-box-time">{pickupWhen}</span>
                </div>
                <div className="checkout-route-box">
                    <span className="checkout-route-box-badge">One way</span>
                    <span className="checkout-route-box-label">Drop off</span>
                    <span className="checkout-route-box-place">
                        {searchParams.dropoffLocation || '—'}
                    </span>
                    <span className="checkout-route-box-time">
                        {searchParams.dropoffDate || searchParams.dropoffTime
                            ? formatTransferDateTime(searchParams.dropoffDate, searchParams.dropoffTime)
                            : 'Arrives same day'}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="transfer-checkout-page">
            <div className="container pt-4 pt-md-5">
                <div className="checkout-page-header">
                    <h1>Review Your Booking</h1>
                    <p>Confirm your pickup and drop-off details.</p>
                </div>

                <section className="checkout-review-hero">
                    {selectedtransfer?.vehicle_image && (
                        <div className="checkout-review-media">
                            <img
                                src={selectedtransfer.vehicle_image}
                                alt={vehicle?.name || 'Transfer vehicle'}
                            />
                        </div>
                    )}
                    <div className="checkout-review-panel">
                        <div className="checkout-review-title-row">
                            <h2 className="checkout-review-title">{vehicleTitle}</h2>
                            {rating && (
                                <span className="checkout-review-rating">
                                    <FaStar className="checkout-review-star" />
                                    {rating}
                                </span>
                            )}
                        </div>
                        {description && (
                            <p className="checkout-review-desc">{description}</p>
                        )}
                        <div className="checkout-review-pills">
                            {vehicle?.luggage_capacity != null && (
                                <div className="checkout-review-pill">
                                    <PiSuitcaseRolling className="checkout-review-pill-icon" />
                                    <span>{vehicle.luggage_capacity}</span>
                                </div>
                            )}
                            {vehicle?.transmission_type && (
                                <div className="checkout-review-pill">
                                    <GiGearStickPattern className="checkout-review-pill-icon" />
                                    <span>{vehicle.transmission_type}</span>
                                </div>
                            )}
                            {vehicle?.passenger_capacity != null && (
                                <div className="checkout-review-pill">
                                    <GoPerson className="checkout-review-pill-icon" />
                                    <span>{vehicle.passenger_capacity}</span>
                                </div>
                            )}
                        </div>

                        {renderRouteBoxes()}
                    </div>
                </section>

                <div className="row g-4 transfer-checkout-main-row">
                    <div className="col-lg-9 col-md-8 col-12 order-lg-1 order-2">
                        {searchParams?.transferType === 'all-round' ? (
                            <div className="transfer-map-wrap rounded-3 mb-4">
                                <iframe
                                    src={`https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${searchParams.fromLat},${searchParams.fromLng}&zoom=14`}
                                    width="100%"
                                    style={{ border: '0', height: '20em' }}
                                    loading="lazy"
                                    className="rounded-3 h-250px h-md-350px"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        ) : (
                            <div className="transfer-map-wrap rounded-3 mb-4">
                                <iframe
                                    src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${searchParams.fromLat},${searchParams.fromLng}&destination=${searchParams.toLat},${searchParams.toLng}`}
                                    width="100%"
                                    style={{ border: '0', height: '20em' }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    className="rounded-3 h-250px h-md-350px"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        )}
                        <div className="transfer-checkout-section-header">
                            <h2>Checkout</h2>
                            <p>Complete your booking — enter passenger and payment details</p>
                        </div>
                        <div className="transfer-checkout-form-wrap">
                            <CheckoutTransfer transferDetail={selectedtransfer} />
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-4 col-12 order-lg-2 order-1">
                        <div className="transfer-checkout-sidebar">
                            <div className="transfer-info-card">
                                <div className="transfer-info-card-header">
                                    <h5>Your Transfer Info</h5>
                                    {transferTypeLabel && (
                                        <span className="transfer-type-badge">{transferTypeLabel}</span>
                                    )}
                                </div>

                                <div className="transfer-info-card-body">

                                    <div className="transfer-info-rows">
                                        {/* <div className="transfer-info-row">
                                            <span className="transfer-info-label">Passengers</span>
                                            <span className="transfer-info-value">{searchParams.passengers}</span>
                                        </div> */}

                                        <div className="transfer-info-row">
                                            <span className="transfer-info-label">Vehicle</span>
                                            <span className="transfer-info-value">{vehicle?.name || '—'}</span>
                                        </div>

                                        <div className="transfer-info-row">
                                            <span className="transfer-info-label">Quantity</span>
                                            <select
                                                id="checkoutTransferQuantity"
                                                className="form-select transfer-info-quantity-select"
                                                value={quantity}
                                                onChange={handleQuantityChange}
                                                aria-label="Transfer quantity"
                                            >
                                                <option value={1}>1</option>
                                                <option value={2}>2</option>
                                                <option value={3}>3</option>
                                                <option value={4}>4</option>
                                                <option value={5}>5</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* <button
                                        type="button"
                                        className="btn-transfer-view-details"
                                        onClick={() => setShowModal(true)}
                                    >
                                        View Details
                                    </button> */}

                                    {selectedtransfer?.cancel_policy && (
                                        <div className="transfer-info-policy">
                                            <p className="transfer-info-policy-title">Cancellation Policy</p>
                                            {selectedtransfer.cancel_policy === 'refundable' ? (
                                                selectedtransfer.cancellation_policies?.length > 0 ? (
                                                    <div className="transfer-policy-list">
                                                        {selectedtransfer.cancellation_policies.map((policy, idx) => (
                                                            <div key={idx} className="transfer-policy-item warning">
                                                                <IoInformationCircleOutline size={16} className="flex-shrink-0" />
                                                                <small>
                                                                    From <strong>{moment(policy.from).format('DD MMM YYYY')}</strong>: fee of{' '}
                                                                    <strong className="text-danger">
                                                                        <PriceDisplay
                                                                            price={quantity * Number(policy.amount)}
                                                                            currency={selectedtransfer?.currency}
                                                                        />
                                                                    </strong>
                                                                </small>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="transfer-policy-item success">
                                                        <small>Refundable according to provider terms.</small>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="transfer-policy-item danger">
                                                    <small>
                                                        <strong>Non-refundable</strong> — no refund on cancellation.
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <hr className="transfer-info-divider" />

                                    <div className="transfer-info-total">
                                        <span className="transfer-info-total-label">Total Price</span>
                                        <span className="transfer-info-total-value">
                                            <PriceDisplay price={totalPrice} currency={selectedtransfer?.currency} />
                                        </span>
                                    </div>
                                    <p className="transfer-info-tax-note">VAT and taxes included</p>
                                </div>
                            </div>

                            {/* <VehicleDetail
                                selectedTransferDetail={selectedtransfer}
                                showModal={showModal}
                                handleCloseModal={() => setShowModal(false)}
                                type="checkout"
                            /> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
