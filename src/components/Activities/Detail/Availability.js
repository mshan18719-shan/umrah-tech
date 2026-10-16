'use client';

import React, { useState, useMemo, useEffect } from 'react';
import moment from 'moment';
import { FiCalendar, FiClock, FiChevronDown } from 'react-icons/fi';
import styles from './BookingSidebar.module.css';

function isDayEnabled(openHours, date) {
  if (!openHours || !date) return false;
  const dayInfo = openHours[date.format('dddd').toLowerCase()];
  return Boolean(dayInfo && (dayInfo.enabled === '1' || dayInfo.enabled === true));
}

function formatSessionLabel(codeOrName) {
  if (!codeOrName) return '';
  const parsed = moment(codeOrName, ['HH:mm', 'H:mm', 'hh:mm A'], true);
  return parsed.isValid() ? parsed.format('h:mm A') : String(codeOrName);
}

/** Prefer selected date month, else first month with bookable days from today. */
function getBestCalendarMonth(PackageDetail, selectedDate) {
  if (selectedDate?.isValid?.()) {
    return selectedDate.clone().startOf('month');
  }

  if (!PackageDetail?.start_date || !PackageDetail?.end_date) {
    return moment().startOf('month');
  }

  const today = moment().startOf('day');
  const activityStart = moment(PackageDetail.start_date).startOf('day');
  const activityEnd = moment(PackageDetail.end_date).startOf('day');

  if (!activityStart.isValid() || !activityEnd.isValid()) {
    return moment().startOf('month');
  }

  let cursor = moment.max(today, activityStart).clone();

  while (cursor.isSameOrBefore(activityEnd, 'day')) {
    // Hotelbeds / modality activities may have no open_hours — treat in-range days as available
    if (!PackageDetail?.open_hours || isDayEnabled(PackageDetail.open_hours, cursor)) {
      return cursor.clone().startOf('month');
    }
    cursor.add(1, 'day');
  }

  if (activityStart.isAfter(today, 'month')) {
    return activityStart.clone().startOf('month');
  }

  return moment().startOf('month');
}

/**
 * @param sessions - modality sessions [{ code, name }] for hotelbeds / other providers
 * @param selectedSession - selected session code
 * @param onSelectSession - (code) => void
 */
