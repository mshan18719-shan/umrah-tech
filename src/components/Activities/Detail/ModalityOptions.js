'use client'
import React, { useMemo, useState, useEffect } from 'react'
import moment from 'moment'
import { BiCalendarCheck } from 'react-icons/bi'
import { IoCheckmarkCircleOutline } from 'react-icons/io5'
import PriceDisplay from '@/components/Currency/PriceDisplay'
import styles from './ModalityOptions.module.css'

const PAX_LABELS = {
  ADULT: 'Adult',
  CHILD: 'Child',
  SENIOR: 'Senior',
  INFANT: 'Infant',
}

function formatSessionLabel(codeOrName) {
  if (!codeOrName) return ''
  const parsed = moment(codeOrName, ['HH:mm', 'H:mm', 'hh:mm A'], true)
  return parsed.isValid() ? parsed.format('hh:mm A') : codeOrName
}

function formatDuration(duration) {
  if (!duration?.value) return null
  const metric = String(duration.metric || '').toLowerCase()
  const value = duration.value
  if (metric.includes('day')) return `${value} day${value > 1 ? 's' : ''}`
  if (metric.includes('hour')) return `${value} hour${value > 1 ? 's' : ''}`
  if (metric.includes('min')) return `${value} min`
  return `${value} ${duration.metric}`
}

function getRateDetails(modality) {
  return modality?.rates?.[0]?.rate_details || []
}

function getRateDetailsForSession(modality, sessionCode = null) {
  const details = getRateDetails(modality)
  if (!details.length) return []
  if (!sessionCode) return details
  return details.filter((detail) =>
    (detail.sessions || []).some((s) => s.code === sessionCode)
  )
}

function getLanguagesForSession(modality, sessionCode = null) {
  const map = new Map()
  getRateDetailsForSession(modality, sessionCode).forEach((detail) => {
    ;(detail.languages || []).forEach((lang) => {
      if (lang?.code && !map.has(lang.code)) {
        map.set(lang.code, lang)
      }
    })
  })
  // Fallback to modality-level languages if rate details have none
  if (map.size === 0) {
    ;(modality?.languages || []).forEach((lang) => {
      if (lang?.code && !map.has(lang.code)) {
        map.set(lang.code, lang)
      }
    })
  }
  return Array.from(map.values())
}

function getRateDetail(modality, sessionCode = null, languageCode = null) {
  const sessionDetails = getRateDetailsForSession(modality, sessionCode)
  const details = sessionDetails.length ? sessionDetails : getRateDetails(modality)
  if (!details.length) return null

  if (languageCode) {
    const byLang = details.find((detail) =>
      (detail.languages || []).some((l) => l.code === languageCode)
    )
    if (byLang) return byLang

    // Rate with no languages listed can still match when only one option
    const noLang = details.find((detail) => !(detail.languages || []).length)
    if (noLang && details.length === 1) return noLang
  }

  return details[0]
}

function getCancellationPolicy(modality, sessionCode = null, languageCode = null) {
  return (
    getRateDetail(modality, sessionCode, languageCode)?.operation_dates?.[0]
      ?.cancellation_policies?.[0] || null
  )
}

/** Free-cancel deadline from activity-level policy + selected date (date only). */
function getFreeCancelDeadlineFromActivity(cancellationPolicy, selectedDate) {
  if (!cancellationPolicy || cancellationPolicy.cancel_policy === 'non-refundable') {
    return null
  }
  if (cancellationPolicy.cancel_policy !== 'refundable') return null

  const policies = cancellationPolicy.cancellation_policies || []
  if (!policies.length) return null

  const freePolicies = policies.filter((p) => Number(p?.value) === 0)
  if (!freePolicies.length) return null

  const hours = Math.max(...freePolicies.map((p) => Number(p.time_duration) || 0))
  const activityDate = moment(selectedDate)
  if (!activityDate.isValid()) return null

  return activityDate.clone().subtract(hours, 'hours')
}

function getPaxAmounts(modality, sessionCode = null, languageCode = null) {
  const fromRate = getRateDetail(modality, sessionCode, languageCode)?.pax_amounts
  if (fromRate?.length) return fromRate
  return modality?.amounts_from || []
}

