'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Select } from '@mantine/core';
import { HiOutlineUser } from 'react-icons/hi2';
import { notifications } from '@mantine/notifications';
import moment from 'moment';
import { countryListLocal } from '@/util/CountryList';
import styles from './EditPassengerModal.module.css';

const emptyForm = {
  first_name: '',
  last_name: '',
  nationality: '',
  gender: 'M',
  type: 'adult',
  birthday: '',
  card_type: 'P',
  card_num: '',
  card_expired_date: '',
};

function mapPassengerToForm(passenger) {
  const genderRaw = String(passenger?.gender || '').toLowerCase();
  const gender =
    genderRaw === 'f' || genderRaw === 'female' ? 'F' : 'M';

  const typeRaw = String(passenger?.type || passenger?.psgType || 'adult').toLowerCase();
  let type = 'adult';
  if (typeRaw === 'child' || typeRaw === 'chd') type = 'child';
  else if (typeRaw === 'infant' || typeRaw === 'inf' || typeRaw.includes('infant')) type = 'infant';

  return {
    first_name: passenger?.firstName || '',
    last_name: passenger?.lastName || '',
    nationality: String(passenger?.nationality || '').toUpperCase(),
    gender,
    type,
    birthday: passenger?.dateOfBirth
      ? moment(passenger.dateOfBirth).format('YYYY-MM-DD')
      : '',
    card_type: passenger?.cardType || 'P',
    card_num: passenger?.cardNum || '',
    card_expired_date: passenger?.cardExpiredDate
      ? moment(passenger.cardExpiredDate).format('YYYY-MM-DD')
      : '',
  };
}

function resolvePassengerIndex(passenger, listIndex) {
  // Booking details usually store 1-based passengerIndex; change API uses 0-based.
  if (passenger?.passengerIndex != null && passenger.passengerIndex !== '') {
    const raw = Number(passenger.passengerIndex);
    if (Number.isFinite(raw)) {
      return raw > 0 ? raw - 1 : raw;
    }
  }
  return listIndex;
}

function typeLabel(type) {
  if (type === 'child') return 'Child';
  if (type === 'infant') return 'Infant';
  return 'Adult';
}