export default function Availability({
  PackageDetail,
  setSelectedDate,
  selectedDate,
  sessions = [],
  selectedSession = null,
  onSelectSession,
}) {
  const [currentMonth, setCurrentMonth] = useState(() =>
    getBestCalendarMonth(PackageDetail, selectedDate)
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timingOpen, setTimingOpen] = useState(false);

  const hasOpenHours = Boolean(
    PackageDetail?.open_hours && Object.keys(PackageDetail.open_hours).length > 0
  );
  const sessionList = Array.isArray(sessions) ? sessions : [];
  const hasSessions = sessionList.length > 0;

  useEffect(() => {
    setCurrentMonth(getBestCalendarMonth(PackageDetail, selectedDate));
  }, [PackageDetail?.start_date, PackageDetail?.end_date, selectedDate]);

  // Auto-select first session when sessions load
  useEffect(() => {
    if (!hasSessions || !onSelectSession) return;
    const stillValid = sessionList.some((s) => s.code === selectedSession);
    if (!selectedSession || !stillValid) {
      onSelectSession(sessionList[0].code);
    }
  }, [hasSessions, sessionList, selectedSession, onSelectSession]);

  const calendarDates = useMemo(() => {
    if (!PackageDetail?.start_date || !PackageDetail?.end_date) {
      return [];
    }

    const startOfMonth = currentMonth.clone().startOf('month');
    const endOfMonth = currentMonth.clone().endOf('month');
    const activityStart = moment(PackageDetail.start_date);
    const activityEnd = moment(PackageDetail.end_date);
    const today = moment().startOf('day');
    const calendarStart = startOfMonth.clone().startOf('week');
    const calendarEnd = endOfMonth.clone().endOf('week');

    const dates = [];
    let currentDate = calendarStart.clone();

    while (currentDate.isSameOrBefore(calendarEnd)) {
      const dayName = currentDate.format('dddd').toLowerCase();
      const dayInfo = PackageDetail.open_hours?.[dayName];
      const isCurrentMonth = currentDate.month() === currentMonth.month();
      const isInRange = currentDate.isBetween(activityStart, activityEnd, 'day', '[]');
      const isEnabled = hasOpenHours
        ? Boolean(dayInfo && (dayInfo.enabled === '1' || dayInfo.enabled === true))
        : true; // no open_hours → allow any in-range day (hotelbeds)
      const isPast = currentDate.isBefore(today, 'day');

      let status = 'unavailable';
      if (isInRange && isEnabled && isCurrentMonth && !isPast) {
        status = 'available';
      }

      dates.push({
        date: currentDate.clone(),
        day: currentDate.format('D'),
        isCurrentMonth,
        status,
        openTime: dayInfo?.open,
        closeTime: dayInfo?.close,
      });

      currentDate.add(1, 'day');
    }

    return dates;
  }, [PackageDetail, currentMonth, hasOpenHours]);

  // Custom: open_hours start/end for selected day
  const openHoursTiming = useMemo(() => {
    if (!hasOpenHours) return null;

    let startTime = null;
    let endTime = null;

    if (selectedDate) {
      const dayName = selectedDate.format('dddd').toLowerCase();
      const dayInfo = PackageDetail.open_hours[dayName];
      if (dayInfo?.enabled === '1' || dayInfo.enabled === true) {
        startTime = dayInfo.open;
        endTime = dayInfo.close;
      }
    } else {
      const firstAvailableDate = calendarDates.find(
        (dateInfo) => dateInfo.status === 'available' && dateInfo.isCurrentMonth
      );
      if (firstAvailableDate) {
        startTime = firstAvailableDate.openTime;
        endTime = firstAvailableDate.closeTime;
      }
    }

    if (startTime && endTime) {
      const start = moment(startTime, 'HH:mm');
      const end = moment(endTime, 'HH:mm');
      return {
        kind: 'open_hours',
        start: start.format('h:mm A'),
        end: end.format('h:mm A'),
        startRaw: startTime,
        endRaw: endTime,
      };
    }

    return null;
  }, [PackageDetail, selectedDate, calendarDates, hasOpenHours]);

  const selectedSessionObj = useMemo(
    () => sessionList.find((s) => s.code === selectedSession) || null,
    [sessionList, selectedSession]
  );

  const sessionTiming = useMemo(() => {
    if (!hasSessions) return null;
    if (!selectedSessionObj) {
      return {
        kind: 'session',
        label: 'Select time',
        start: null,
        end: null,
      };
    }
    const label = formatSessionLabel(selectedSessionObj.name || selectedSessionObj.code);
    return {
      kind: 'session',
      label,
      start: label,
      end: null,
      code: selectedSessionObj.code,
    };
  }, [hasSessions, selectedSessionObj]);

  // Prefer open_hours when present; otherwise modality sessions
  const activityTiming = openHoursTiming || sessionTiming;

  const weeks = [];
  for (let i = 0; i < calendarDates.length; i += 7) {
    weeks.push(calendarDates.slice(i, i + 7));
  }

  const dateDisplay = selectedDate
    ? selectedDate.format('MM/DD/YYYY')
    : 'mm/dd/yyyy';

  const timingDisplay = (() => {
    if (!activityTiming) return 'START & End';
    if (activityTiming.kind === 'session') {
      return activityTiming.start || 'Select time';
    }
    return `${activityTiming.start} – ${activityTiming.end}`;
  })();

  const timingEnabled = Boolean(
    openHoursTiming || (hasSessions && sessionList.length > 0)
  );

  const handleDateSelect = (dateInfo) => {
    if (!dateInfo?.date || dateInfo.date.isBefore(moment(), 'day')) return;
    if (dateInfo.status !== 'available') return;
    setSelectedDate(dateInfo.date);
    setCalendarOpen(false);
  };

  const handleCalendarToggle = () => {
    setCalendarOpen((open) => {
      const next = !open;
      if (next) {
        setCurrentMonth(getBestCalendarMonth(PackageDetail, selectedDate));
        setTimingOpen(false);
      }
      return next;
    });
  };

  const handleTimingToggle = () => {
    if (!timingEnabled) return;
    setTimingOpen((open) => {
      const next = !open;
      if (next) setCalendarOpen(false);
      return next;
    });
  };

  const handleSessionPick = (code) => {
    onSelectSession?.(code);
    setTimingOpen(false);
  };

  return (
    <>
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Check Availability</span>
        <button
          type="button"
          className={`${styles.fieldTrigger} ${calendarOpen ? styles.fieldTriggerOpen : ''}`}
          onClick={handleCalendarToggle}
        >
          <FiCalendar className={styles.fieldIcon} />
          <span className={`${styles.fieldValue} ${selectedDate ? styles.fieldValueFilled : ''}`}>
            {dateDisplay}
          </span>
          <FiChevronDown className={`${styles.fieldChevron} ${calendarOpen ? styles.fieldChevronOpen : ''}`} />
        </button>

        {calendarOpen && (
          <div className={styles.calendarPanel}>
            <div className={styles.monthNav}>
              <button type="button" className={styles.monthNavBtn} onClick={() => setCurrentMonth(currentMonth.clone().subtract(1, 'month'))}>
                ‹ Prev
              </button>
              <span className={styles.monthLabel}>{currentMonth.format('MMM YYYY')}</span>
              <button type="button" className={styles.monthNavBtn} onClick={() => setCurrentMonth(currentMonth.clone().add(1, 'month'))}>
                Next ›
              </button>
            </div>

            <div className={styles.dayHeaders}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className={styles.dayHeader}>{day}</div>
              ))}
            </div>

            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className={styles.weekRow}>
                {week.map((dateInfo, dayIndex) => {
                  const isAvailable = dateInfo.isCurrentMonth && dateInfo.status === 'available';
                  const isSelected = selectedDate && dateInfo.date.isSame(selectedDate, 'day');

                  return (
                    <div
                      key={dayIndex}
                      className={[
                        styles.dayCell,
                        !dateInfo.isCurrentMonth || dateInfo.status !== 'available' ? styles.dayCellDisabled : styles.dayCellAvailable,
                        isSelected ? styles.dayCellSelected : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => isAvailable && handleDateSelect(dateInfo)}
                      onKeyDown={(e) => {
                        if (isAvailable && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          handleDateSelect(dateInfo);
                        }
                      }}
                      role={isAvailable ? 'button' : undefined}
                      tabIndex={isAvailable ? 0 : -1}
                    >
                      <span className={styles.dayNumber}>{dateInfo.day}</span>
                      {isAvailable && !isSelected && (
                        <span className={styles.dayStatus}>Open</span>
                      )}
                      {isSelected && (
                        <span className={styles.dayStatus}>Selected</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#3b82c4' }} />
                Available
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#1b3b6f' }} />
                Selected
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Activity Timing</span>
        <button
          type="button"
          className={`${styles.fieldTrigger} ${timingOpen ? styles.fieldTriggerOpen : ''}`}
          onClick={handleTimingToggle}
          disabled={!timingEnabled}
        >
          <FiClock className={styles.fieldIcon} />
          <span
            className={`${styles.fieldValue} ${
              (openHoursTiming || selectedSessionObj) ? styles.fieldValueFilled : ''
            }`}
          >
            {timingDisplay}
          </span>
          <FiChevronDown className={`${styles.fieldChevron} ${timingOpen ? styles.fieldChevronOpen : ''}`} />
        </button>

        {timingOpen && openHoursTiming && (
          <div className={styles.timingPanel}>
            <div className={styles.timingGrid}>
              <div className={styles.timingBlock}>
                <div className={styles.timingBlockLabel}>Start</div>
                <div className={styles.timingBlockValue}>{openHoursTiming.start}</div>
              </div>
              <div className={styles.timingDuration}>
                {PackageDetail?.activity_duration}
              </div>
              <div className={styles.timingBlock}>
                <div className={styles.timingBlockLabel}>End</div>
                <div className={styles.timingBlockValue}>{openHoursTiming.end}</div>
              </div>
            </div>
          </div>
        )}

        {timingOpen && hasSessions && !openHoursTiming && (
          <div className={styles.timingPanel}>
            <div className={styles.sessionList}>
              {sessionList.map((session) => {
                const label = formatSessionLabel(session.name || session.code);
                const isActive = selectedSession === session.code;
                return (
                  <button
                    key={session.code}
                    type="button"
                    className={`${styles.sessionOption} ${isActive ? styles.sessionOptionActive : ''}`}
                    onClick={() => handleSessionPick(session.code)}
                  >
                    <FiClock size={14} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
