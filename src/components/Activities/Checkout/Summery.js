import React from 'react'
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { LuBadgeCheck, LuShield } from 'react-icons/lu';
import { CiHeart } from 'react-icons/ci';
import { MdOutlinePercent } from 'react-icons/md';
import { IoInformation, IoCheckmarkCircle, IoCloseCircle, IoTimeOutline } from 'react-icons/io5';
import { resolveCancellationPolicy } from '@/components/Activities/Detail/cancellationPolicyUtils';

export default function Summery({ activityDetail, totalGuests = 0 }) {
  const totalPeople = Number(activityDetail?.adults || 0) + Number(activityDetail?.children || 0);
  const guestsCount = totalGuests || totalPeople;
  const perPersonTotal = guestsCount > 0
    ? Number(activityDetail?.grand_total || 0) / guestsCount
    : Number(activityDetail?.grand_total || 0);

  const renderCancellationPolicy = () => {
    const cancellationPolicy = resolveCancellationPolicy(
      activityDetail?.cancellation_policy,
      activityDetail?.cancellation_policy_text
    );

    if (!cancellationPolicy) {
      return null;
    }

    const { cancel_policy, cancellation_policies } = cancellationPolicy;

    if (cancel_policy === 'non-refundable') {
      return (
        <div className="policy-alert danger">
          <IoCloseCircle size={22} className="mt-1 flex-shrink-0" />
          <div>
            <h6>Non-Refundable</h6>
            <p>This booking cannot be cancelled or refunded under any circumstances.</p>
          </div>
        </div>
      );
    }

    if (cancel_policy === 'refundable' && cancellation_policies && cancellation_policies.length > 0) {
      const sortedPolicies = [...cancellation_policies].sort((a, b) => b.time_duration - a.time_duration);

      return (
        <div>
          <div className="policy-alert success">
            <IoCheckmarkCircle size={22} className="mt-1 flex-shrink-0" />
            <div>
              <h6>Refundable Booking</h6>
              <p>You can cancel this booking according to the policy below.</p>
            </div>
          </div>

          <div className="summary-section-label mt-3">Cancellation Timeline</div>

          {sortedPolicies.map((policy, index) => {
            const timeText = policy.time_duration >= 24
              ? `${policy.time_duration / 24} day${policy.time_duration / 24 > 1 ? 's' : ''}`
              : `${policy.time_duration} hour${policy.time_duration > 1 ? 's' : ''}`;

            let refundText = '';
            let refundAmount = '';
            let refundDescription = '';

            if (policy.type === 'percentage') {
              const refundPercentage = 100 - policy.value;
              refundText = `${policy.value}% Charge`;
              refundDescription = `${policy.value}% cancellation charge applies. You will receive ${refundPercentage}% of the total booking amount back.`;
            } else if (policy.type === 'fixed') {
              refundText = `Cancellation Fee`;
              refundAmount = policy.value;
              refundDescription = `A fixed cancellation fee will be charged.`;
            }

            return (
              <div
                key={index}
                className={`policy-timeline-item ${index === 0 ? 'primary' : 'secondary'}`}
              >
                <div className="d-flex align-items-start gap-2">
                  <IoTimeOutline
                    size={18}
                    className="mt-1 flex-shrink-0"
                    style={{ color: index === 0 ? '#22c55e' : '#6b7280' }}
                  />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                      <h6 className="mb-0 small fw-bold" style={{ color: index === 0 ? '#16a34a' : '#374151' }}>
                        {timeText} before activity
                      </h6>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: policy.type === 'percentage' ? '#dcfce7' : '#fee2e2',
                          color: policy.type === 'percentage' ? '#16a34a' : '#dc2626',
                          fontSize: '0.72rem',
                        }}
                      >
                        {refundText}
                      </span>
                    </div>

                    <p className="mb-1 small text-muted">{refundDescription}</p>

                    {policy.type === 'fixed' && (
                      <div className="mt-1">
                        <strong className="text-danger small">
                          Cancellation Fee: <PriceDisplay price={refundAmount} currency={activityDetail?.currency} />
                        </strong>
                      </div>
                    )}

                    {policy.type === 'percentage' && policy.value === 0 && (
                      <div className="mt-1 small text-success">
                        <strong>✓ Full refund — No cancellation charges</strong>
                      </div>
                    )}
                    {policy.type === 'percentage' && policy.value === 100 && (
                      <div className="mt-1 small text-danger">
                        <strong>⚠ No refund — 100% cancellation charge</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="policy-alert" style={{ background: '#fff9e6', color: '#7a5c00' }}>
            <IoInformation size={18} className="mt-1 flex-shrink-0" />
            <p className="small mb-0">
              <strong>Important:</strong> Cancellation must be made before the stated time.
              After this period, the booking is non-refundable.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="policy-alert success">
        <IoCheckmarkCircle size={22} className="mt-1 flex-shrink-0" />
        <div>
          <h6>Free Cancellation</h6>
          <p>This booking can be cancelled free of charge.</p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className='summary-card'>
        <div className='summary-card-header'>
          <h5>Order Summary</h5>
        </div>
        <div className='summary-card-body'>
          {/* <div className="summary-line">
            <span className="line-label">
              {activityDetail?.title || 'Activity Booking'}
            </span>
            <span className="line-value">
              <PriceDisplay price={activityDetail?.participants_total} currency={activityDetail?.currency} />
            </span>
          </div> */}

          {activityDetail?.selected_services && activityDetail.selected_services.length > 0 && (
            <>
              <div className="summary-section-label">Add-ons</div>
              {activityDetail.selected_services.map((service, index) => {
                const serviceTotal = service.type === 'per_person'
                  ? service.quantity * Number(service.price)
                  : Number(service.total);
                return (
                  <div key={index} className="summary-line">
                    <span className="line-label">{service.name}</span>
                    <span className="line-value">
                      +<PriceDisplay price={serviceTotal} currency={activityDetail.currency} />
                    </span>
                  </div>
                );
              })}
            </>
          )}

          {/* {guestsCount > 1 && (
            <>
              <div className="summary-line">
                <span className="line-label">Per person</span>
                <span className="line-value">
                  <PriceDisplay price={perPersonTotal} currency={activityDetail?.currency} />
                </span>
              </div>
              <div className="summary-line">
                <span className="line-label">× {guestsCount} passengers</span>
                <span className="line-value">
                  <PriceDisplay price={activityDetail?.grand_total} currency={activityDetail?.currency} />
                </span>
              </div>
              <hr className="summary-divider" />
            </>
          )} */}

          <hr className="summary-divider" />

          {activityDetail?.adults > 0 && (
            <div className="summary-line">
              <span className="line-label">
                {activityDetail.adults} Adult{activityDetail.adults > 1 ? 's' : ''}
              </span>
              <span className="line-value">
                <PriceDisplay price={Number(activityDetail.price_per_adult) * Number(activityDetail.adults)} currency={activityDetail.currency} />
              </span>
            </div>
          )}

          {activityDetail?.children > 0 && (
            <div className="summary-line">
              <span className="line-label">
                {activityDetail.children} Child{activityDetail.children > 1 ? 'ren' : ''}
              </span>
              <span className="line-value">
                <PriceDisplay price={Number(activityDetail.price_per_child) * Number(activityDetail.children)} currency={activityDetail.currency} />
              </span>
            </div>
          )}

          <hr className="summary-divider" />

          <div className="summary-total-row">
            <span className="total-label">Total</span>
            <span className="total-value">
              <PriceDisplay price={activityDetail?.grand_total} currency={activityDetail?.currency} />
            </span>
          </div>

          <div className="summary-tax-note">VAT and taxes included</div>
        </div>
      </div>

      {/* Cancellation Policy */}
      {(activityDetail?.cancellation_policy || activityDetail?.cancellation_policy_text) && (
        <div className='cancellation-card'>
          <div className='cancellation-card-header'>
            <h5>Cancellation Policy</h5>
          </div>
          <div className='cancellation-card-body'>
            {renderCancellationPolicy()}
          </div>
        </div>
      )}

      {/* Why Book With Us */}
      {/* <div className='trust-card'>
        <div className='trust-card-header'>
          <h5>Why Book With Us</h5>
        </div>
        <div className='trust-card-body'>
          <div className="trust-item">
            <div className="trust-icon"><LuShield size={18} /></div>
            <div>
              <div className="trust-item-title">Best Price Guarantee</div>
              <div className="trust-item-desc">Find it cheaper, we&apos;ll match it</div>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon"><LuBadgeCheck size={18} /></div>
            <div>
              <div className="trust-item-title">Verified Operator</div>
              <div className="trust-item-desc">Licensed &amp; insured experiences</div>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon"><CiHeart size={20} /></div>
            <div>
              <div className="trust-item-title">24/7 Support</div>
              <div className="trust-item-desc">We&apos;re here before, during &amp; after</div>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon"><MdOutlinePercent size={18} /></div>
            <div>
              <div className="trust-item-title">No Hidden Fees</div>
              <div className="trust-item-desc">Price you see is the price you pay</div>
            </div>
          </div>
        </div>

        <div className="trust-help">
          <div className="trust-help-icon"><IoInformation size={20} /></div>
          <div className="trust-item-title mb-1">Need Help?</div>
          <div className="trust-item-desc mb-3">Our travel experts are available 24/7</div>
          <a href="tel:01217772522" className="btn-support">
            <i className="bi bi-telephone"></i>
            Contact Support
          </a>
        </div>
      </div> */}
    </div>
  )
}
