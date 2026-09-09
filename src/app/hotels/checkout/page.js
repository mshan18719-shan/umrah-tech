'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { FaStar, FaStarHalfAlt, FaUtensils, FaBed, FaTimes, FaCheckCircle, FaBan } from 'react-icons/fa'
import { BiUser } from 'react-icons/bi'
import { useHotelStore } from '@/components/Store/HotelStore'
import moment from 'moment'
import CheckoutForm from '@/components/Hotels/HotelCheckout/CheckoutForm'
import HotelOrderSummary from '@/components/Hotels/HotelCheckout/HotelOrderSummary'
import { FaLocationDot, FaChevronLeft } from 'react-icons/fa6'
import PriceDisplay from '@/components/Currency/PriceDisplay'
import { Tooltip } from '@mantine/core'
import { MdInfoOutline } from 'react-icons/md'
import { useCurrency } from '@/util/currency'
import { ConvertPrice } from '@/components/Currency/ConvertPrice'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import './checkout.css'

export const dynamic = 'force-dynamic'

export default function Page() {
  const { availabilityData } = useHotelStore()
  const [modalPolicy, setModalPolicy] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const { currency, rates } = useCurrency()
  const router = useRouter()

  const nights = useMemo(() => {
    if (!availabilityData?.check_in || !availabilityData?.check_out) return 1
    const diff = moment(availabilityData.check_out).diff(moment(availabilityData.check_in), 'days')
    return diff > 0 ? diff : 1
  }, [availabilityData?.check_in, availabilityData?.check_out])

  const guestTotals = useMemo(() => {
    if (!availabilityData?.rooms) return { adults: 0, children: 0, rooms: 0 }
    return availabilityData.rooms.reduce(
      (acc, room) => {
        room.rates?.forEach((rate) => {
          acc.adults += Number(rate.adults || 0)
          acc.children += Number(rate.children || 0)
          acc.rooms += Number(rate.rooms || 0)
        })
        return acc
      },
      { adults: 0, children: 0, rooms: 0 }
    )
  }, [availabilityData?.rooms])

  const perNight = useMemo(() => {
    const total = Number(availabilityData?.total_net || 0)
    return nights > 0 ? total / nights : total
  }, [availabilityData?.total_net, nights])

  const amenityPreview = (availabilityData?.facilities || []).slice(0, 4)

  function getCancellationSummary(policyArr, Defaultcurrency) {
    if (!Array.isArray(policyArr) || policyArr.length === 0) {
      return { message: 'Non-refundable', type: 'non-refundable' }
    }

    const sortedPolicies = [...policyArr].sort((a, b) =>
      moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
    )
    const now = moment.utc()
    const allDatesInFuture = sortedPolicies.every((policy) =>
      moment.utc(policy.from).isAfter(now)
    )
    const nearestPolicy = sortedPolicies[0]
    const nearestDate = moment.utc(nearestPolicy.from)

    if (allDatesInFuture) {
      return {
        message: `Free cancellation before ${nearestDate.format('DD MMMM YYYY')}`,
        type: 'free',
        policy: nearestPolicy,
      }
    }

    const passedPolicies = sortedPolicies.filter(
      (policy) => !moment.utc(policy.from).isAfter(now)
    )
    const currentPolicy = passedPolicies[passedPolicies.length - 1] || sortedPolicies[sortedPolicies.length - 1]
    const ConvertedAmount = ConvertPrice(
      currentPolicy?.amount,
      Defaultcurrency,
      currency,
      rates
    )
    return {
      message: `Cancellation fee: ${ConvertedAmount.newcurrency} ${ConvertedAmount.newprice}`,
      type: 'fee',
      policy: currentPolicy,
    }
  }

  function handleViewPolicy(policyArr, policyCurrency) {
    setModalPolicy({ policies: policyArr, currency: policyCurrency })
    setShowModal(true)
  }

  useEffect(() => {
    if (!showModal) return undefined

    const html = document.documentElement
    const body = document.body
    const scrollbarWidth = window.innerWidth - html.clientWidth

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
    }

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      body.style.paddingRight = prev.bodyPaddingRight
    }
  }, [showModal])

  function CancellationModal() {
    if (!showModal || !modalPolicy) return null

    const sortedPolicies = [...modalPolicy.policies].sort((a, b) =>
      moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
    )
    const firstFrom = moment.utc(sortedPolicies[0].from)

    return (
      <div
        className="ck-policy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ck-policy-modal-title"
        onClick={() => setShowModal(false)}
      >
        <div className="ck-policy-modal__dialog" onClick={(e) => e.stopPropagation()}>
          <div className="ck-policy-modal__header">
            <div className="ck-policy-modal__header-text">
              <h5 id="ck-policy-modal-title">Cancellation policy</h5>
              <p>Timeline of refund windows and applicable fees</p>
            </div>
            <button
              type="button"
              className="ck-policy-modal__close"
              onClick={() => setShowModal(false)}
              aria-label="Close cancellation policy"
            >
              <FaTimes />
            </button>
          </div>

          <div className="ck-policy-modal__body">
            <div className="ck-policy-item ck-policy-item--refund">
              <div className="ck-policy-item__icon" aria-hidden="true">
                <FaCheckCircle />
              </div>
              <div className="ck-policy-item__content">
                <div className="ck-policy-item__top">
                  <div className="ck-policy-item__when">
                    <span className="ck-policy-item__label">Before</span>
                    <span className="ck-policy-item__date">{firstFrom.format('MMM DD')}</span>
                  </div>
                  <span className="ck-policy-badge ck-policy-badge--refund">Full refund</span>
                </div>
                <p className="ck-policy-item__desc">
                  Cancel your reservation before{' '}
                  {firstFrom.format('MMM DD [at] hh:mm A')}, and you&apos;ll get a full refund.
                </p>
              </div>
            </div>

            {sortedPolicies.map((policy, idx) => {
              const dateObj = moment.utc(policy.from)
              return (
                <div key={idx} className="ck-policy-item ck-policy-item--fee">
                  <div className="ck-policy-item__icon" aria-hidden="true">
                    <FaBan />
                  </div>
                  <div className="ck-policy-item__content">
                    <div className="ck-policy-item__top">
                      <div className="ck-policy-item__when">
                        <span className="ck-policy-item__label">From</span>
                        <span className="ck-policy-item__date">{dateObj.format('MMM DD')}</span>
                      </div>
                      <span className="ck-policy-badge ck-policy-badge--fee">
                        <PriceDisplay price={policy.amount} currency={modalPolicy.currency} /> fee
                      </span>
                    </div>
                    <p className="ck-policy-item__desc">
                      From {dateObj.format('MMM DD [at] hh:mm A')}, a cancellation fee of{' '}
                      <PriceDisplay price={policy.amount} currency={modalPolicy.currency} /> will
                      be charged.
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const guestLabelParts = []
  if (guestTotals.adults > 0) {
    guestLabelParts.push(
      `${guestTotals.adults} Adult${guestTotals.adults > 1 ? 's' : ''}`
    )
  }
  if (guestTotals.children > 0) {
    guestLabelParts.push(
      `${guestTotals.children} Child${guestTotals.children > 1 ? 'ren' : ''}`
    )
  }
  const guestLabel = guestLabelParts.join(', ')
  const totalGuests = guestTotals.adults + guestTotals.children

  return (
    <div className="hotel-checkout-container">
      <CancellationModal />

      <div className="container pb-5">
        <div className="checkout-page-header">
          <h1>Review Your Booking</h1>
          <p>Confirm your hotel details before completing guest and payment information.</p>
        </div>

        <section className="hotel-checkout-hero-card">
          <div className="hotel-checkout-hero-media">
            {availabilityData?.main_images?.length > 0 ? (
              <Image
                src={availabilityData.main_images[0]?.url}
                alt={availabilityData?.hotel_name || 'Hotel'}
                width={320}
                height={200}
                className="hotel-checkout-hero-img"
                unoptimized
              />
            ) : (
              <div className="hotel-checkout-hero-img hotel-checkout-hero-img--placeholder" />
            )}
          </div>

          <div className="hotel-checkout-hero-info">
            <div className="hotel-checkout-hero-stars">
              {availabilityData?.stars && !isNaN(availabilityData.stars) ? (
                <>
                  {Array(Math.floor(Number(availabilityData.stars)))
                    .fill(0)
                    .map((_, i) => (
                      <FaStar key={i} />
                    ))}
                  {Number(availabilityData.stars) % 1 !== 0 && <FaStarHalfAlt />}
                </>
              ) : null}
            </div>
            <h2 className="hotel-checkout-hero-title">{availabilityData?.hotel_name}</h2>
            {availabilityData?.address && (
              <p className="hotel-checkout-hero-location">
                <FaLocationDot />
                <span>{availabilityData.address}</span>
              </p>
            )}
            {amenityPreview.length > 0 && (
              <div className="hotel-checkout-hero-pills">
                {amenityPreview.map((item, idx) => (
                  <span key={idx} className="hotel-checkout-hero-pill">
                    {item}
                  </span>
                ))}
              </div>
            )}
            <div className="hotel-checkout-hero-meta">
              <span>
                {moment(availabilityData?.check_in).format('DD MMM YYYY')} →{' '}
                {moment(availabilityData?.check_out).format('DD MMM YYYY')}
              </span>
              <span>
                {nights} night{nights > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="hotel-checkout-hero-price">
            <span className="hotel-checkout-hero-price-night">
              <PriceDisplay price={perNight} currency={availabilityData?.currency} /> / night
            </span>
            <strong className="hotel-checkout-hero-price-total">
              <PriceDisplay
                price={availabilityData?.total_net}
                currency={availabilityData?.currency}
              />
            </strong>
            <span className="hotel-checkout-hero-price-note">VAT and taxes included</span>
          </div>
        </section>

        <div className="hotel-checkout-rooms-strip">
          {availabilityData?.rooms?.map((item, index) => (
            <div key={index} className="hotel-checkout-room-chip">
              <h6>{item.name}</h6>
              {item.rates?.map((rate, idx) => (
                <div key={idx} className="hotel-checkout-room-chip__body">
                  {rate?.on_request && (
                    <span className="hotel-checkout-on-request">
                      On Request
                      <Tooltip label="This room is not instantly confirmed and requires availability confirmation from the hotel.">
                        <MdInfoOutline size={15} className="ms-1 cursor-pointer" />
                      </Tooltip>
                    </span>
                  )}
                  <div className="hotel-checkout-room-chip__row">
                    <span>
                      <FaUtensils /> {rate.board_name}
                    </span>
                    <span>
                      <FaBed /> {rate.rooms} Room{Number(rate.rooms) > 1 ? 's' : ''}
                    </span>
                    <span>
                      <BiUser /> {rate.adults} Adult{Number(rate.adults) > 1 ? 's' : ''}
                      {Number(rate.children) > 0
                        ? ` · ${rate.children} Child${Number(rate.children) > 1 ? 'ren' : ''}`
                        : ''}
                    </span>
                  </div>
                  <div className="hotel-checkout-room-chip__cancel">
                    {getCancellationSummary(rate?.cancellation_policies, availabilityData?.currency)
                      .message}
                    {rate?.cancellation_policies?.length > 0 && (
                      <MdInfoOutline
                        size={16}
                        className="ms-1 cursor-pointer"
                        onClick={() =>
                          handleViewPolicy(
                            rate?.cancellation_policies,
                            availabilityData?.currency
                          )
                        }
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="row g-4 checkout-main-row">
          <div className="col-lg-8 col-12 order-2 order-lg-1">
            <div className="checkout-section-header">
              <h2>Checkout</h2>
              <p>Complete your booking — enter guest and payment details</p>
            </div>

            <CheckoutForm
              data={availabilityData}
              currency={currency}
              rates={rates}
              totalGuests={totalGuests}
              guestLabel={guestLabel}
            />
          </div>

          <div className="col-lg-4 col-12 order-1 order-lg-2">
            <div className="checkout-sidebar">
              <HotelOrderSummary
                data={availabilityData}
                nights={nights}
                totalGuests={totalGuests}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