export default function EditPassengerModal({
  opened,
  onClose,
  bookingReference,
  provider,
  passengers: initialPassengers = [],
  onSuccess,
}) {
  const nationalityOptions = useMemo(
    () =>
      countryListLocal.item
        .map((c) => ({
          value: c.cca2,
          label: `${c.name.common} (${c.cca2})`,
        }))
        .filter((c) => c.value)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  const [passengers, setPassengers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [remark, setRemark] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [saved, setSaved] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [changeOrderNum, setChangeOrderNum] = useState('');

  useEffect(() => {
    if (!opened) return;

    setSelectedIndex(null);
    setForm(emptyForm);
    setRemark('');
    setErrors({});
    setApiError('');
    setSaved(false);
    setSuccessMessage('');
    setChangeOrderNum('');

    async function loadPassengers() {
      if (Array.isArray(initialPassengers) && initialPassengers.length) {
        setPassengers(initialPassengers);
        return;
      }

      if (!bookingReference) {
        setPassengers([]);
        return;
      }

      setLoadingList(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/flights/booking/details`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking_reference: bookingReference }),
          },
        );
        const data = await res.json();
        if (data?.success) {
          setPassengers(data?.data?.passenger_details || []);
        } else {
          setPassengers([]);
          setApiError(data?.message || 'Unable to load passengers.');
        }
      } catch {
        setPassengers([]);
        setApiError('Unable to load passengers. Please try again.');
      } finally {
        setLoadingList(false);
      }
    }

    loadPassengers();
  }, [opened, bookingReference, initialPassengers]);

  const handleClose = () => {
    if (saving) return;
    onClose?.();
  };

  const startEdit = (index) => {
    const passenger = passengers[index];
    setSelectedIndex(index);
    setForm(mapPassengerToForm(passenger));
    setRemark('');
    setErrors({});
    setApiError('');
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const next = {};
    if (!form.first_name?.trim()) next.first_name = 'First name is required';
    if (!form.last_name?.trim()) next.last_name = 'Last name is required';
    if (!form.nationality) next.nationality = 'Nationality is required';
    if (!form.gender) next.gender = 'Gender is required';
    if (!form.type) next.type = 'Passenger type is required';
    if (!form.birthday) next.birthday = 'Date of birth is required';
    if (!form.card_type) next.card_type = 'ID type is required';
    if (!form.card_num?.trim()) next.card_num = 'ID number is required';
    if (!form.card_expired_date) next.card_expired_date = 'ID Expiry date is required';
    if (!remark.trim()) next.remark = 'Please add a remark for this change';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (selectedIndex == null) return;

    const passenger = passengers[selectedIndex];
    const passenger_index = resolvePassengerIndex(passenger, selectedIndex);

    const payload = {
      provider,
      booking_reference: bookingReference,
      remark: remark.trim(),
      passengers: [
        {
          passenger_index,
          change: {
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            nationality: form.nationality,
            gender: form.gender,
            type: form.type,
            birthday: form.birthday,
            card_type: form.card_type,
            card_num: form.card_num.trim(),
            card_expired_date: form.card_expired_date,
          },
        },
      ],
    };

    setSaving(true);
    setApiError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/flights/booking/change/passenger/info`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (res.ok && data?.success !== false) {
        const message =
          data?.message ||
          data?.data?.errorMsg ||
          'Passenger change request submitted';
        const orderNum =
          data?.data?.data?.orderNum ||
          data?.data?.orderNum ||
          '';

        setSuccessMessage(message);
        setChangeOrderNum(orderNum);
        setSaved(true);
        notifications.show({
          title: 'Request submitted',
          message,
          color: 'green',
          autoClose: 3500,
        });
        onSuccess?.(bookingReference, data);
      } else {
        setApiError(
          data?.message ||
            data?.error?.message ||
            data?.data?.errorMsg ||
            'Failed to submit passenger change request. Please try again.',
        );
      }
    } catch {
      setApiError('A network error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const editing = selectedIndex != null && !saved;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <div className={styles.titleRow}>
          <span className={styles.titleIcon} aria-hidden>
            <HiOutlineUser size={18} />
          </span>
          <h2 className={styles.titleText}>Edit Passenger</h2>
        </div>
      }
      centered
      size="lg"
      radius="md"
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      classNames={{
        content: `${styles.root} ${styles.modalContent}`,
        header: styles.modalHeader,
        title: styles.modalTitle,
        body: styles.modalBody,
        close: styles.modalClose,
      }}
    >
      {saved ? (
        <div className={styles.successBox}>
          <div className={styles.successIcon}>✓</div>
          <h6 className={styles.successTitle}>Request Submitted</h6>
          <p className={styles.successMsg}>
            {successMessage || 'Passenger change request submitted'}
          </p>
          <p className={styles.successMeta}>
            Booking <strong>{bookingReference}</strong>
            {changeOrderNum ? (
              <>
                {' '}
                · Change order <strong>{changeOrderNum}</strong>
              </>
            ) : null}
            . Your request is pending airline confirmation and is not applied yet.
          </p>
          <button type="button" className={styles.btnPrimary} onClick={handleClose}>
            Close
          </button>
        </div>
      ) : (
        <>
          {apiError && <div className={styles.errorBanner}>{apiError}</div>}

          {!editing ? (
            <>
              <p className={styles.hint}>
                Select a passenger to update name, nationality, document, or date of birth.
              </p>
              {loadingList ? (
                <div className={styles.emptyState}>Loading passengers…</div>
              ) : passengers.length === 0 ? (
                <div className={styles.emptyState}>No passengers found for this booking.</div>
              ) : (
                <div className={styles.passengerList}>
                  {passengers.map((passenger, index) => (
                    <div key={passenger.passengerIndex ?? index} className={styles.passengerCard}>
                      <div className={styles.passengerMeta}>
                        <p className={styles.passengerName}>
                          {(passenger.title || '').toUpperCase()} {passenger.firstName}{' '}
                          {passenger.lastName}
                        </p>
                        <p className={styles.passengerSub}>
                          {passenger.email || '—'}
                          {passenger.cardNum ? ` · Doc: ${passenger.cardNum}` : ''}
                        </p>
                        <span className={styles.typeBadge}>
                          {typeLabel(String(passenger.type || 'adult').toLowerCase())}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => startEdit(index)}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className={styles.actions}>
                <button type="button" className={styles.btnSecondary} onClick={handleClose}>
                  Close
                </button>
              </div>
            </>
          ) : (
            <div className={styles.editLayout}>
              <div className={styles.editScroll}>
                <div className={styles.backRow}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => setSelectedIndex(null)}
                    disabled={saving}
                  >
                    ← Back to list
                  </button>
                </div>

                <div className={styles.formGrid}>
                  <div>
                    <label className={styles.label}>
                      First Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      className={`${styles.input} ${errors.first_name ? styles.inputError : ''}`}
                      value={form.first_name}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                    />
                    {errors.first_name && <p className={styles.errorText}>{errors.first_name}</p>}
                  </div>

                  <div>
                    <label className={styles.label}>
                      Last Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      className={`${styles.input} ${errors.last_name ? styles.inputError : ''}`}
                      value={form.last_name}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                    />
                    {errors.last_name && <p className={styles.errorText}>{errors.last_name}</p>}
                  </div>

                  <div>
                    <label className={styles.label}>
                      Passenger Type <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={`${styles.select} ${errors.type ? styles.inputError : ''}`}
                      value={form.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                    >
                      <option value="adult">Adult</option>
                      <option value="child">Child</option>
                      <option value="infant">Infant</option>
                    </select>
                    {errors.type && <p className={styles.errorText}>{errors.type}</p>}
                  </div>

                  <div>
                    <label className={styles.label}>
                      Gender <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.radioRow}>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="editGender"
                          checked={form.gender === 'M'}
                          onChange={() => handleChange('gender', 'M')}
                        />
                        Male
                      </label>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="editGender"
                          checked={form.gender === 'F'}
                          onChange={() => handleChange('gender', 'F')}
                        />
                        Female
                      </label>
                    </div>
                    {errors.gender && <p className={styles.errorText}>{errors.gender}</p>}
                  </div>

                  <div>
                    <label className={styles.label}>
                      Date of Birth <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      className={`${styles.input} ${errors.birthday ? styles.inputError : ''}`}
                      value={form.birthday}
                      onChange={(e) => handleChange('birthday', e.target.value)}
                    />
                    {errors.birthday && <p className={styles.errorText}>{errors.birthday}</p>}
                  </div>

                  <div>
                    <label className={styles.label}>
                      Nationality <span className={styles.required}>*</span>
                    </label>
                    <Select
                      searchable
                      placeholder="Select nationality"
                      data={nationalityOptions}
                      value={form.nationality || null}
                      onChange={(value) => handleChange('nationality', value || '')}
                      error={errors.nationality}
                      classNames={{ input: styles.nationalityInput }}
                      styles={{
                        input: {
                          borderColor: errors.nationality ? '#dc2626' : undefined,
                        },
                      }}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>
                      ID Type <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={`${styles.select} ${errors.card_type ? styles.inputError : ''}`}
                      value={form.card_type}
                      onChange={(e) => handleChange('card_type', e.target.value)}
                    >
                      <option value="P">Passport</option>
                      <option value="N">ID Card</option>
                      <option value="O">Other</option>
                    </select>
                    {errors.card_type && <p className={styles.errorText}>{errors.card_type}</p>}
                  </div>

                  <div>
                    <label className={styles.label}>
                      ID Number <span className={styles.required}>*</span>
                    </label>
                    <input
                      className={`${styles.input} ${errors.card_num ? styles.inputError : ''}`}
                      value={form.card_num}
                      onChange={(e) => handleChange('card_num', e.target.value)}
                    />
                    {errors.card_num && <p className={styles.errorText}>{errors.card_num}</p>}
                  </div>

                  <div>
                    <label className={styles.label}>
                      ID Expiry Date <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      className={`${styles.input} ${errors.card_expired_date ? styles.inputError : ''}`}
                      value={form.card_expired_date}
                      onChange={(e) => handleChange('card_expired_date', e.target.value)}
                    />
                    {errors.card_expired_date && (
                      <p className={styles.errorText}>{errors.card_expired_date}</p>
                    )}
                  </div>

                  <div className={styles.fieldFull}>
                    <label className={styles.label}>
                      Remark <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      className={`${styles.textarea} ${errors.remark ? styles.inputError : ''}`}
                      rows={3}
                      placeholder="e.g. Name correction on passport"
                      value={remark}
                      onChange={(e) => {
                        setRemark(e.target.value);
                        if (errors.remark) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.remark;
                            return next;
                          });
                        }
                      }}
                    />
                    {errors.remark && <p className={styles.errorText}>{errors.remark}</p>}
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setSelectedIndex(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
