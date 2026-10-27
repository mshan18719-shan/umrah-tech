import React from 'react'
import moment from 'moment';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { LuBadgeCheck, LuShield } from 'react-icons/lu';
import { CiHeart } from 'react-icons/ci';
import { MdOutlinePercent } from 'react-icons/md';
import { IoInformation, IoCheckmarkCircle, IoCloseCircle, IoTimeOutline } from 'react-icons/io5';
import {
  formatDeadlineDate,
  formatPolicyTimeText,
  getPolicyCharge,
  getPolicyHours,
  isFromAmountPolicyStyle,
  resolveCancellationPolicies,
} from '@/components/Activities/Detail/cancellationPolicyUtils';

const PAX_LABELS = {
  ADULT: 'Adult',
  CHILD: 'Child',
  SENIOR: 'Senior',
  INFANT: 'Infant',
};

function formatAgeRange(ageFrom, ageTo) {
  if (ageFrom == null && ageTo == null) return '';
  const to = ageTo != null && ageTo >= 999 ? '99+' : ageTo;
  if (ageFrom != null && to != null) return `(age ${ageFrom}–${to})`;
  if (ageFrom != null) return `(age ${ageFrom}+)`;
  return '';
}

function formatSessionLabel(codeOrName) {
  if (!codeOrName) return '';
  const value = typeof codeOrName === 'object'
    ? (codeOrName.name || codeOrName.code)
    : codeOrName;
  if (!value) return '';
  const parsed = moment(value, ['HH:mm', 'H:mm', 'hh:mm A'], true);
  return parsed.isValid() ? parsed.format('h:mm A') : String(value);
}

function resolveCheckoutTiming(activityDetail) {
  const modality = activityDetail?.modality;
  if (modality?.session) {
    return formatSessionLabel(modality.session);
  }
  if (activityDetail?.timing_label) return activityDetail.timing_label;
  if (activityDetail?.start_time && activityDetail?.end_time) {
    return `${formatSessionLabel(activityDetail.start_time)} – ${formatSessionLabel(activityDetail.end_time)}`;
  }
  if (activityDetail?.start_time) return formatSessionLabel(activityDetail.start_time);
  return null;
}

