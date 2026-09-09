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

  const plainText = typeof rawText === 'string'
    && rawText.trim()
    && !rawText.trim().startsWith('{')
    && !rawText.trim().startsWith('[')
    ? rawText.trim()
    : null;

  if (policy?.cancel_policy === 'non-refundable') {
    return { text: 'Non-refundable', variant: 'negative' };
  }

  if (policy?.cancel_policy === 'refundable' && policy?.cancellation_policies?.length) {
    const sortedPolicies = [...policy.cancellation_policies].sort(
      (a, b) => b.time_duration - a.time_duration
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