function getFromAmount(modality, sessionCode = null, languageCode = null) {
  // If no language chosen, pick cheapest adult/from across language rates for this session
  if (!languageCode && sessionCode) {
    const details = getRateDetailsForSession(modality, sessionCode)
    if (details.length > 1) {
      let cheapest = null
      details.forEach((detail) => {
        const amounts = detail.pax_amounts || []
        const adult =
          amounts.find((a) => a.paxType === 'ADULT') ||
          amounts.find((a) => a.paxType === 'SENIOR') ||
          amounts.find((a) => Number(a.amount) > 0) ||
          amounts[0]
        if (
          adult?.amount != null &&
          (cheapest === null || Number(adult.amount) < Number(cheapest.amount))
        ) {
          cheapest = adult
        }
      })
      if (cheapest) return cheapest
    }
  }

  const amounts = getPaxAmounts(modality, sessionCode, languageCode)
  if (!amounts.length) return null

  const adult = amounts.find((a) => a.paxType === 'ADULT')
  if (adult) return adult

  const senior = amounts.find((a) => a.paxType === 'SENIOR')
  if (senior) return senior

  const paid = amounts.filter((a) => Number(a.amount) > 0)
  if (paid.length) {
    return paid.reduce((cheapest, a) =>
      Number(a.amount) < Number(cheapest.amount) ? a : cheapest
    )
  }

  return amounts[0]
}

function getAdultAmount(modality, sessionCode = null, languageCode = null) {
  return getFromAmount(modality, sessionCode, languageCode)
}

function getModalitySessions(modality) {
  const map = new Map()
  ;(modality?.sessions || []).forEach((s) => {
    if (s?.code && !map.has(s.code)) map.set(s.code, s)
  })
  getRateDetails(modality).forEach((detail) => {
    ;(detail.sessions || []).forEach((s) => {
      if (s?.code && !map.has(s.code)) map.set(s.code, s)
    })
  })
  return Array.from(map.values()).sort((a, b) => String(a.code).localeCompare(String(b.code)))
}

function formatAgeRange(ageFrom, ageTo) {
  if (ageFrom == null && ageTo == null) return ''
  const to = ageTo != null && ageTo >= 999 ? '99+' : ageTo
  if (ageFrom != null && to != null) return `(age ${ageFrom}–${to})`
  if (ageFrom != null) return `(age ${ageFrom}+)`
  return ''
}

function getPaxKey(pax) {
  return `${pax.paxType}_${pax.ageFrom ?? 'x'}_${pax.ageTo ?? 'x'}`
}