export default function Summery({ activityDetail, totalGuests = 0 }) {
  const totalPeople = Number(activityDetail?.adults || 0) + Number(activityDetail?.children || 0);
  const guestsCount = totalGuests || totalPeople;
  const perPersonTotal = guestsCount > 0
    ? Number(activityDetail?.grand_total || 0) / guestsCount
    : Number(activityDetail?.grand_total || 0);
  const modality = activityDetail?.modality;
  const selectedPax = Array.isArray(modality?.selected_pax)
    ? modality.selected_pax
    : [];
  const resolvedPolicy = resolveCancellationPolicies(activityDetail);
  const checkoutTiming = resolveCheckoutTiming(activityDetail);
  const hasCancellationInfo =
    !!activityDetail?.cancellation_policy ||
    !!activityDetail?.cancellation_policy_text ||
    (Array.isArray(modality?.cancellation_policies) && modality.cancellation_policies.length > 0);

  const renderCancellationPolicy = () => {
    const { cancel_policy, cancellation_policies } = resolvedPolicy;

    if (!cancel_policy && (!cancellation_policies || cancellation_policies.length === 0)) {
      return null;
    }

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

    if (cancellation_policies && cancellation_policies.length > 0) {
      const travelDate = activityDetail?.travel_date;
      const sessionCode = modality?.session?.code || modality?.session;

      // API style: { from, amount, original_amount }
      if (isFromAmountPolicyStyle(cancellation_policies)) {
        const policy = cancellation_policies[0];
        const dateLabel = formatDeadlineDate(policy);

        return (
          <div>
            <div className="policy-alert success">
              <IoCheckmarkCircle size={22} className="mt-1 flex-shrink-0" />
              <div>
                <h6>Refundable Booking</h6>
                <p>
                  {dateLabel
                    ? `Cancel free before ${dateLabel} and get a full refund.`
                    : 'Free cancellation is available until the deadline below.'}
                </p>
              </div>
            </div>

            <div className="summary-section-label mt-3">What happens if you cancel</div>

            <div className="policy-timeline-item primary">
              <div className="d-flex align-items-start gap-2">
                <IoCheckmarkCircle size={18} className="mt-1 flex-shrink-0" style={{ color: '#22c55e' }} />
                <div>
                  <h6 className="mb-1 small fw-bold" style={{ color: '#16a34a' }}>
                    {dateLabel ? `Before ${dateLabel}` : 'Before the deadline'}
                  </h6>
                  <p className="mb-0 small text-muted">
                    Full refund. No cancellation fee.
                  </p>
                </div>
              </div>
            </div>

            <div className="policy-timeline-item secondary">
              <div className="d-flex align-items-start gap-2">
                <IoTimeOutline size={18} className="mt-1 flex-shrink-0" style={{ color: '#dc2626' }} />
                <div>
                  <h6 className="mb-1 small fw-bold" style={{ color: '#dc2626' }}>
                    {dateLabel ? `On or after ${dateLabel}` : 'After the deadline'}
                  </h6>
                  <p className="mb-1 small text-muted">
                    This booking is non refundable after the free-cancel deadline.
                  </p>
                  <strong className="text-danger small">Non refundable</strong>
                </div>
              </div>
            </div>

            <div className="policy-alert" style={{ background: '#fff9e6', color: '#7a5c00' }}>
              <IoInformation size={18} className="mt-1 flex-shrink-0" />
              <p className="small mb-0">
                <strong>Tip:</strong> Cancel before the date above to get your money back.
              </p>
            </div>
          </div>
        );
      }

      const sortedPolicies = [...cancellation_policies].sort((a, b) => {
        const hoursA = getPolicyHours(a, travelDate, sessionCode) ?? 0;
        const hoursB = getPolicyHours(b, travelDate, sessionCode) ?? 0;
        return hoursB - hoursA;
      });

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
            const timeText = formatPolicyTimeText(policy, travelDate, sessionCode);
            const charge = getPolicyCharge(policy);

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
                        {timeText}
                      </h6>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: charge.isFree ? '#dcfce7' : '#fee2e2',
                          color: charge.isFree ? '#16a34a' : '#dc2626',
                          fontSize: '0.72rem',
                        }}
                      >
                        {charge.refundText}
                      </span>
                    </div>

                    <p className="mb-1 small text-muted">{charge.refundDescription}</p>

                    {charge.isFree && (
                      <div className="mt-1 small text-success">
                        <strong>✓ Full refund — No cancellation charges</strong>
                      </div>
                    )}
                    {!charge.isFree && (
                      <div className="mt-1 small text-danger">
                        <strong>Non refundable</strong>
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

          <div className="summary-section-label">Activity details</div>
          {activityDetail?.travel_date && (
            <div className="summary-line">
              <span className="line-label">Date</span>
              <span className="line-value">
                {moment(activityDetail.travel_date).format('ddd, MMM DD, YYYY')}
              </span>
            </div>
          )}
          {checkoutTiming && (
            <div className="summary-line">
              <span className="line-label">Timing</span>
              <span className="line-value">{checkoutTiming}</span>
            </div>
          )}
          {activityDetail?.duration && (
            <div className="summary-line">
              <span className="line-label">Duration</span>
              <span className="line-value">{activityDetail.duration}</span>
            </div>
          )}
          {(modality?.language?.description || modality?.language?.code) && (
            <div className="summary-line">
              <span className="line-label">Language</span>
              <span className="line-value">
                {modality.language?.description || modality.language?.code}
              </span>
            </div>
          )}
          {modality?.name && (
            <div className="summary-line">
              <span className="line-label">Option</span>
              <span className="line-value">{modality.name}</span>
            </div>
          )}

          <hr className="summary-divider" />

          {selectedPax.length > 0 ? (
            selectedPax.map((pax, index) => {
              const qty = Number(pax.quantity || 0);
              const amount = Number(pax.amount || 0);
              if (qty <= 0) return null;
              return (
                <div key={index} className="summary-line">
                  <span className="line-label">
                    {qty} {PAX_LABELS[pax.paxType] || pax.paxType}{' '}
                    {formatAgeRange(pax.ageFrom, pax.ageTo)} ×{' '}
                    <PriceDisplay price={amount} currency={activityDetail.currency} />
                  </span>
                  <span className="line-value">
                    <PriceDisplay price={amount * qty} currency={activityDetail.currency} />
                  </span>
                </div>
              );
            })
          ) : (
            <>
              {activityDetail?.adults > 0 && (
                <div className="summary-line">
                  <span className="line-label">
                    {activityDetail.adults} Adult{activityDetail.adults > 1 ? 's' : ''} ×{' '}
                    <PriceDisplay price={Number(activityDetail.price_per_adult)} currency={activityDetail.currency} />
                  </span>
                  <span className="line-value">
                    <PriceDisplay price={Number(activityDetail.price_per_adult) * Number(activityDetail.adults)} currency={activityDetail.currency} />
                  </span>
                </div>
              )}

              {activityDetail?.children > 0 && (
                <div className="summary-line">
                  <span className="line-label">
                    {activityDetail.children} Child{activityDetail.children > 1 ? 'ren' : ''} ×{' '}
                    <PriceDisplay price={Number(activityDetail.price_per_child)} currency={activityDetail.currency} />
                  </span>
                  <span className="line-value">
                    <PriceDisplay price={Number(activityDetail.price_per_child) * Number(activityDetail.children)} currency={activityDetail.currency} />
                  </span>
                </div>
              )}
            </>
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
      {hasCancellationInfo && (
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
          <a href="tel:+1234567890" className="btn-support">
            <i className="bi bi-telephone"></i>
            Contact Support
          </a>
        </div>
      </div> */}
    </div>
  )
}
