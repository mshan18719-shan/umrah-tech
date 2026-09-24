import React, { useEffect, useMemo, useState } from 'react'
import { MdChildFriendly } from "react-icons/md";
import { IoPerson } from "react-icons/io5";
import { IoMdPricetag } from "react-icons/io";
import PriceDisplay from '@/components/Currency/PriceDisplay';
import { notifications } from '@mantine/notifications';
import { useHotelStore } from '@/components/Store/HotelStore';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { usePackageMode } from '@/components/Store/PackageModeHelper';
import { useHolidayPackageStore } from '@/components/Store/HolidayPackageStore';

const normalizeChildren = (children) => {
    if (!Array.isArray(children)) return [];
    return children
        .map((c) => {
            if (c != null && typeof c === 'object' && 'age' in c) {
                return { age: Number(c.age) };
            }
            const age = Number(c);
            return Number.isFinite(age) ? { age } : null;
        })
        .filter(Boolean);
};

const resolveSeqIndex = (item, rate, room) => {
    if (item?.seqNo === 0 || item?.seqNo === '0') return 0;
    if (item?.seqNo != null && item?.seqNo !== '') {
        const n = Number(item.seqNo);
        if (Number.isFinite(n)) return n;
    }
    const fromRate = getRateSeqNo(rate, room);
    if (fromRate != null) return fromRate;
    return 0;
};

/** Adults + children (with ages) for the matching search room / seq_no */
const resolveOccupancy = (item, rate, room, searchRooms) => {
    const idx = resolveSeqIndex(item, rate, room);
    const meta = getRateMetadata(rate);

    const fromSearch = searchRooms?.[idx];
    if (fromSearch) {
        return {
            adults: Number(fromSearch.adults) || Number(item?.adults) || 1,
            children: normalizeChildren(fromSearch.children),
        };
    }

    const fromItemChildren = normalizeChildren(item?.children);
    if (fromItemChildren.length || (item?.adults != null && Number(item.adults) > 0)) {
        return {
            adults: Number(item.adults) || Number(rate?.adults) || 2,
            children: fromItemChildren,
        };
    }

    const apiRoom = meta?.search_request?.rooms?.[idx]
        ?? rate?.metadata?.search_request?.rooms?.[idx];
    if (apiRoom) {
        return {
            adults: Number(apiRoom.adults) || Number(rate?.adults) || 2,
            children: normalizeChildren(apiRoom.children),
        };
    }

    return {
        adults: Number(rate?.adults) || 2,
        children: [],
    };
};

const getRateMetadata = (rate) => {
    const meta = rate?.metadata;
    if (meta == null) return null;
    if (typeof meta === "string") {
        try {
            return JSON.parse(meta);
        } catch {
            return null;
        }
    }
    return typeof meta === "object" ? meta : null;
};

const getRateSeqNo = (rate, room) => {
    const meta = getRateMetadata(rate);
    const roomMeta = getRateMetadata(room);
    const raw =
        meta?.seq_no ??
        meta?.search_request?.seq_no ??
        meta?.search_request?.rooms?.[0]?.seq_no ??
        rate?.seq_no ??
        rate?.search_request?.seq_no ??
        rate?.search_request?.rooms?.[0]?.seq_no ??
        room?.seq_no ??
        roomMeta?.seq_no;
    if (raw === 0 || raw === "0") return 0;
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
};

const findRoomBySelection = (roomList, selected) => {
    if (!selected) return null;
    const byRate = roomList.find((r) =>
        r?.rates?.some((rt) => rt.rate_key === selected.ratekey)
    );
    if (byRate) return byRate;
    return roomList.find((r) => r.id === selected.roomId) || null;
};

const findRateBySelection = (room, selected) => {
    if (!room || !selected) return null;
    return room.rates?.find((rt) => rt.rate_key === selected.ratekey) || null;
};

