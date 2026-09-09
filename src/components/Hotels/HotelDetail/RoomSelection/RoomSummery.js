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

const resolveChildren = (item, rate, searchRooms) => {
    const fromItem = normalizeChildren(item.children);
    if (fromItem.length) return fromItem;

    const fromRate = normalizeChildren(rate?.metadata?.search_request?.rooms?.[0]?.children);
    if (fromRate.length) return fromRate;

    return normalizeChildren(searchRooms?.[0]?.children);
};

export default function RoomSummery({ selectedRooms, roomList, detail, variant = 'bottom' }) {
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
            const room = roomList.find(r => r.id === selected.roomId);
            if (room) {
                const rate = room.rates.find(rt => rt.rate_key === selected.ratekey);
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
        if (detail?.provider === 'custom' || isPackageMode || isEditMode) {
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
        const request = {
            "provider": detail?.provider,
            "hotelId": detail?.hotel_code,
            "clientNationality": "",
            "checkIn": searchData?.check_in,
            "checkOut": searchData?.check_out,
            "rooms": selectedRooms.map(item => {
                const room = roomList.find(r => r.id === item.roomId);
                const rate = room?.rates?.find(rt => rt.rate_key === item.ratekey);

                return {
                    "rateKey": item.ratekey,
                    "quantity": item.qty,
                    "adults": String(item.adults) || '',
                    "children": resolveChildren(item, rate, search),
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
                    handleHotelSelection(detail, selectedRooms, true);
                } else {
                    res.data.provider = res.provider;
                    res.data.address = detail?.address;
                    res.data.main_images = detail?.main_images;
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
            selectedRooms.some(room => room?.roomId === item.id)
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
                        {roomList.filter(item => selectedRooms.some(room => room?.roomId === item.id)).map((item, index) => (
                            <div key={index}>
                                {item?.rates.filter(rate => selectedRooms.some(room => room?.ratekey === rate.rate_key)).map((rateItem, rateIndex) => (
                                    <div key={rateIndex} className="hotel-detail-summary-item">
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
                                            <span>{selectedRooms.find(room => room?.ratekey === rateItem.rate_key).qty} × <PriceDisplay price={rateItem.price} currency={rateItem?.currency} /></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
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