export default function ModalityOptions({
  modalities = [],
  currency,
  onProceed,
  selectedDate,
  maxPeople = 12,
  minPeople = 1,
  cancellationPolicy = null,
  /** Controlled session from Activity Timing (Availability) */
  selectedTime: controlledTime = undefined,
  onSelectTime = null,
  /** Hide internal time pills when Availability shows sessions */
  hideTimeSection = false,
}) {
  const [internalTime, setInternalTime] = useState(null)
  const [selectedCode, setSelectedCode] = useState(null)
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [quantities, setQuantities] = useState({})
  const [isNavigating, setIsNavigating] = useState(false)

  const isTimeControlled = typeof onSelectTime === 'function'
  const selectedTime = isTimeControlled ? controlledTime : internalTime
  const setSelectedTime = isTimeControlled ? onSelectTime : setInternalTime

  const allSessions = useMemo(() => {
    const map = new Map()
    modalities.forEach((m) => {
      getModalitySessions(m).forEach((s) => {
        if (s?.code && !map.has(s.code)) {
          map.set(s.code, s)
        }
      })
    })
    return Array.from(map.values()).sort((a, b) => String(a.code).localeCompare(String(b.code)))
  }, [modalities])

  useEffect(() => {
    if (isTimeControlled) return
    if (allSessions.length && !selectedTime) {
      setSelectedTime(allSessions[0].code)
    }
  }, [allSessions, selectedTime, isTimeControlled, setSelectedTime])

  // Show all modalities in list — each option has its own session/time
  const lowestPrice = useMemo(() => {
    let min = null
    modalities.forEach((m) => {
      const sessions = getModalitySessions(m)
      const sessionCode = sessions[0]?.code || null
      const from = getFromAmount(m, sessionCode)
      const amount = Number(from?.amount)
      if (Number.isFinite(amount) && (min === null || amount < min)) {
        min = amount
      }
    })
    return min
  }, [modalities])

  const selectedModality = useMemo(
    () => modalities.find((m) => m.code === selectedCode) || null,
    [modalities, selectedCode]
  )

  // Activity-level policy (same for all modalities) — modality rates often have no cancel data
  const sharedCancelDeadline = useMemo(() => {
    const fromActivity = getFreeCancelDeadlineFromActivity(cancellationPolicy, selectedDate)
    if (fromActivity) return fromActivity

    // Fallback: modality operation_dates dateFrom if present
    let earliest = null
    modalities.forEach((m) => {
      const sessions = getModalitySessions(m)
      const codes = sessions.length ? sessions.map((s) => s.code) : [null]
      codes.forEach((sessionCode) => {
        const policy = getCancellationPolicy(m, sessionCode, null)
        if (!policy?.dateFrom) return
        const d = moment(policy.dateFrom)
        if (!d.isValid()) return
        if (!earliest || d.isBefore(earliest)) earliest = d
      })
    })
    return earliest
  }, [cancellationPolicy, selectedDate, modalities])

  const modalitySessions = useMemo(
    () => (selectedModality ? getModalitySessions(selectedModality) : []),
    [selectedModality]
  )

  const availableLanguages = useMemo(() => {
    if (!selectedModality) return []
    return getLanguagesForSession(selectedModality, selectedTime)
  }, [selectedModality, selectedTime])

  // Keep selected language valid for current modality + session
  useEffect(() => {
    if (!selectedModality) {
      setSelectedLanguage(null)
      return
    }
    const langs = getLanguagesForSession(selectedModality, selectedTime)
    if (!langs.length) {
      setSelectedLanguage(null)
      return
    }
    const stillValid = langs.some((l) => l.code === selectedLanguage)
    if (!stillValid) {
      setSelectedLanguage(langs[0].code)
    }
  }, [selectedModality, selectedTime])

  const activePaxAmounts = useMemo(() => {
    if (!selectedModality) return []
    return getPaxAmounts(selectedModality, selectedTime, selectedLanguage)
  }, [selectedModality, selectedTime, selectedLanguage])

  const activeRateDetail = useMemo(() => {
    if (!selectedModality) return null
    return getRateDetail(selectedModality, selectedTime, selectedLanguage)
  }, [selectedModality, selectedTime, selectedLanguage])

  useEffect(() => {
    if (!selectedModality) return
    const initial = {}
    getPaxAmounts(selectedModality, selectedTime, selectedLanguage).forEach((pax) => {
      initial[getPaxKey(pax)] = pax.paxType === 'ADULT' ? 1 : 0
    })
    setQuantities(initial)

    const sessions = getModalitySessions(selectedModality)
    const stillValid = sessions.some((s) => s.code === selectedTime)
    if (!stillValid && sessions[0]?.code) {
      setSelectedTime(sessions[0].code)
    }
  }, [selectedModality])

  // Keep quantity keys in sync when session/language rates change
  useEffect(() => {
    if (!selectedModality) return
    setQuantities((prev) => {
      const next = {}
      getPaxAmounts(selectedModality, selectedTime, selectedLanguage).forEach((pax) => {
        const key = getPaxKey(pax)
        if (pax.paxType === 'ADULT') {
          next[key] = Math.max(1, prev[key] || 1)
        } else {
          next[key] = prev[key] || 0
        }
      })
      return next
    })
  }, [selectedModality, selectedTime, selectedLanguage])

  const totalAmount = useMemo(() => {
    if (!selectedModality) return 0
    return activePaxAmounts.reduce((sum, pax) => {
      const qty = quantities[getPaxKey(pax)] || 0
      return sum + qty * Number(pax.amount || 0)
    }, 0)
  }, [selectedModality, activePaxAmounts, quantities])

  const totalTickets = useMemo(
    () => Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0),
    [quantities]
  )

  const handleQtyChange = (paxKey, delta, paxType) => {
    setQuantities((prev) => {
      const currentTotal = Object.values(prev).reduce((sum, q) => sum + (q || 0), 0)
      const min = paxType === 'ADULT' ? 1 : 0
      const current = prev[paxKey] || 0

      if (delta > 0 && currentTotal >= maxPeople) {
        return prev
      }

      const next = Math.max(min, current + delta)
      return { ...prev, [paxKey]: next }
    })
  }

  const handleSelect = (modality) => {
    setSelectedCode(modality.code)
    const sessions = getModalitySessions(modality)
    const nextTime = sessions[0]?.code || null
    setSelectedTime(nextTime)
    const langs = getLanguagesForSession(modality, nextTime)
    setSelectedLanguage(langs[0]?.code || null)
  }

  const handleChangeSelection = () => {
    setSelectedCode(null)
    setSelectedLanguage(null)
    setQuantities({})
  }

  const handleNext = () => {
    if (isNavigating) return
    if (!selectedModality || totalTickets < minPeople) return
    if (modalitySessions.length > 0 && !selectedTime) return
    if (totalTickets > maxPeople) return
    if (availableLanguages.length > 0 && !selectedLanguage) return

    const rateDetail =
      activeRateDetail || getRateDetail(selectedModality, selectedTime, selectedLanguage)
    const paxAmounts = activePaxAmounts
    const languageObj =
      availableLanguages.find((l) => l.code === selectedLanguage) ||
      rateDetail?.languages?.[0] ||
      selectedModality.languages?.[0] ||
      null

    let adults = 0
    let children = 0
    let pricePerAdult = null
    let pricePerChild = null
    const selectedPax = []

    paxAmounts.forEach((pax) => {
      const qty = quantities[getPaxKey(pax)] || 0
      if (qty > 0) {
        selectedPax.push({ ...pax, quantity: qty })
      }
      if (pax.paxType === 'ADULT') {
        adults += qty
        if (pricePerAdult == null) pricePerAdult = pax.amount
      } else if (pax.paxType === 'CHILD' || pax.paxType === 'INFANT') {
        children += qty
        if (qty > 0 && pricePerChild == null) pricePerChild = pax.amount
      }
    })

    setIsNavigating(true)
    onProceed?.({
      modality: selectedModality,
      rate_key: rateDetail?.rate_key,
      session: selectedTime,
      language: languageObj,
      quantities: { ...quantities },
      selected_pax: selectedPax,
      adults,
      children,
      participants_total: totalAmount,
      price_per_adult: pricePerAdult,
      price_per_child: pricePerChild,
      cancellation_policies:
        cancellationPolicy?.cancellation_policies ||
        rateDetail?.operation_dates?.[0]?.cancellation_policies ||
        [],
      duration: selectedModality.duration,
    })
  }

  const renderCancellation = () => {
    if (!sharedCancelDeadline) {
      return (
        <div className={styles.cancelBlock}>
          <BiCalendarCheck size={20} className={styles.cancelIcon} />
          <div>
            <p className={styles.cancelTitle}>Cancellation policy available</p>
            <p className={styles.cancelText}>Check details before booking.</p>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.cancelBlock}>
        <BiCalendarCheck size={20} className={styles.cancelIcon} />
        <div>
          <p className={styles.cancelTitle}>Free cancellation available</p>
          <p className={styles.cancelText}>
            Cancel for free before {sharedCancelDeadline.format('MMMM D')} for a full refund
          </p>
        </div>
      </div>
    )
  }

  const renderSummary = (modality, sessionCode = null, languageCode = null) => {
    const duration = formatDuration(modality.duration)
    const sessionLangs = getLanguagesForSession(modality, sessionCode)
    const langs = languageCode
      ? sessionLangs
          .filter((l) => l.code === languageCode)
          .map((l) => l.description)
          .filter(Boolean)
      : sessionLangs.map((l) => l.description).filter(Boolean)
    const sessions = getModalitySessions(modality)
    const sessionLabel = sessionCode
      ? formatSessionLabel(
          sessions.find((s) => s.code === sessionCode)?.name || sessionCode
        )
      : sessions.map((s) => formatSessionLabel(s.name || s.code)).join(', ')

    const parts = []
    if (duration) parts.push(`Duration: ${duration}`)
    if (sessionLabel) parts.push(`Start: ${sessionLabel}`)
    if (langs.length) parts.push(`Language: ${langs.join(', ')}`)

    const summary = parts.join(' · ') || modality.name

    return (
      <div className={styles.detailRow}>
        <IoCheckmarkCircleOutline size={20} className={styles.detailIcon} />
        <p className={styles.detailText}>{summary}</p>
      </div>
    )
  }

  if (!modalities?.length) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.emptyState}>No activity options available.</div>
      </div>
    )
  }

  // Expanded selection view for one modality
  if (selectedModality) {
    return (
      <div className={styles.wrapper}>
        <div className={`${styles.card} ${styles.cardExpanded}`}>
          <div className={styles.cardHeader}>
            <h5 className={styles.cardTitle}>{selectedModality.name}</h5>
            <button type="button" className={styles.changeLink} onClick={handleChangeSelection}>
              Change selection
            </button>
          </div>

          {renderCancellation()}
          {renderSummary(selectedModality, selectedTime, selectedLanguage)}

          {!hideTimeSection && modalitySessions.length > 0 && (
            <div className={styles.timeSection}>
              <div className={styles.fieldLabel}>Select time</div>
              <div className={styles.timePills}>
                {modalitySessions.map((session) => (
                  <button
                    key={session.code}
                    type="button"
                    className={`${styles.timePill} ${
                      selectedTime === session.code ? styles.timePillActive : ''
                    }`}
                    onClick={() => setSelectedTime(session.code)}
                  >
                    {formatSessionLabel(session.name || session.code)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableLanguages.length > 0 && (
            <div className={styles.timeSection}>
              <div className={styles.fieldLabel}>Select language</div>
              <div className={styles.timePills}>
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className={`${styles.timePill} ${
                      selectedLanguage === lang.code ? styles.timePillActive : ''
                    }`}
                    onClick={() => setSelectedLanguage(lang.code)}
                  >
                    {lang.description || lang.code}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.fieldLabel}>How many tickets?</div>
          <p className={styles.ticketHint}>
            Min {minPeople} traveler{minPeople > 1 ? 's' : ''}. Select up to{' '}
            {maxPeople} traveler{maxPeople > 1 ? 's' : ''} in total.
          </p>
          <div className={styles.ticketList}>
            {activePaxAmounts.map((pax) => {
              const paxKey = getPaxKey(pax)
              const qty = quantities[paxKey] || 0
              const minQty = pax.paxType === 'ADULT' ? 1 : 0
              const atMax = totalTickets >= maxPeople
              return (
                <div key={paxKey} className={styles.ticketRow}>
                  <div>
                    <p className={styles.ticketLabel}>
                      {PAX_LABELS[pax.paxType] || pax.paxType}{' '}
                      {formatAgeRange(pax.ageFrom, pax.ageTo)}
                    </p>
                    <p className={styles.ticketPrice}>
                      <PriceDisplay price={pax.amount} currency={currency} />
                    </p>
                  </div>
                  <div className={styles.qtyBox}>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => handleQtyChange(paxKey, -1, pax.paxType)}
                      disabled={qty <= minQty}
                      aria-label={`Decrease ${paxKey}`}
                    >
                      −
                    </button>
                    <span className={styles.qtyValue}>{qty}</span>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => handleQtyChange(paxKey, 1, pax.paxType)}
                      disabled={atMax}
                      aria-label={`Increase ${paxKey}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {totalTickets >= maxPeople && (
            <p className={styles.maxReachedNote}>
              Maximum of {maxPeople} travelers reached.
            </p>
          )}

          <div className={styles.footer}>
            <div>
              <p className={styles.totalLabel}>
                Total <PriceDisplay price={totalAmount} currency={currency} />
              </p>
              <div className={styles.taxesNote}>Includes taxes and fees</div>
            </div>
            <button
              type="button"
              className={`${styles.nextBtn} ${isNavigating ? styles.nextBtnLoading : ''}`}
              onClick={handleNext}
              disabled={
                isNavigating ||
                totalTickets < minPeople ||
                (modalitySessions.length > 0 && !selectedTime) ||
                (availableLanguages.length > 0 && !selectedLanguage)
              }
            >
              {isNavigating ? (
                <>
                  <span
                    className={`spinner-border spinner-border-sm ${styles.nextBtnSpinner}`}
                    role="status"
                    aria-hidden="true"
                  />
                  <span className="visually-hidden">Loading...</span>
                </>
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className={styles.wrapper}>
      {lowestPrice != null && (
        <p className={styles.lowestPriceNote}>
          The lowest price (
          <strong>
            <PriceDisplay price={lowestPrice} currency={currency} />
          </strong>
          )
          {selectedDate
            ? ` is available on ${moment(selectedDate).format('MMM D')}`
            : ' is shown below'}
        </p>
      )}

      <div className={styles.cardList}>
        {modalities.length === 0 ? (
          <div className={styles.emptyState}>No options available.</div>
        ) : (
          modalities.map((modality) => {
            const modalitySession = getModalitySessions(modality)[0]?.code || null
            const fromPrice = getFromAmount(modality, modalitySession)

            return (
              <div key={modality.code} className={styles.card}>
                <h5 className={styles.cardTitle}>{modality.name}</h5>
                {renderCancellation()}
                {renderSummary(modality, modalitySession)}

                <div className={styles.priceRow}>
                  <div>
                    <div className={styles.priceFrom}>From</div>
                    <div className={styles.priceMain}>
                      <span className={styles.amount}>
                        <PriceDisplay price={fromPrice?.amount || 0} currency={currency} />
                      </span>
                    </div>
                    <div className={styles.taxesNote}>Includes taxes and fees</div>
                  </div>
                  <button
                    type="button"
                    className={styles.selectBtn}
                    onClick={() => handleSelect(modality)}
                  >
                    Select
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
