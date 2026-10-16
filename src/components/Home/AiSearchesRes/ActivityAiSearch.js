'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import moment from 'moment'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { RiRobot2Line } from 'react-icons/ri'
import styles from '../Search/ai.module.css'

const slugifyCity = (name) =>
  String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')

export function resolveActivityDate(searchResponse) {
  const raw = searchResponse?.activityDate || searchResponse?.date || ''
  if (!raw) return null
  const parsed = moment(
    raw,
    ['YYYY-MM-DD', 'DD-MM-YYYY', 'D MMM YYYY', 'D MMMM YYYY', moment.ISO_8601],
    true
  )
  if (parsed.isValid()) return parsed.format('YYYY-MM-DD')
  const fallback = moment(raw)
  return fallback.isValid() ? fallback.format('YYYY-MM-DD') : null
}

export function resolveCityLabel(searchResponse) {
  return (
    searchResponse?.city ||
    searchResponse?.destination?.city ||
    searchResponse?.destinationCity ||
    searchResponse?.city_name ||
    ''
  ).trim()
}

export function resolveCountry(searchResponse, matchedDest = null) {
  return (
    matchedDest?.country ||
    searchResponse?.country ||
    searchResponse?.destination?.country ||
    searchResponse?.destination?.countryCode ||
    ''
  ).trim()
}

export function hasActivitiesSearchReady(searchResponse) {
  return Boolean(resolveCityLabel(searchResponse) && resolveActivityDate(searchResponse))
}

/** Same query string ActivitySearch uses for listing results. */
export function buildActivitiesSearchHref(searchResponse, matchedDest = null) {
  const cityLabel = resolveCityLabel(searchResponse)
  const date = resolveActivityDate(searchResponse)
  if (!cityLabel || !date) return null

  const citySlug = matchedDest?.city_slug || slugifyCity(cityLabel)
  if (!citySlug) return null

  const queryParams = new URLSearchParams()
  queryParams.append('city', citySlug)
  queryParams.append('date', date)

  const country = resolveCountry(searchResponse, matchedDest)
  if (country) queryParams.append('country', country)

  // Cache-bust so listing always refetches (matches ActivitySearch)
  queryParams.set('_ts', String(Date.now()))
  return `/activities?${queryParams.toString()}`
}

/**
 * Navigate to /activities with the same params as ActivitySearch.
 * Does not wait on destinations API — AI already provides city/date/country.
 */
export default function ActivityAiSearch({ searchResponse }) {
  const router = useRouter()
  const navigatedRef = useRef(false)

  useEffect(() => {
    if (!searchResponse || navigatedRef.current) return

    const href = buildActivitiesSearchHref(searchResponse)
    if (!href) return

    navigatedRef.current = true
    router.push(href)
  }, [searchResponse, router])

  return (
    <div className={styles.aiResponseBox}>
      <div className={styles.aiLoadingWrapper}>
        <AiOutlineLoading3Quarters className={styles.aiLoadingIcon} size={22} />
        <span className="ms-2">
          <RiRobot2Line size={16} className="me-1" />
          Opening activities for {resolveCityLabel(searchResponse) || 'your search'}…
        </span>
      </div>
    </div>
  )
}
