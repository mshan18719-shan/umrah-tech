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
    if (isDayEnabled(PackageDetail.open_hours, cursor)) {
      return cursor.clone().startOf('month');
    }
    cursor.add(1, 'day');
  }

  // No future open days — stay on current month (or activity start if still upcoming)
  if (activityStart.isAfter(today, 'month')) {
    return activityStart.clone().startOf('month');
  }

  return moment().startOf('month');
}

export default function Availability({ PackageDetail, setSelectedDate, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(() =>
    getBestCalendarMonth(PackageDetail, selectedDate)
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timingOpen, setTimingOpen] = useState(false);

  useEffect(() => {
    setCurrentMonth(getBestCalendarMonth(PackageDetail, selectedDate));
    // Intentionally depend on date bounds + selection only (not open_hours object identity),
    // so Prev/Next month browsing is not reset by parent re-renders.
  }, [PackageDetail?.start_date, PackageDetail?.end_date, selectedDate]);

  const calendarDates = useMemo(() => {
    if (!PackageDetail?.start_date || !PackageDetail?.end_date || !PackageDetail?.open_hours) {
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
      const dayInfo = PackageDetail.open_hours[dayName];
      const isCurrentMonth = currentDate.month() === currentMonth.month();
      const isInRange = currentDate.isBetween(activityStart, activityEnd, 'day', '[]');
      const isEnabled = dayInfo && (dayInfo.enabled === '1' || dayInfo.enabled === true);
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
  }, [PackageDetail, currentMonth]);

  const activityTiming = useMemo(() => {
    if (!PackageDetail?.open_hours) return null;

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
        start: start.format('h:mm A'),
        end: end.format('h:mm A'),
      };
    }

    return null;
  }, [PackageDetail, selectedDate, calendarDates]);

  const weeks = [];
  for (let i = 0; i < calendarDates.length; i += 7) {
    weeks.push(calendarDates.slice(i, i + 7));
  }

  const dateDisplay = selectedDate
    ? selectedDate.format('MM/DD/YYYY')
    : 'mm/dd/yyyy';

  const timingDisplay = activityTiming
    ? `${activityTiming.start} – ${activityTiming.end}`
    : 'START & End';

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
        // When opening, jump to a month that still has bookable dates
        setCurrentMonth(getBestCalendarMonth(PackageDetail, selectedDate));
      }
      return next;
    });
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
          onClick={() => setTimingOpen((open) => !open)}
          disabled={!activityTiming}
        >
          <FiClock className={styles.fieldIcon} />
          <span className={`${styles.fieldValue} ${activityTiming ? styles.fieldValueFilled : ''}`}>
            {timingDisplay}
          </span>
          <FiChevronDown className={`${styles.fieldChevron} ${timingOpen ? styles.fieldChevronOpen : ''}`} />
        </button>

        {timingOpen && activityTiming && (
          <div className={styles.timingPanel}>
            <div className={styles.timingGrid}>
              <div className={styles.timingBlock}>
                <div className={styles.timingBlockLabel}>Start</div>
                <div className={styles.timingBlockValue}>{activityTiming.start}</div>
              </div>
              <div className={styles.timingDuration}>
                {PackageDetail?.activity_duration}
              </div>
              <div className={styles.timingBlock}>
                <div className={styles.timingBlockLabel}>End</div>
                <div className={styles.timingBlockValue}>{activityTiming.end}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