export default function RoomSummery({ selectedRooms, roomList, detail, variant = 'bottom', hotelstonRequiredCount }) {
    const { handleHotelSelection, isPackageMode, isEditMode } = usePackageMode();
    const { packageConfig } = useHolidayPackageStore();
    const { setAvailabilityData } = useHotelStore();
    const [isLoading, setIsLoading] = useState(false);
    const [totalNights, setTotalNights] = useState(1);
    const [search, setSearch] = useState([]);
    const router = useRouter();

    useEffect(() => {
        if (detail?.checkIn && detail?.checkOut) {
            const nights = moment(detail.checkOut).diff(moment(detail.checkIn), 'days');
            setTotalNights(nights);
        }
        const SearchData = localStorage.getItem('searchRoomSelection');
        if (SearchData) {
            setSearch(JSON.parse(SearchData));
        }
    }, [detail?.checkIn, detail?.checkOut]);

    const { totalPrice, currency } = useMemo(() => {
        let total = 0;
        let currencySymbol = '';

        selectedRooms.forEach(selected => {
            const room = findRoomBySelection(roomList, selected);
            if (room) {
                const rate = findRateBySelection(room, selected);
                if (rate) {
                    currencySymbol = rate.currency || currencySymbol;
                    total += (Number(rate.price) * selected.qty);
                }
            }
        });

        return { totalPrice: total.toFixed(2), currency: currencySymbol };
    }, [selectedRooms, roomList]);

    const PreBooking = async () => {
        if (selectedRooms.length === 0) {
            notifications.show({
                autoClose: 3000,
                title: "Error",
                message: "Please select at least one room to proceed.",
                color: "red",
            });
            return;
        }

        const isHotelston = String(detail?.provider || '').toLowerCase() === 'hotelston';
        if (isHotelston) {
            const seqsFromList = new Set();
            (roomList || []).forEach((room) => {
                (room?.rates || []).forEach((rate) => {
                    const seq = getRateSeqNo(rate, room);
                    if (seq != null) seqsFromList.add(seq);
                });
            });

            let searchRooms = [];
            try {
                searchRooms = JSON.parse(localStorage.getItem('searchRoomSelection') || '[]');
            } catch {
                searchRooms = [];
            }
            if (!Array.isArray(searchRooms) || searchRooms.length === 0) {
                searchRooms = search;
            }

            // Prefer unique seqs available on this hotel; never force stale search count above that
            const requiredCount = seqsFromList.size > 0
                ? seqsFromList.size
                : Math.max(Number(hotelstonRequiredCount) || 0, searchRooms.length || 0, 1);

            const selectedSeqs = new Set(
                selectedRooms
                    .map((r) => {
                        if (r.seqNo === 0 || r.seqNo === '0') return 0;
                        if (r.seqNo != null && r.seqNo !== '') {
                            const n = Number(r.seqNo);
                            return Number.isFinite(n) ? n : null;
                        }
                        const room = findRoomBySelection(roomList, r);
                        const rate = findRateBySelection(room, r);
                        return getRateSeqNo(rate, room);
                    })
                    .filter((n) => n != null && Number.isFinite(n))
            );

            const hasAllSeqs =
                seqsFromList.size > 0
                    ? [...seqsFromList].every((seq) => selectedSeqs.has(seq))
                    : selectedRooms.length >= requiredCount;

            if (!hasAllSeqs || selectedRooms.length < requiredCount) {
                notifications.show({
                    autoClose: 3500,
                    title: "Incomplete Room Selection",
                    message: `Please select ${requiredCount} room${requiredCount > 1 ? 's' : ''} to match your search (one per guest group).`,
                    color: "red",
                });
                return;
            }
        }

        // Guest-capacity check: package/edit only. Hotelston uses seq_no rules above.
        // Custom and other providers can proceed with any selected room(s).
        if (isPackageMode || isEditMode) {
            if (!CheckCustomHotelRoomSelection()) {
                notifications.show({
                    autoClose: 3000,
                    title: "Incomplete Room Selection",
                    message: "Not enough rooms for all guests. Please adjust your selection.",
                    color: "red",
                });
                return;
            }
        }
        let searchData = {};
        const storedData = localStorage.getItem('HotelSearchData');
        if (storedData) {
            searchData = JSON.parse(storedData);
        }

        let searchRooms = search;
        try {
            const storedSearch = JSON.parse(localStorage.getItem('searchRoomSelection') || '[]');
            if (Array.isArray(storedSearch) && storedSearch.length > 0) {
                searchRooms = storedSearch;
            }
        } catch {
            /* keep search state */
        }

        // Send rooms in search / seq_no order so occupancy matches Room 1, Room 2, Room 3…
        const orderedSelections = [...selectedRooms].sort((a, b) => {
            const sa = a.seqNo === 0 || a.seqNo === '0'
                ? 0
                : (a.seqNo != null && a.seqNo !== '' ? Number(a.seqNo) : Number.MAX_SAFE_INTEGER);
            const sb = b.seqNo === 0 || b.seqNo === '0'
                ? 0
                : (b.seqNo != null && b.seqNo !== '' ? Number(b.seqNo) : Number.MAX_SAFE_INTEGER);
            return sa - sb;
        });

        const request = {
            "provider": detail?.provider,
            "hotelId": detail?.hotel_code,
            "clientNationality": "",
            "checkIn": searchData?.check_in,
            "checkOut": searchData?.check_out,
            "rooms": orderedSelections.map(item => {
                const room = findRoomBySelection(roomList, item);
                const rate = findRateBySelection(room, item);
                const occupancy = resolveOccupancy(item, rate, room, searchRooms);

                return {
                    "rateKey": item.ratekey,
                    "quantity": item.qty,
                    "adults": String(occupancy.adults),
                    "children": occupancy.children,
                    "roomTypeId": String(item.roomTypeId ?? ''),
                    "boardTypeId": String(item.boardTypeId ?? ''),
                };
            })
        };
        setIsLoading(true);
        const clientNationality = localStorage.getItem('clientNationality');
        if (clientNationality) {
            request.clientNationality = clientNationality;
        }
        try {
            const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/check-rates`, {
                method: 'POST',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });
            const res = await responses.json();
            setIsLoading(false);
            if (res.success) {
                if (isPackageMode || isEditMode) {
                    handleHotelSelection(detail, orderedSelections, true);
                } else {
                    res.data.provider = res.provider;
                    res.data.address = detail?.address;
                    res.data.main_images = detail?.main_images;
                    // Keep search occupancy (incl. child ages) for checkout / invoice / voucher
                    res.data.search_rooms = searchRooms;
                    res.data.selected_occupancy = orderedSelections.map((item) => {
                        const room = findRoomBySelection(roomList, item);
                        const rate = findRateBySelection(room, item);
                        const occupancy = resolveOccupancy(item, rate, room, searchRooms);
                        return {
                            rateKey: item.ratekey,
                            seqNo: item.seqNo,
                            adults: occupancy.adults,
                            children: occupancy.children,
                        };
                    });
                    setAvailabilityData(res.data);
                    router.push('/hotels/checkout');
                }
            } else {
                notifications.show({
                    title: 'Error',
                    message: res?.message,
                    autoClose: 3500,
                    color: 'red'
                });
            }
        } catch (err) {
            setIsLoading(false);
            console.error("Error fetching hotel details:", err);
        }
    };

    const CheckCustomHotelRoomSelection = () => {
        const filteredRooms = roomList.filter(item =>
            selectedRooms.some(room => room?.roomId === item.id || item?.rates?.some(rt => rt.rate_key === room?.ratekey))
        );
        const totals = filteredRooms.reduce(
            (acc, item) => {
                item.rates.forEach(rate => {
                    if (selectedRooms.some(room => room?.ratekey === rate.rate_key)) {
                        const qty = selectedRooms.find(room => room?.ratekey === rate.rate_key).qty;
                        const adult = rate.adults * qty;
                        const child = rate.children * qty;
                        acc.adults += adult || 0;
                        acc.children += child || 0;
                    }
                });
                return acc;
            },
            { adults: 0, children: 0 }
        );
        if (isPackageMode || isEditMode) {
            if (totals?.adults >= packageConfig?.searchData?.totalGuests?.adults && totals?.children >= packageConfig?.searchData?.totalGuests?.children) {
                return true;
            }
            return false;
        }
        const roomTotal = search.reduce((sum, item) => {
            sum.adults += item.adults || 0;
            sum.children += item.children.length || 0;
            return sum;
        }, { adults: 0, children: 0 });

        return totals?.adults >= roomTotal?.adults && totals?.children >= roomTotal?.children;
    };

    const summaryCardClass = variant === 'sidebar'
        ? 'hotel-detail-summary-card hotel-detail-summary-card--sidebar'
        : 'hotel-detail-summary-card';

    return (
        <>
            <section className={summaryCardClass}>
                <h3 className="hotel-detail-card__title">Reservation Summary</h3>
                {selectedRooms.length === 0 ? (
                    <div className="hotel-detail-summary-empty">No Room Selected.</div>
                ) : (
                    <div className="hotel-detail-summary-body">
                        {selectedRooms.map((selected, index) => {
                            const item = findRoomBySelection(roomList, selected);
                            const rateItem = findRateBySelection(item, selected);
                            if (!item || !rateItem) return null;
                            return (
                                <div key={`${selected.ratekey}-${index}`} className="hotel-detail-summary-item">
                                    <h6>{item.name} ({rateItem.board_name})</h6>
                                    <div className="hotel-detail-summary-line">
                                        <span><IoPerson className='icon' size={17} /> {Number(rateItem.adults) > 1 ? 'Adults' : 'Adult'}</span>
                                        <span>{rateItem.adults}</span>
                                    </div>
                                    <div className="hotel-detail-summary-line">
                                        <span><MdChildFriendly className='icon' size={15} /> {Number(rateItem.children) > 1 ? 'Children' : 'Child'}</span>
                                        <span>{rateItem.children}</span>
                                    </div>
                                    <div className="hotel-detail-summary-line">
                                        <span><IoMdPricetag className='icon' size={15} /> Price</span>
                                        <span>{selected.qty} × <PriceDisplay price={rateItem.price} currency={rateItem?.currency} /></span>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="hotel-detail-summary-meta">
                            <div className="hotel-detail-summary-line">
                                <span>Total length of stay</span>
                                <span>{totalNights} night{totalNights > 1 ? 's' : ''}</span>
                            </div>
                            <div className="hotel-detail-summary-line">
                                <span>Check-in</span>
                                <span>{moment(detail?.checkIn).format('DD-MM-YYYY')}</span>
                            </div>
                            <div className="hotel-detail-summary-line">
                                <span>Check-out</span>
                                <span>{moment(detail?.checkOut).format('DD-MM-YYYY')}</span>
                            </div>
                        </div>
                        <hr className="hotel-detail-summary-divider" />
                        <div className="hotel-detail-summary-line">
                            <span>Price Per Night</span>
                            <span><PriceDisplay price={totalPrice / totalNights} currency={currency} /></span>
                        </div>
                        <div className="hotel-detail-summary-total">
                            <span>Total</span>
                            <span><PriceDisplay price={totalPrice} currency={currency} /></span>
                        </div>
                        <small className="hotel-detail-summary-note">Vat and Taxes included</small>
                    </div>
                )}

                <button
                    disabled={isLoading}
                    onClick={PreBooking}
                    className="hotel-detail-summary-cta d-none d-md-inline-flex"
                >
                    {isLoading ? (
                        <div className="spinner-border text-light spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    ) : (
                        isPackageMode ? ' to Next Service' : 'Proceed to checkout'
                    )}
                </button>
            </section>

            {selectedRooms.length > 0 && (
                <div className="hotel-detail-mobile-bar d-md-none">
                    <div>
                        <small className="hotel-detail-mobile-bar__label">Total Price</small>
                        <strong className="hotel-detail-mobile-bar__price">
                            <PriceDisplay price={totalPrice} currency={currency} />
                        </strong>
                        <small className="hotel-detail-mobile-bar__label">VAT and taxes included</small>
                    </div>
                    <button
                        disabled={isLoading}
                        onClick={PreBooking}
                        className="hotel-detail-summary-cta"
                    >
                        {isLoading ? (
                            <div className="spinner-border text-light spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        ) : (
                            isPackageMode ? 'Proceed to Next Service' : 'Proceed to checkout'
                        )}
                    </button>
                </div>
            )}
        </>
    );
}
