/** Codes already covered by lead/guest info — hide these on voucher/invoice. */
const LEAD_COVERED_CODES = new Set([
  'EMAIL',
  'EMAILCONTACTO',
  'EMAILADDRESS',
  'MAIL',
  'PHONENUMBER',
  'PHONE',
  'TELEPHONE',
  'TEL',
  'NCCTEL',
  'TLFCONTACTO',
  'CONTACTPHONE',
  'CONTACTNUMBER',
  'ADDRESS',
  'HOLDERADDRESS',
  'FIRSTNAME',
  'LASTNAME',
  'SURNAME',
  'NAME',
  'HOLDERNAME',
  'TITLE',
  'COUNTRY',
]);

const CODE_LABELS = {
  HOTEL: 'Hotel Name',
  HOTELADDRESS: 'Hotel Address',
  DIRECCIONHTL: 'Hotel Address',
  PICKUP: 'Pickup Point',
  PICKUPPOINT: 'Pickup Point',
  FLIGHTNUMBER: 'Flight Number',
  FLIGHTNO: 'Flight Number',
};

function normalizeQuestionCode(code) {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function formatCodeLabel(code) {
  return String(code || '')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Question answers that are not already shown in lead/guest info
 * (e.g. hotel name / hotel address). Supports `questions_answers` and `question_answers`.
 */
export function getDisplayQuestionAnswers(booking) {
  const raw =
    booking?.questions_answers ||
    booking?.question_answers ||
    [];

  if (!Array.isArray(raw) || !raw.length) return [];

  return raw
    .filter((q) => q?.answer != null && String(q.answer).trim() !== '')
    .filter((q) => !LEAD_COVERED_CODES.has(normalizeQuestionCode(q.code)))
    .map((q) => {
      const key = normalizeQuestionCode(q.code);
      const label =
        (typeof q.text === 'string' && q.text.trim()) ||
        CODE_LABELS[key] ||
        formatCodeLabel(q.code);
      return {
        code: q.code,
        label,
        answer: String(q.answer).trim(),
      };
    });
}
