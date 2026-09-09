'use client';
import React, { useEffect, useState } from 'react';
import styles from "./RoomSelection.module.css";
import { usePackageStore } from '@/components/Store/PackageStore';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { BiPhone } from 'react-icons/bi';
import { FaWhatsapp } from 'react-icons/fa';
import { HiOutlineInformationCircle } from 'react-icons/hi';

export default function Page() {
  const [roomList, setRoomList] = useState([]);
  const [quantities, setQuantities] = useState({});
  const { selectedPackage, setSelectedPackage } = usePackageStore();
  const router = useRouter();
  const [guestDistribution, setGuestDistribution] = useState({});
  const [withoutBedGuests, setWithoutBedGuests] = useState({});

  useEffect(() => {
    if (selectedPackage?.price_Details) {
      const roomsWithIds = selectedPackage.price_Details.map((r, i) => ({
        ...r,
        _id: r.type || `without_beds_${i}`,
      }));

      setRoomList(roomsWithIds);

      if (selectedPackage.selected_rooms && selectedPackage.selected_rooms.length > 0) {
        const restoredQuantities = {};
        const restoredGuests = {};
        const restoredWithoutBed = {};

        roomsWithIds.forEach(room => {
          const selectedRoom = selectedPackage.selected_rooms.find(sr => sr._id === room._id);

          if (selectedRoom) {
            restoredQuantities[room._id] = selectedRoom.rooms;
            restoredGuests[room._id] = {
              adult: selectedRoom.adults || 0,
              child: selectedRoom.children || 0,
              infant: selectedRoom.infants || 0,
            };
          } else {
            restoredQuantities[room._id] = 0;
            restoredGuests[room._id] = { adult: 0, child: 0, infant: 0 };
          }

          if (room.type !== 'without_beds') {
            restoredWithoutBed[room._id] = {
              adult: selectedRoom?.adults_without_bed || 0,
              child: selectedRoom?.children_without_bed || 0,
              infant: selectedRoom?.infants_without_bed || 0,
            };
          }
        });

        setQuantities(restoredQuantities);
        setGuestDistribution(restoredGuests);
        setWithoutBedGuests(restoredWithoutBed);
      } else {
        const initialQuantities = {};
        const initialGuests = {};
        const initialWithoutBed = {};
        roomsWithIds.forEach(room => {
          initialQuantities[room._id] = 0;
          initialGuests[room._id] = { adult: 0, child: 0, infant: 0 };
          if (room.type !== 'without_beds') {
            initialWithoutBed[room._id] = { adult: 0, child: 0, infant: 0 };
          }
        });
        setQuantities(initialQuantities);
        setGuestDistribution(initialGuests);
        setWithoutBedGuests(initialWithoutBed);
      }
    }
  }, [selectedPackage]);

  const handleIncrease = (roomId) => {
    const newQuantities = { ...quantities };
    newQuantities[roomId] = (newQuantities[roomId] || 0) + 1;
    const nextTotalCapacity = Object.keys(newQuantities).reduce((sum, key) => {
      const room = roomList.find(r => r._id === key);
      return sum + (newQuantities[key] * (room?.max_pax || 0));
    }, 0);
    if (nextTotalCapacity > selectedPackage?.pax) {
      notifications.show({
        title: 'Capacity Exceeded',
        message: `Total capacity cannot exceed package pax of ${selectedPackage?.pax}.`,
        color: 'red',
      });
      return;
    }
    setQuantities(newQuantities);
  };

  const handleDecrease = (roomId) => {
    if ((quantities[roomId] || 0) > 0) {
      const newQty = quantities[roomId] - 1;
      const room = roomList.find(r => r._id === roomId);
      const maxGuests = (room?.max_pax || 0) * newQty;
      const newGuestDistribution = { ...guestDistribution };
      const g = { ...(newGuestDistribution[roomId] || { adult: 0, child: 0, infant: 0 }) };
      const total = g.adult + g.child + g.infant;
      if (total > maxGuests) {
        let excess = total - maxGuests;
        const removeInfant = Math.min(g.infant, excess);
        g.infant -= removeInfant; excess -= removeInfant;
        const removeChild = Math.min(g.child, excess);
        g.child -= removeChild; excess -= removeChild;
        g.adult = Math.max(0, g.adult - excess);
      }
      newGuestDistribution[roomId] = g;
      setQuantities({ ...quantities, [roomId]: newQty });
      setGuestDistribution(newGuestDistribution);

      if (newQty === 0) {
        setWithoutBedGuests(prev => ({
          ...prev,
          [roomId]: { adult: 0, child: 0, infant: 0 },
        }));
      }
    }
  };

  const totalRooms = Object.keys(quantities).reduce((sum, key) => {
    const room = roomList.find(r => r._id === key);
    return sum + ((room?.type !== "without_beds") ? quantities[key] : 0);
  }, 0);

  const totalCapacity = Object.keys(quantities).reduce((sum, key) => {
    const room = roomList.find(r => r._id === key);
    return sum + (quantities[key] * (room?.max_pax || 0));
  }, 0);

  const hasWithoutAccommodation = roomList.some(r => r.type === "without_beds" && (quantities[r._id] || 0) > 0);
  const withoutBedsRoom = roomList.find(r => r.type === 'without_beds');

  const handleWithoutBedChange = (roomId, guestType, increment) => {
    const newWB = { ...withoutBedGuests };
    const current = { ...(newWB[roomId] || { adult: 0, child: 0, infant: 0 }) };
    const roomQty = quantities[roomId] || 1;

    if (increment) {
      if (guestType === 'adult') {
        if (current.adult < roomQty) {
          current.adult++;
          const maxChildAfter = current.adult * 1 + (roomQty - current.adult) * 2;
          if (current.child > maxChildAfter) current.child = maxChildAfter;
        }
      } else if (guestType === 'child') {
        const maxChild = current.adult * 1 + (roomQty - current.adult) * 2;
        if (current.child < maxChild) current.child++;
      } else if (guestType === 'infant') {
        if (current.infant < roomQty) current.infant++;
      }
    } else {
      if (current[guestType] > 0) current[guestType]--;
    }

    newWB[roomId] = current;
    setWithoutBedGuests(newWB);
  };

  const handleGuestChange = (roomId, guestType, increment) => {
    const room = roomList.find(r => r._id === roomId);
    const newGuestDistribution = { ...guestDistribution };
    const g = { ...(newGuestDistribution[roomId] || { adult: 0, child: 0, infant: 0 }) };

    if (increment) {
      if (room?.type === "without_beds") {
        g[guestType]++;
      } else {
        const maxGuests = (room?.max_pax || 0) * (quantities[roomId] || 0);
        const currentTotal = g.adult + g.child + g.infant;
        if (currentTotal < maxGuests) {
          g[guestType]++;
        }
      }
    } else {
      if (g[guestType] > 0) g[guestType]--;
    }

    newGuestDistribution[roomId] = g;
    setGuestDistribution(newGuestDistribution);
  };

  const calculateTotals = () => {
    let totals = {
      adult: 0,
      child: 0,
      infant: 0,
      adult_wb: 0,
      child_wb: 0,
      infant_wb: 0,
      adultCount: 0,
      childCount: 0,
      infantCount: 0,
      adultWbCount: 0,
      childWbCount: 0,
      infantWbCount: 0,
      grand: 0,
    };
    Object.keys(guestDistribution).forEach(roomId => {
      const room = roomList.find(r => r._id === roomId);
      if ((quantities[roomId] || 0) > 0) {
        const g = guestDistribution[roomId] || { adult: 0, child: 0, infant: 0 };
        totals.adultCount += g.adult || 0;
        totals.childCount += g.child || 0;
        totals.infantCount += g.infant || 0;
        totals.adult += g.adult * (Number(room?.sale_per_person) || 0);
        totals.child += g.child * (Number(room?.child_sale_per_person) || 0);
        totals.infant += g.infant * (Number(room?.infant_sale_per_person) || 0);
      }
    });
    Object.keys(withoutBedGuests).forEach(roomId => {
      const room = roomList.find(r => r._id === roomId);
      if ((quantities[roomId] || 0) > 0 && room?.type !== 'without_beds') {
        const wb = withoutBedGuests[roomId] || { adult: 0, child: 0, infant: 0 };
        totals.adultWbCount += wb.adult || 0;
        totals.childWbCount += wb.child || 0;
        totals.infantWbCount += wb.infant || 0;
        totals.adult_wb += wb.adult * (Number(withoutBedsRoom?.sale_per_person) || 0);
        totals.child_wb += wb.child * (Number(withoutBedsRoom?.child_sale_per_person) || 0);
        totals.infant_wb += wb.infant * (Number(withoutBedsRoom?.infant_sale_per_person) || 0);
      }
    });
    totals.grand = totals.adult + totals.child + totals.infant + totals.adult_wb + totals.child_wb + totals.infant_wb;
    return totals;
  };

  const canContinue = totalRooms > 0 || hasWithoutAccommodation;
  const totals = calculateTotals();
  const waLink = `https://wa.me/+447309803307?text=${encodeURIComponent(
    `Hi, I need help selecting rooms for ${selectedPackage?.name || 'a package'}.`
  )}`;

  const formatRoomTitle = (type) => {
    if (type === 'without_beds') return 'Without Beds';
    const label = String(type || '').replace(/_/g, ' ');
    return `${label.charAt(0).toUpperCase()}${label.slice(1)} Sharing`;
  };

  const ProceedToCheckout = () => {
    if (!roomList.length) return [];
    const updated = roomList
      .filter(room => quantities[room._id] > 0)
      .map(room => {
        const qty = quantities[room._id] || 0;
        const guests = guestDistribution[room._id] || { adult: 0, child: 0, infant: 0 };
        const guestTotals = { adult: guests.adult, child: guests.child, infant: guests.infant };

        const perRoomGuests = [];
        let remaining = { ...guestTotals };
        for (let i = 0; i < qty; i++) {
          const rg = { adult: 0, child: 0, infant: 0 };
          let capacity = room.max_pax || 0;
          const a = Math.min(remaining.adult, capacity);
          rg.adult = a; remaining.adult -= a; capacity -= a;
          const c = Math.min(remaining.child, capacity);
          rg.child = c; remaining.child -= c; capacity -= c;
          const inf = Math.min(remaining.infant, capacity);
          rg.infant = inf; remaining.infant -= inf;
          perRoomGuests.push(rg);
        }

        const wb = withoutBedGuests[room._id] || { adult: 0, child: 0, infant: 0 };
        return {
          ...room,
          rooms: qty,
          adults: guestTotals.adult,
          children: guestTotals.child,
          infants: guestTotals.infant,
          adult_price: Number(room?.sale_per_person) || 0,
          child_price: Number(room?.child_sale_per_person) || 0,
          infant_price: Number(room?.infant_sale_per_person) || 0,
          adults_without_bed: wb.adult,
          children_without_bed: wb.child,
          infants_without_bed: wb.infant,
          adult_without_bed_price: Number(withoutBedsRoom?.sale_per_person) || 0,
          child_without_bed_price: Number(withoutBedsRoom?.child_sale_per_person) || 0,
          infant_without_bed_price: Number(withoutBedsRoom?.infant_sale_per_person) || 0,
        };
      });
    const invalidRoom = updated.find(
      (r) => r.adults === 0 && r.children === 0 && r.infants === 0 && r.type !== 'without_beds'
    );
    if (invalidRoom) {
      notifications.show({
        title: "Guests Required",
        message: `Please select at least 1 guest in room.`,
        color: "red",
      });
      return;
    }
    selectedPackage.selected_rooms = updated;
    const nextTotals = calculateTotals();
    selectedPackage.total_amount = nextTotals.grand;
    setSelectedPackage(selectedPackage);
    router.push(`/${selectedPackage?.category?.slug}/review`);
  };

  const renderStepper = (value, onMinus, onPlus, plusDisabled = false) => (
    <div className={styles.quantityControl}>
      <button type="button" onClick={onMinus} aria-label="Decrease">−</button>
      <span>{value}</span>
      <button type="button" onClick={onPlus} disabled={plusDisabled} aria-label="Increase">+</button>
    </div>
  );

  return (
    <div className={styles.roomContainer}>
      <div className={styles.pageInner}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Select Your Package</h1>
          <p className={styles.pageSubtitle}>
            Choose your rooms and configure guests in one place
          </p>
        </div>

        <div className={styles.layout}>
          <div className={styles.mainCol}>

            <div className={styles.roomListHeader}>
              <h3 className={styles.roomListTitle}>Select Room Type & Occupancy</h3>
              <div className={styles.roomList}>
                {roomList.filter(room => room.type !== 'without_beds').map(room => {
                  const isSelected = (quantities[room._id] || 0) > 0;
                  const totalRoomsOfType = quantities[room._id] || 0;
                  const maxGuests = (room.max_pax || 0) * totalRoomsOfType;
                  const gd = guestDistribution[room._id] || { adult: 0, child: 0, infant: 0 };
                  const showWithoutBed =
                    withoutBedsRoom &&
                    (Number(withoutBedsRoom?.sale_per_person) > 0 ||
                      Number(withoutBedsRoom?.child_sale_per_person) > 0 ||
                      Number(withoutBedsRoom?.infant_sale_per_person) > 0);

                  return (
                    <div
                      key={room._id}
                      className={`${styles.roomCard} ${isSelected ? styles.selectedCard : ''}`}
                    >
                      <div className={styles.roomHeader}>
                        <div>
                          <h3 className={styles.roomTitle}>{formatRoomTitle(room.type)}</h3>
                          <p className={styles.roomMeta}>
                            {room.max_pax} {room.max_pax > 1 ? 'Guests' : 'Guest'} per room
                          </p>
                        </div>
                        {isSelected && (
                          <span className={styles.selectedBadge}>
                            {totalRoomsOfType} {totalRoomsOfType === 1 ? 'Room' : 'Rooms'}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <div className={styles.guestGrid}>
                          <div className={styles.guestCell}>
                            <div className='d-flex flex-column gap-1'>
                            <span className={styles.guestLabel}>Adults</span>
                              <span className={styles.guestPrice}>
                                <PriceDisplay price={room?.sale_per_person} currency={selectedPackage?.currency_code} /> each
                              </span>
                            </div>
                            {renderStepper(
                              gd.adult || 0,
                              () => handleGuestChange(room._id, 'adult', false),
                              () => handleGuestChange(room._id, 'adult', true),
                              (gd.adult + gd.child + gd.infant) >= maxGuests
                            )}
                          </div>
                          <div className={styles.guestCell}>
                          <div className='d-flex flex-column gap-1'>
                              <span className={styles.guestLabel}>Children</span>
                              <span className={styles.guestPrice}>
                                <PriceDisplay price={room?.child_sale_per_person} currency={selectedPackage?.currency_code} /> each
                              </span>
                            </div>
                            {renderStepper(
                              gd.child || 0,
                              () => handleGuestChange(room._id, 'child', false),
                              () => handleGuestChange(room._id, 'child', true),
                              (gd.adult + gd.child + gd.infant) >= maxGuests
                            )}
                          </div>
                          <div className={styles.guestCell}>
                            <div className='d-flex flex-column gap-1'>
                            <span className={styles.guestLabel}>Infants</span>
                              <span className={styles.guestPrice}>
                                <PriceDisplay price={room?.infant_sale_per_person} currency={selectedPackage?.currency_code} /> each
                              </span>
                            </div>
                            {renderStepper(
                              gd.infant || 0,
                              () => handleGuestChange(room._id, 'infant', false),
                              () => handleGuestChange(room._id, 'infant', true),
                              (gd.adult + gd.child + gd.infant) >= maxGuests
                            )}
                          </div>
                        </div>
                      )}

                      <div className={styles.roomsRow}>
                        <span className={styles.roomsLabel}>Number of Rooms</span>
                        {renderStepper(
                          totalRoomsOfType,
                          () => handleDecrease(room._id),
                          () => handleIncrease(room._id),
                          Number(totalCapacity) >= Number(selectedPackage?.pax)
                        )}
                      </div>

                      {isSelected && showWithoutBed && (
                        <div className={styles.withoutBedSection}>
                          <div className={styles.withoutBedHeader}>
                            <span className={styles.withoutBedTitle}>Without Bed (Extra Guests)</span>
                            <span className={styles.withoutBedMax}>
                              Max {totalRoomsOfType} adult, {totalRoomsOfType * 2} children, {totalRoomsOfType} infant
                            </span>
                          </div>
                          <div className={styles.guestGrid}>
                            {Number(withoutBedsRoom?.sale_per_person) > 0 && (
                              <div className={styles.guestCell}>
                                <div className='d-flex flex-column gap-1'>
                                <span className={styles.guestLabel}>Adults</span>
                                  <span className={styles.guestPrice}>
                                    <PriceDisplay price={withoutBedsRoom?.sale_per_person} currency={selectedPackage?.currency_code} /> each
                                  </span>
                                </div>
                                {renderStepper(
                                  withoutBedGuests[room._id]?.adult || 0,
                                  () => handleWithoutBedChange(room._id, 'adult', false),
                                  () => handleWithoutBedChange(room._id, 'adult', true),
                                  (withoutBedGuests[room._id]?.adult || 0) >= totalRoomsOfType
                                )}
                              </div>
                            )}
                            {Number(withoutBedsRoom?.child_sale_per_person) > 0 && (
                              <div className={styles.guestCell}>
                                <div className='d-flex flex-column gap-1'>
                                <span className={styles.guestLabel}>Children</span>
                                  <span className={styles.guestPrice}>
                                    <PriceDisplay price={withoutBedsRoom?.child_sale_per_person} currency={selectedPackage?.currency_code} /> each
                                  </span>
                                </div>
                                {renderStepper(
                                  withoutBedGuests[room._id]?.child || 0,
                                  () => handleWithoutBedChange(room._id, 'child', false),
                                  () => handleWithoutBedChange(room._id, 'child', true),
                                  (() => {
                                    const wb = withoutBedGuests[room._id] || { adult: 0, child: 0, infant: 0 };
                                    const maxChild = wb.adult * 1 + (totalRoomsOfType - wb.adult) * 2;
                                    return wb.child >= maxChild;
                                  })()
                                )}
                              </div>
                            )}
                            {Number(withoutBedsRoom?.infant_sale_per_person) > 0 && (
                              <div className={styles.guestCell}>
                                <div className='d-flex flex-column gap-1'>
                                <span className={styles.guestLabel}>Infants</span>
                                  <span className={styles.guestPrice}>
                                    <PriceDisplay price={withoutBedsRoom?.infant_sale_per_person} currency={selectedPackage?.currency_code} /> each
                                  </span>
                                </div>
                                {renderStepper(
                                  withoutBedGuests[room._id]?.infant || 0,
                                  () => handleWithoutBedChange(room._id, 'infant', false),
                                  () => handleWithoutBedChange(room._id, 'infant', true),
                                  (withoutBedGuests[room._id]?.infant || 0) >= totalRoomsOfType
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <HiOutlineInformationCircle size={22} />
              </div>
              <div>
                <h4 className={styles.infoTitle}>Important Information</h4>
                <ul className={styles.infoList}>
                  <li>Prices are per person and inclusive of VAT and taxes.</li>
                  <li>Children age 2–12 are charged child rates; infants under 2 use infant rates.</li>
                  <li>Room capacity cannot exceed the package passenger limit.</li>
                  <li>Without-bed guests are extras sharing selected rooms within the stated limits.</li>
                </ul>
              </div>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.bookingCard}>
              <h4 className={styles.bookingCardTitle}>Price Breakdown</h4>

              <div className={styles.priceRow}>
                <span>Adults ({totals.adultCount})</span>
                <strong><PriceDisplay price={totals.adult} currency={selectedPackage?.currency_code} /></strong>
              </div>
              <div className={styles.priceRow}>
                <span>Child ({totals.childCount})</span>
                <strong><PriceDisplay price={totals.child} currency={selectedPackage?.currency_code} /></strong>
              </div>
              <div className={styles.priceRow}>
                <span>Infants ({totals.infantCount})</span>
                <strong><PriceDisplay price={totals.infant} currency={selectedPackage?.currency_code} /></strong>
              </div>
              {totals.adult_wb > 0 && (
                <div className={styles.priceRow}>
                  <span>Adults (No Bed) ({totals.adultWbCount})</span>
                  <strong><PriceDisplay price={totals.adult_wb} currency={selectedPackage?.currency_code} /></strong>
                </div>
              )}
              {totals.child_wb > 0 && (
                <div className={styles.priceRow}>
                  <span>Children (No Bed) ({totals.childWbCount})</span>
                  <strong><PriceDisplay price={totals.child_wb} currency={selectedPackage?.currency_code} /></strong>
                </div>
              )}
              {totals.infant_wb > 0 && (
                <div className={styles.priceRow}>
                  <span>Infants (No Bed) ({totals.infantWbCount})</span>
                  <strong><PriceDisplay price={totals.infant_wb} currency={selectedPackage?.currency_code} /></strong>
                </div>
              )}

              {/* <div className={styles.subtotal}>
                <span>Subtotal</span>
                <strong><PriceDisplay price={totals.grand} currency={selectedPackage?.currency_code} /></strong>
              </div> */}

              <div className={styles.priceDivider} />

              <div className={styles.priceTotalRow}>
                <span className={styles.priceTotalLabel}>Total Price</span>
                <div className={styles.priceTotalRight}>
                  <div className={styles.priceTotalValue}>
                    <PriceDisplay price={totals.grand} currency={selectedPackage?.currency_code} />
                  </div>
                  <span className={styles.priceTotalNote}>VAT and Taxes included</span>
                </div>
              </div>

              <button
                type="button"
                className={styles.btnCheckout}
                onClick={ProceedToCheckout}
                disabled={!canContinue}
              >
                Book Now
              </button>
            </div>

            <div className={styles.contactCard}>
              <h4 className={styles.contactTitle}>Need Help?</h4>
              <p className={styles.contactSubtitle}>
                Our travel experts are available 24/7 to assist you with your booking.
              </p>
              <div className={styles.contactActions}>
                 <a href="/" className={styles.contactBtn}>
                 {/* href="tel:01217772522"  */}
                  <BiPhone size={15} /> Call Us Now
                </a>
                <a
                  // href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.contactBtn}
                >
                  <FaWhatsapp size={15} /> Live Chat
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}