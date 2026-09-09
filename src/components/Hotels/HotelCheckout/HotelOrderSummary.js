import React from 'react'
import PriceDisplay from '@/components/Currency/PriceDisplay'

export default function HotelOrderSummary({
  data,
  nights = 1,
  totalGuests = 0,
}) {
  const total = Number(data?.total_net || 0)

  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <h5>Order Summary</h5>
      </div>
      <div className="summary-card-body">
        {data?.rooms?.map((room, index) =>
          room.rates?.map((rate, rIdx) => (
            <div key={`${index}-${rIdx}`} className="summary-line summary-line--muted">
              <span className="line-label">
                {room.name}
                {rate.board_name ? ` · ${rate.board_name}` : ''}
              </span>
              <span className="line-value">
                <PriceDisplay price={rate.price} currency={data?.currency} />
              </span>
            </div>
          ))
        )}

        <hr className="summary-divider" />

        <div className="summary-total-row">
          <span className="total-label">Total</span>
          <span className="total-value">
            <PriceDisplay price={total} currency={data?.currency} />
          </span>
        </div>

        <div className="summary-tax-note">Inclusive of VAT and taxes</div>
      </div>
    </div>
  )
}
