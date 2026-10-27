import moment from 'moment';

export const parseCancellationPolicy = (value) => {
  if (!value) return null;

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    }
  }

  return null;
};

export const resolveCancellationPolicy = (rawPolicy, rawText) => (
  parseCancellationPolicy(rawPolicy) || parseCancellationPolicy(rawText)
);

/** Prefer activity policy; fall back to modality policies when needed. */
export const resolveCancellationPolicies = (activityDetail) => {
  const activityPolicy = activityDetail?.cancellation_policy;
  const activityList = Array.isArray(activityPolicy?.cancellation_policies)
    ? activityPolicy.cancellation_policies
    : [];
  const modalityList = Array.isArray(activityDetail?.modality?.cancellation_policies)
    ? activityDetail.modality.cancellation_policies
    : [];

  const hasUsableActivityPolicy = activityList.some(
    (p) =>
      p?.time_duration != null ||
      p?.timeDuration != null ||
      p?.hoursBefore != null ||
      p?.hours != null ||
      p?.from != null ||
      p?.dateFrom != null ||
      p?.type != null ||
      p?.amount != null
  );

  return {
    cancel_policy:
      activityPolicy?.cancel_policy || (modalityList.length ? 'refundable' : null),
    cancellation_policies: hasUsableActivityPolicy ? activityList : modalityList,
  };
};

export const getPolicyDeadline = (policy) =>
  policy?.from || policy?.dateFrom || null;

/** Parse from/dateFrom as UTC so "2026-10-21T23:59:00Z" stays Oct 21. */
export const parsePolicyDateUtc = (raw) => {
  if (!raw) return null;
  const d = moment.utc(raw);
  return d.isValid() ? d : null;
};

export const formatDeadlineDate = (policy) => {
  const deadlineRaw = getPolicyDeadline(policy);
  if (!deadlineRaw) return null;
  const d = parsePolicyDateUtc(deadlineRaw) || moment(deadlineRaw);
  return d.isValid() ? d.format('D MMM YYYY') : null;
};

/** True when a charged fee window has already started. */
export const isChargeWindowActive = (policies = []) => {
  const now = moment.utc();
  const charged = policies
    .map((p) => {
      const amount = Number(p?.amount ?? p?.original_amount ?? 0);
      if (!(amount > 0)) return null;
      const d = parsePolicyDateUtc(getPolicyDeadline(p));
      return d ? { date: d, amount } : null;
    })
    .filter(Boolean);
  if (!charged.length) return false;
  const earliest = charged.reduce((a, b) => (a.date.isBefore(b.date) ? a : b));
  return !now.isBefore(earliest.date);
};

/**
 * Top-level activity cancellation display.
 * Returns { kind: 'free', deadlineLabel } | { kind: 'non-refundable' }.
 */
export const getCancellationDisplay = (cancellationPolicy, selectedDate = null) => {
  if (!cancellationPolicy || cancellationPolicy.cancel_policy === 'non-refundable') {
    return { kind: 'non-refundable' };
  }
  if (cancellationPolicy.cancel_policy !== 'refundable') {
    return { kind: 'non-refundable' };
  }

  const policies = cancellationPolicy.cancellation_policies || [];
  if (!policies.length) return { kind: 'non-refundable' };

  const dated = policies
    .map((p) => {
      const raw = p?.from || p?.dateFrom;
      if (!raw) return null;
      const d = moment.utc(raw);
      if (!d.isValid()) return null;
      return {
        date: d,
        amount: Number(p.amount ?? p.original_amount ?? 0),
      };
    })
    .filter(Boolean);

  if (dated.length) {
    const now = moment.utc();
    const charged = dated.filter((p) => p.amount > 0);
    if (charged.length) {
      const earliestCharge = charged.reduce((a, b) =>
        a.date.isBefore(b.date) ? a : b
      );
      if (!now.isBefore(earliestCharge.date)) {
        return { kind: 'non-refundable' };
      }
      return {
        kind: 'free',
        deadlineLabel: earliestCharge.date.format('MMMM D'),
      };
    }
    const earliest = dated.reduce((a, b) => (a.date.isBefore(b.date) ? a : b));
    return { kind: 'free', deadlineLabel: earliest.date.format('MMMM D') };
  }

  const freePolicies = policies.filter((p) => Number(p?.value) === 0);
  if (!freePolicies.length) return { kind: 'non-refundable' };

  const hours = Math.max(...freePolicies.map((p) => Number(p.time_duration) || 0));
  const activityDate = moment(selectedDate);
  if (!activityDate.isValid()) return { kind: 'non-refundable' };

  const deadline = activityDate.clone().subtract(hours, 'hours');
  if (!moment().isBefore(deadline)) {
    return { kind: 'non-refundable' };
  }
  return { kind: 'free', deadlineLabel: deadline.format('MMMM D') };
};

