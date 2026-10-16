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

export const formatDeadlineDate = (policy) => {
  const deadlineRaw = getPolicyDeadline(policy);
  if (!deadlineRaw) return null;
  const d = moment(deadlineRaw);
  return d.isValid() ? d.format('D MMM YYYY') : null;
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

export const getPolicyCharge = (policy) => {
  if (policy?.type === 'percentage') {
    const value = Number(policy.value);
    const refundPercentage = 100 - value;
    return {
      kind: 'percentage',
      value,
      refundText: `${value}% Charge`,
      refundDescription: `${value}% cancellation charge applies. You will receive ${refundPercentage}% of the total booking amount back.`,
      refundAmount: null,
      isFree: value === 0,
      isFullCharge: value === 100,
    };
  }

  if (policy?.type === 'fixed') {
    return {
      kind: 'fixed',
      value: policy.value,
      refundText: 'Cancellation Fee',
      refundDescription: 'A fixed cancellation fee will be charged.',
      refundAmount: policy.value,
      isFree: Number(policy.value) === 0,
      isFullCharge: false,
    };
  }

  // API style: { from, amount, original_amount }
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
      refundText: 'Fee applies',
      refundDescription: deadlineLabel
        ? `If you cancel on or after ${deadlineLabel}, this fee will be charged.`
        : 'If you cancel on or after this date, this fee will be charged.',
      refundAmount: amount,
      isFree: false,
      isFullCharge: false,
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

export const getCancellationSummary = (rawPolicy, rawText) => {
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
    const policies = policy.cancellation_policies;

    if (isFromAmountPolicyStyle(policies)) {
      const first = policies[0];
      const dateLabel = formatDeadlineDate(first);
      return {
        text: dateLabel
          ? `Free cancellation available before ${dateLabel}`
          : 'Free cancellation available',
        variant: 'positive',
      };
    }

    const sortedPolicies = [...policies].sort(
      (a, b) => Number(b.time_duration || 0) - Number(a.time_duration || 0)
    );
    const freePolicy = sortedPolicies.find(
      (item) => item.type === 'percentage' && Number(item.value) === 0
    );

    if (freePolicy) {
      const durationText = formatPolicyDuration(freePolicy.time_duration);
      return {
        text: durationText
          ? `Free cancellation up to ${durationText}`
          : 'Free cancellation available',
        variant: 'positive',
      };
    }

    return { text: 'Cancellation policy applies', variant: 'positive' };
  }

  if (plainText) {
    return { text: plainText, variant: 'positive' };
  }

  return { text: 'Free cancellation available', variant: 'positive' };
};