export const getPolicyHours = (policy, travelDate, sessionCode) => {
  const raw =
    policy?.time_duration ??
    policy?.timeDuration ??
    policy?.hoursBefore ??
    policy?.hours;
  const hours = Number(raw);
  if (Number.isFinite(hours) && hours >= 0) return hours;

  const deadlineRaw = getPolicyDeadline(policy);
  if (!deadlineRaw || !travelDate) return null;

  const deadline = moment(deadlineRaw);
  if (!deadline.isValid()) return null;

  let activityStart = moment(travelDate);
  if (!activityStart.isValid()) return null;

  if (sessionCode) {
    const session = moment(sessionCode, ['HH:mm', 'H:mm', 'hh:mm A'], true);
    if (session.isValid()) {
      activityStart = activityStart
        .hour(session.hour())
        .minute(session.minute())
        .second(0);
    }
  }

  return Math.max(0, activityStart.diff(deadline, 'hours'));
};

export const formatPolicyTimeText = (policy, travelDate, sessionCode) => {
  const deadlineLabel = formatDeadlineDate(policy);
  if (
    deadlineLabel &&
    (policy?.from || policy?.dateFrom) &&
    policy?.time_duration == null
  ) {
    return `From ${deadlineLabel}`;
  }

  const hours = getPolicyHours(policy, travelDate, sessionCode);
  if (hours != null) {
    if (hours >= 24) {
      const days = hours / 24;
      const wholeDays = Number.isInteger(days) ? days : Math.round(days * 10) / 10;
      return `${wholeDays} day${wholeDays > 1 ? 's' : ''} before activity`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} before activity`;
  }

  if (deadlineLabel) return `From ${deadlineLabel}`;
  return 'Before activity';
};

export const isFromAmountPolicyStyle = (policies = []) =>
  Array.isArray(policies) &&
  policies.length > 0 &&
  policies.every(
    (p) =>
      (p?.from || p?.dateFrom) &&
      p?.time_duration == null &&
      p?.type == null
  );

/** Never expose fee amounts — free when available, otherwise non-refundable (GTM parity). */
export const getPolicyCharge = (policy) => {
  if (policy?.type === 'percentage') {
    const value = Number(policy.value);
    const isFree = value === 0;
    return {
      kind: 'percentage',
      value,
      refundText: isFree ? 'Free' : 'Non refundable',
      refundDescription: isFree
        ? 'Full refund. No cancellation fee.'
        : 'This booking is non refundable.',
      refundAmount: null,
      isFree,
      isFullCharge: !isFree,
    };
  }

  if (policy?.type === 'fixed') {
    const isFree = Number(policy.value) === 0;
    return {
      kind: 'fixed',
      value: policy.value,
      refundText: isFree ? 'Free' : 'Non refundable',
      refundDescription: isFree
        ? 'Full refund. No cancellation fee.'
        : 'This booking is non refundable.',
      refundAmount: null,
      isFree,
      isFullCharge: !isFree,
    };
  }

  // API style: { from, amount, original_amount } — never show fee amounts
  if (policy?.amount != null || getPolicyDeadline(policy)) {
    const amount = Number(policy.amount ?? policy.original_amount ?? 0);
    const deadlineLabel = formatDeadlineDate(policy);
    if (!Number.isFinite(amount) || amount === 0) {
      return {
        kind: 'fixed',
        value: 0,
        refundText: 'Free',
        refundDescription: deadlineLabel
          ? `Cancel free until ${deadlineLabel} and get a full refund.`
          : 'Cancel free until this date and get a full refund.',
        refundAmount: null,
        isFree: true,
        isFullCharge: false,
      };
    }
    return {
      kind: 'fixed',
      value: amount,
      refundText: 'Non refundable',
      refundDescription: deadlineLabel
        ? `On or after ${deadlineLabel}, this booking is non refundable.`
        : 'This booking is non refundable.',
      refundAmount: null,
      isFree: false,
      isFullCharge: true,
    };
  }

  return {
    kind: null,
    value: null,
    refundText: '',
    refundDescription: '',
    refundAmount: null,
    isFree: false,
    isFullCharge: false,
  };
};

const formatPolicyDuration = (duration) => {
  const hours = Number(duration);
  if (Number.isNaN(hours)) return '';

  if (hours >= 24) {
    const days = hours / 24;
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours > 1 ? 's' : ''}`;
};

export const getCancellationSummary = (rawPolicy, rawText, selectedDate = null) => {
  const policy = resolveCancellationPolicy(rawPolicy, rawText);

  const plainText =
    typeof rawText === 'string' &&
    rawText.trim() &&
    !rawText.trim().startsWith('{') &&
    !rawText.trim().startsWith('[')
      ? rawText.trim()
      : null;

  if (policy?.cancel_policy === 'non-refundable') {
    return { text: 'Non-refundable', variant: 'negative' };
  }

  if (policy?.cancel_policy === 'refundable' && policy?.cancellation_policies?.length) {
    const display = getCancellationDisplay(policy, selectedDate);
    if (display.kind === 'free') {
      return {
        text: display.deadlineLabel
          ? `Free cancellation available before ${display.deadlineLabel}`
          : 'Free cancellation available',
        variant: 'positive',
      };
    }
    return { text: 'Non-refundable', variant: 'negative' };
  }

  if (plainText) {
    return { text: plainText, variant: 'positive' };
  }

  return { text: 'Free cancellation available', variant: 'positive' };
};
