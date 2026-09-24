'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import RoomSummery from './RoomSummery'
import { FaAngleDown, FaAngleUp, FaTimes, FaCheckCircle, FaBan } from 'react-icons/fa';
import { CiTrash } from "react-icons/ci";
import PriceDisplay from '@/components/Currency/PriceDisplay';
import moment from 'moment';
import { useHolidayPackageStore } from '@/components/Store/HolidayPackageStore';
import { MdInfoOutline } from 'react-icons/md';
import { Tooltip } from '@mantine/core';
import { Select } from "@mantine/core";
import { useCurrency } from '@/util/currency';
import { ConvertPrice } from '@/components/Currency/ConvertPrice';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import { FiClock, FiExternalLink } from 'react-icons/fi';
import FacilitiesModal from '@/components/Hotels/HotelDetail/FacilitiesModal';
import styles from './RoomList.module.css';

const ROOMS_PREVIEW_COUNT = 6;

const getMinRate = (room) => {
    if (!room?.rates?.length) return null;
    return room.rates.reduce((min, rate) => {
        if (!min) return rate;
        return Number(rate.price) < Number(min.price) ? rate : min;
    }, null);
};

const isHotelstonProvider = (provider) =>
    String(provider || "").toLowerCase() === "hotelston";

/** Parse rate.metadata whether object or JSON string */
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

/**
 * Hotelston: seq_no is on rate.metadata (sibling of search_request),
 * sometimes on the rate / room itself or inside search_request.
 */
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

/** Resolve seq for a selected entry, falling back to rate lookup in roomList */
const resolveSelectedSeqNo = (selected, rooms) => {
    if (!selected) return null;
    if (selected.seqNo === 0 || selected.seqNo === "0") return 0;
    if (selected.seqNo != null && selected.seqNo !== "") {
        const n = Number(selected.seqNo);
        if (Number.isFinite(n)) return n;
    }
    for (const room of rooms || []) {
        const rate = room?.rates?.find((rt) => rt.rate_key === selected.ratekey);
        if (rate) return getRateSeqNo(rate, room);
    }
    return null;
};

const collectHotelstonSeqNos = (rooms) => {
    const seqs = new Set();
    (rooms || []).forEach((room) => {
        (room?.rates || []).forEach((rate) => {
            const seq = getRateSeqNo(rate, room);
            if (seq != null) seqs.add(seq);
        });
    });
    return seqs;
};

export default function RoomList({ hotelDetail, isPackageMode, isEditMode, totalNights: totalNightsProp }) {
    const { selectedData } = useHolidayPackageStore();
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [roomData, setRoomData] = useState(hotelDetail?.rooms || []);
    const [filteredRoomData, setFilteredRoomData] = useState(hotelDetail?.rooms || []);
    const [activeFilters, setActiveFilters] = useState([]);
    const [modalPolicy, setModalPolicy] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { currency, rates } = useCurrency();
    const [expandedRates, setExpandedRates] = useState({});
    const [showAllRooms, setShowAllRooms] = useState(false);
    const [roomFacilitiesModal, setRoomFacilitiesModal] = useState({
        open: false,
        roomName: '',
        facilities: [],
    });

    const totalNights = React.useMemo(() => {
        if (totalNightsProp) return totalNightsProp;
        if (hotelDetail?.checkIn && hotelDetail?.checkOut) {
            const nights = moment(hotelDetail.checkOut).diff(moment(hotelDetail.checkIn), 'days');
            return nights > 0 ? nights : 1;
        }
        return 1;
    }, [hotelDetail?.checkIn, hotelDetail?.checkOut, totalNightsProp]);

    const lat = hotelDetail?.coordinates?.latitude;
    const lng = hotelDetail?.coordinates?.longitude;
    const mapsUrl = lat && lng
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelDetail?.address || '')}`;
    const mapEmbedUrl = lat && lng
        ? `https://maps.google.com/maps?q=${lat},${lng}&t=&z=13&ie=UTF8&iwloc=&output=embed`
        : `https://maps.google.com/maps?q=${encodeURIComponent(hotelDetail?.address || '')}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

    const toggleRates = (roomIndex) => {
        setExpandedRates(prev => ({ ...prev, [roomIndex]: !prev[roomIndex] }));
    };

    const openRoomFacilitiesModal = (room) => {
        setRoomFacilitiesModal({
            open: true,
            roomName: room?.name || 'Room',
            facilities: room?.amenities || [],
        });
    };

    useEffect(() => {
        if (isPackageMode) {
            const rooms = hotelDetail?.rooms || [];
            let minRate = null;
            let minRoomId = null;

            rooms.forEach(room => {
                room?.rates?.forEach(rate => {
                    if (minRate === null || Number(rate.price) < Number(minRate.price)) {
                        minRate = rate;
                        minRoomId = room.id;
                    }
                });
            });

            setSelectedRooms(minRate ? [{
                roomId: minRoomId,
                ratekey: minRate.rate_key,
                qty: 1,
                roomTypeId: minRate?.metadata?.room_type_id || '',
                boardTypeId: minRate?.metadata?.board_type_id || '',
                adults: minRate?.metadata?.search_request?.rooms?.[0]?.adults ?? minRate?.adults ?? 2,
                children: Array.isArray(minRate?.metadata?.search_request?.rooms?.[0]?.children)
                    ? minRate.metadata.search_request.rooms[0].children.map((c) => ({
                        age: Number(c?.age ?? c),
                    }))
                    : [],
                ...(isHotelstonProvider(hotelDetail?.provider) && getRateSeqNo(minRate) != null
                    ? { seqNo: Number(getRateSeqNo(minRate)) }
                    : {}),
            }] : []);
        }
        if (isEditMode) {
            setSelectedRooms(selectedData?.hotel?.selectedRoom || []);
        }
        setRoomData(hotelDetail?.rooms || []);
        setFilteredRoomData(hotelDetail?.rooms || []);
    }, [hotelDetail, isPackageMode, isEditMode, selectedData]);

    const isHotelston = isHotelstonProvider(hotelDetail?.provider);

    const hotelstonRequiredSeqCount = React.useMemo(() => {
        if (!isHotelston) return 0;
        const fromRooms = collectHotelstonSeqNos(roomData);
        if (fromRooms.size > 0) return fromRooms.size;
        try {
            const searchRooms = JSON.parse(localStorage.getItem('searchRoomSelection') || '[]');
            if (Array.isArray(searchRooms) && searchRooms.length > 0) return searchRooms.length;
        } catch {
            /* ignore */
        }
        return 1;
    }, [isHotelston, roomData]);

    const readSearchRoomSelection = () => {
        try {
            const raw = JSON.parse(localStorage.getItem('searchRoomSelection') || '[]');
            return Array.isArray(raw) ? raw : [];
        } catch {
            return [];
        }
    };

    /** Occupancy for this offer: match search room by seq_no (not always rooms[0]) */
    const resolveOccupancyForSeq = (seqNo, rate) => {
        const meta = getRateMetadata(rate);
        const searchRooms = readSearchRoomSelection();
        const idx = seqNo == null || seqNo === '' || !Number.isFinite(Number(seqNo))
            ? 0
            : Number(seqNo);

        const fromSearch = searchRooms[idx];
        if (fromSearch) {
            const children = Array.isArray(fromSearch.children)
                ? fromSearch.children
                    .map((c) => {
                        if (c != null && typeof c === 'object' && 'age' in c) {
                            return { age: Number(c.age) };
                        }
                        const age = Number(c);
                        return Number.isFinite(age) ? { age } : null;
                    })
                    .filter(Boolean)
                : [];
            return {
                adults: Number(fromSearch.adults) || 1,
                children,
            };
        }

        const apiRoom = meta?.search_request?.rooms?.[idx]
            ?? meta?.search_request?.rooms?.[0]
            ?? rate?.metadata?.search_request?.rooms?.[idx]
            ?? rate?.metadata?.search_request?.rooms?.[0];

        if (apiRoom) {
            const children = Array.isArray(apiRoom.children)
                ? apiRoom.children
                    .map((c) => {
                        if (c != null && typeof c === 'object' && 'age' in c) {
                            return { age: Number(c.age) };
                        }
                        const age = Number(c);
                        return Number.isFinite(age) ? { age } : null;
                    })
                    .filter(Boolean)
                : [];
            return {
                adults: Number(apiRoom.adults) || Number(rate?.adults) || 2,
                children,
            };
        }

        return {
            adults: Number(rate?.adults) || 2,
            children: [],
        };
    };

    const handleSelectToggle = (roomid, selectedId, rate, room) => {
        const isSelected = selectedRooms.find((r) => r.ratekey === selectedId);
        const meta = getRateMetadata(rate);
        const seqNo = getRateSeqNo(rate, room);
        const occupancy = resolveOccupancyForSeq(seqNo, rate);

        if (isSelected) {
            setSelectedRooms(selectedRooms.filter((r) => r.ratekey !== selectedId));
            return;
        }

        // Hotelston: only one selectable offer per seq_no (same id + different seq stays OK)
        if (isHotelston && seqNo != null) {
            const seqAlreadyTaken = selectedRooms.some((r) => {
                if (r.ratekey === selectedId) return false;
                const existingSeq = resolveSelectedSeqNo(r, roomData);
                return existingSeq != null && Number(existingSeq) === Number(seqNo);
            });
            if (seqAlreadyTaken) return;
        }

        const nextSelection = {
            roomId: roomid,
            ratekey: selectedId,
            qty: 1,
            roomTypeId: meta?.room_type_id || rate?.metadata?.room_type_id || '',
            boardTypeId: meta?.board_type_id || rate?.metadata?.board_type_id || '',
            adults: occupancy.adults,
            children: occupancy.children,
            ...(isHotelston && seqNo != null ? { seqNo: Number(seqNo) } : {}),
        };

        if (isHotelston && seqNo != null) {
            setSelectedRooms([
                ...selectedRooms.filter((r) => {
                    const existingSeq = resolveSelectedSeqNo(r, roomData);
                    return existingSeq == null || Number(existingSeq) !== Number(seqNo);
                }),
                nextSelection,
            ]);
            return;
        }

        // Hotelston without readable seq: still allow select, but don't mix with locked logic
        setSelectedRooms([...selectedRooms, nextSelection]);
    };

    const handleQuantityChange = (rateKey, quantity) => {
        if (isHotelston) return;
        const updatedRooms = selectedRooms.map((room) => {
            if (room.ratekey === rateKey) {
                return { ...room, qty: quantity };
            }
            return room;
        });
        setSelectedRooms(updatedRooms);
    };

    const isRoomSelected = (selectedId) => {
        return selectedRooms.some((r) => r.ratekey === selectedId);
    };

    /** Hotelston: disable Reserve when another room for the same seq_no is already chosen */
    const isHotelstonSeqLocked = (rate, rateKey, room) => {
        if (!isHotelston) return false;
        const seqNo = getRateSeqNo(rate, room);
        if (seqNo == null) return false;
        if (isRoomSelected(rateKey)) return false;
        return selectedRooms.some((r) => {
            const existingSeq = resolveSelectedSeqNo(r, roomData);
            return existingSeq != null && Number(existingSeq) === Number(seqNo);
        });
    };

    const availableFilters = React.useMemo(() => {
        const filters = {
            boardTypes: new Set(),
            hasFreeBreakfast: false,
            hasFreeCancellation: false,
        };

        roomData.forEach(room => {
            room?.rates?.forEach(rate => {
                if (rate?.board_name) {
                    filters.boardTypes.add(rate.board_name);
                }

                if (rate?.cancellation_policies && Array.isArray(rate.cancellation_policies) && rate.cancellation_policies.length > 0) {
                    const sortedPolicies = [...rate.cancellation_policies].sort((a, b) =>
                        moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
                    );
                    const now = moment.utc();
                    const allDatesInFuture = sortedPolicies.every(policy =>
                        moment.utc(policy.from).isAfter(now)
                    );
                    if (allDatesInFuture) {
                        filters.hasFreeCancellation = true;
                    }
                }

                if (rate?.board_name && (
                    rate.board_name.toLowerCase().includes('breakfast') ||
                    rate.board_name.toLowerCase().includes('bed and breakfast') ||
                    rate.board_name.toLowerCase().includes('bb')
                )) {
                    filters.hasFreeBreakfast = true;
                }
            });
        });

        return {
            ...filters,
            boardTypes: Array.from(filters.boardTypes)
        };
    }, [roomData]);

    const toggleFilter = (filterType, filterValue) => {
        const filterKey = `${filterType}:${filterValue}`;

        setActiveFilters(prev => {
            if (prev.includes(filterKey)) {
                return prev.filter(f => f !== filterKey);
            }
            return [...prev, filterKey];
        });
    };

    React.useEffect(() => {
        if (activeFilters.length === 0) {
            setFilteredRoomData(roomData);
            setShowAllRooms(false);
            return;
        }

        const filtered = roomData.map(room => {
            const filteredRates = room.rates.filter(rate => {
                for (const filter of activeFilters) {
                    const [filterType, filterValue] = filter.split(':');

                    if (filterType === 'breakfast') {
                        const hasBreakfast = rate?.board_name && (
                            rate.board_name.toLowerCase().includes('breakfast') ||
                            rate.board_name.toLowerCase().includes('bed and breakfast') ||
                            rate.board_name.toLowerCase().includes('bb')
                        );
                        if (!hasBreakfast) return false;
                    }

                    if (filterType === 'cancellation') {
                        if (!rate?.cancellation_policies || rate.cancellation_policies.length === 0) return false;
                        const sortedPolicies = [...rate.cancellation_policies].sort((a, b) =>
                            moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
                        );
                        const now = moment.utc();
                        const allDatesInFuture = sortedPolicies.every(policy =>
                            moment.utc(policy.from).isAfter(now)
                        );
                        if (!allDatesInFuture) return false;
                    }

                    if (filterType === 'board') {
                        if (rate?.board_name !== filterValue) return false;
                    }
                }

                return true;
            });

            return { ...room, rates: filteredRates };
        }).filter(room => room.rates.length > 0);

        setFilteredRoomData(filtered);
        setShowAllRooms(false);
    }, [activeFilters, roomData]);

    const visibleRooms = React.useMemo(() => {
        if (showAllRooms || filteredRoomData.length <= ROOMS_PREVIEW_COUNT) {
            return filteredRoomData;
        }
        return filteredRoomData.slice(0, ROOMS_PREVIEW_COUNT);
    }, [filteredRoomData, showAllRooms]);

    const hiddenRoomsCount = Math.max(filteredRoomData.length - ROOMS_PREVIEW_COUNT, 0);

    const isFilterActive = (filterType, filterValue) => {
        return activeFilters.includes(`${filterType}:${filterValue}`);
    };

    function getCancellationSummary(policyArr, Defaultcurrency) {
        if (!Array.isArray(policyArr) || policyArr.length === 0) {
            return { message: 'Non-refundable', type: 'non-refundable' };
        }

        const sortedPolicies = [...policyArr].sort((a, b) =>
            moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
        );

        const now = moment.utc();
        const allDatesInFuture = sortedPolicies.every(policy =>
            moment.utc(policy.from).isAfter(now)
        );

        const nearestPolicy = sortedPolicies[0];
        const nearestDate = moment.utc(nearestPolicy.from);

        if (allDatesInFuture) {
            return {
                message: `Free cancellation before ${nearestDate.format('DD MMMM YYYY')}`,
                type: 'free',
                policy: nearestPolicy
            };
        }

        const passedPolicies = sortedPolicies.filter(policy =>
            !moment.utc(policy.from).isAfter(now)
        );
        const currentPolicy = passedPolicies[passedPolicies.length - 1];

        const ConvertedAmount = ConvertPrice(currentPolicy?.amount, Defaultcurrency, currency, rates);
        return {
            message: `Cancellation fee: ${ConvertedAmount.newcurrency} ${ConvertedAmount.newprice}`,
            type: 'fee',
            policy: currentPolicy
        };
    }

    function handleViewPolicy(policyArr, currencyVal) {
        setModalPolicy({ policies: policyArr, currency: currencyVal });
        setShowModal(true);
    }

    useEffect(() => {
        if (!showModal) return undefined;

        const html = document.documentElement;
        const body = document.body;
        const scrollbarWidth = window.innerWidth - html.clientWidth;

        const prev = {
            htmlOverflow: html.style.overflow,
            bodyOverflow: body.style.overflow,
            bodyPaddingRight: body.style.paddingRight,
        };

        html.style.overflow = 'hidden';
        body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            html.style.overflow = prev.htmlOverflow;
            body.style.overflow = prev.bodyOverflow;
            body.style.paddingRight = prev.bodyPaddingRight;
        };
    }, [showModal]);

    function CancellationModal() {
        if (!showModal || !modalPolicy) return null;

        const sortedPolicies = [...modalPolicy.policies].sort((a, b) =>
            moment.utc(a.from).valueOf() - moment.utc(b.from).valueOf()
        );
        const firstFrom = moment.utc(sortedPolicies[0].from);

        return (
            <div
                className={styles.policyModal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="room-policy-modal-title"
                onClick={() => setShowModal(false)}
            >
                <div className={styles.policyModalDialog} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.policyModalHeader}>
                        <div className={styles.policyModalHeaderText}>
                            <h5 id="room-policy-modal-title">Cancellation policy</h5>
                            <p>Timeline of refund windows and applicable fees</p>
                        </div>
                        <button
                            type="button"
                            className={styles.policyModalClose}
                            onClick={() => setShowModal(false)}
                            aria-label="Close cancellation policy"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className={styles.policyModalBody}>
                        <div className={`${styles.policyItem} ${styles.policyItemRefund}`}>
                            <div className={styles.policyItemIcon} aria-hidden="true">
                                <FaCheckCircle />
                            </div>
                            <div className={styles.policyItemContent}>
                                <div className={styles.policyItemTop}>
                                    <div className={styles.policyItemWhen}>
                                        <span className={styles.policyItemLabel}>Before</span>
                                        <span className={styles.policyItemDate}>{firstFrom.format('MMM DD, YYYY')}</span>
                                    </div>
                                    <span className={`${styles.policyBadge} ${styles.policyBadgeRefund}`}>Full refund</span>
                                </div>
                                <p className={styles.policyItemDesc}>
                                    Cancel your reservation before {firstFrom.format('MMM DD [at] hh:mm A')}, and you&apos;ll get a full refund.
                                </p>
                            </div>
                        </div>

                        {sortedPolicies.map((policy, idx) => {
                            const dateObj = moment.utc(policy.from);
                            return (
                                <div key={idx} className={`${styles.policyItem} ${styles.policyItemFee}`}>
                                    <div className={styles.policyItemIcon} aria-hidden="true">
                                        <FaBan />
                                    </div>
                                    <div className={styles.policyItemContent}>
                                        <div className={styles.policyItemTop}>
                                            <div className={styles.policyItemWhen}>
                                                <span className={styles.policyItemLabel}>From</span>
                                                <span className={styles.policyItemDate}>{dateObj.format('MMM DD, YYYY')}</span>
                                            </div>
                                            <span className={`${styles.policyBadge} ${styles.policyBadgeFee}`}>
                                                <PriceDisplay price={policy.amount} currency={modalPolicy.currency} /> fee
                                            </span>
                                        </div>
                                        <p className={styles.policyItemDesc}>
                                            From {dateObj.format('MMM DD [at] hh:mm A')}, a cancellation fee of{' '}
                                            <strong><PriceDisplay price={policy.amount} currency={modalPolicy.currency} /></strong> will be charged.
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <CancellationModal />
            <FacilitiesModal
                opened={roomFacilitiesModal.open}
                onClose={() => setRoomFacilitiesModal({ open: false, roomName: '', facilities: [] })}
                title="Room Facilities"
                subtitle={roomFacilitiesModal.roomName}
                facilities={roomFacilitiesModal.facilities}
            />

            <section className="hotel-detail-card hotel-detail-rooms-section">
                <h3 className="hotel-detail-card__title hotel-detail-card__title--icon">
                    <HiOutlineBuildingOffice2 />
                    Select Room Type
                </h3>

                <div className="hotel-detail-room-filters">
                    <div className="hotel-detail-room-filters__pills">
                        {availableFilters.hasFreeBreakfast && (
                            <button
                                type="button"
                                onClick={() => toggleFilter('breakfast', 'included')}
                                className={`hotel-detail-filter-pill ${isFilterActive('breakfast', 'included') ? 'is-active' : ''}`}
                            >
                                Breakfast Included
                            </button>
                        )}
                        {availableFilters.hasFreeCancellation && (
                            <button
                                type="button"
                                onClick={() => toggleFilter('cancellation', 'free')}
                                className={`hotel-detail-filter-pill ${isFilterActive('cancellation', 'free') ? 'is-active' : ''}`}
                            >
                                Free Cancellation
                            </button>
                        )}
                        {availableFilters.boardTypes.map((boardType, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => toggleFilter('board', boardType)}
                                className={`hotel-detail-filter-pill ${isFilterActive('board', boardType) ? 'is-active' : ''}`}
                            >
                                {boardType}
                            </button>
                        ))}
                    </div>
                    {activeFilters.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setActiveFilters([])}
                            className="hotel-detail-filter-clear"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {filteredRoomData.length === 0 ? (
                    <div className="hotel-detail-empty">No rooms match your selected filters.</div>
                ) : (
                    <div className={styles.roomsLayout}>
                        <div className={styles.roomsMain}>
                            <div className={styles.roomTypeGrid}>
                                {visibleRooms.map((room, index) => {
                                    const minRate = getMinRate(room);
                                    if (!minRate) return null;
                                    const guestCount = minRate?.adults || 2;
                                    const childCount = Number(minRate?.children) || 0;
                                    const cancelSummary = getCancellationSummary(minRate?.cancellation_policies, minRate?.currency);
                                    const hasBreakfast = minRate?.board_name && (
                                        minRate.board_name.toLowerCase().includes('breakfast') ||
                                        minRate.board_name.toLowerCase().includes('bed and breakfast') ||
                                        minRate.board_name.toLowerCase().includes('bb')
                                    );
                                    return (
                                        <article key={`preview-${room?.id}-${minRate?.rate_key || index}`} className={styles.roomTypeCard}>
                                            <div className={styles.roomTypeCardImageWrap}>
                                                <Image
                                                    className={styles.roomTypeCardImage}
                                                    src={room?.images?.length ? room.images[0]?.url : '/images/noimage.png'}
                                                    height={140}
                                                    width={260}
                                                    alt={room?.name || 'Room'}
                                                />
                                            </div>
                                            <div className={styles.roomTypeCardBody}>
                                                <h4 className={styles.roomTypeCardTitle}>{room?.name}</h4>
                                                {room?.amenities?.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openRoomFacilitiesModal(room)}
                                                        className={styles.roomTypeCardAmenitiesLink}
                                                    >
                                                        View Amenities <FaAngleDown />
                                                    </button>
                                                )}

                                                <div className={styles.roomTypeRateBox}>
                                                    <div className="d-flex gap-2 align-items-center">
                                                        {minRate?.board_name && (
                                                            <p className={styles.roomTypeBoardName}>{minRate.board_name}</p>
                                                        )}
                                                        {hasBreakfast && (
                                                            <span className={styles.roomTypeBreakfastBadge}>Daily breakfast</span>
                                                        )}
                                                    </div>
                                                    <p className={styles.roomTypeOccupancy}>
                                                        Adults {guestCount} · Child {childCount}
                                                    </p>
                                                    <p className={`${styles.roomTypeCancel} ${cancelSummary.type === 'free'
                                                        ? styles.roomTypeCancelFree
                                                        : cancelSummary.type === 'non-refundable'
                                                            ? styles.roomTypeCancelNonRef
                                                            : styles.roomTypeCancelFee
                                                        }`}>
                                                        {cancelSummary.message}
                                                        {minRate?.cancellation_policies?.length > 0 && (
                                                            <MdInfoOutline
                                                                size={14}
                                                                className={styles.roomTypeCancelInfo}
                                                                onClick={() => handleViewPolicy(minRate.cancellation_policies, minRate.currency)}
                                                            />
                                                        )}
                                                    </p>
                                                    {minRate?.on_request && (
                                                        <span className={styles.roomTypeOnRequest}>On Request</span>
                                                    )}
                                                    <div className={styles.roomTypeFooter}>
                                                        <div className={styles.roomTypeTotalRow}>
                                                            <div>
                                                                <span className={styles.roomTypeNights}>
                                                                    {totalNights} night{totalNights > 1 ? 's' : ''}
                                                                </span>
                                                                <p className={styles.roomTypeTotalPrice}>
                                                                    <PriceDisplay price={minRate.price} currency={minRate.currency} />
                                                                </p>
                                                                <span className={styles.roomTypeVat}>Vat and Taxes included</span>
                                                            </div>
                                                            <div className={styles.roomTypeRightCol}>
                                                                <p className={styles.roomTypePerNight}>
                                                                    <PriceDisplay price={minRate.price / totalNights} currency={minRate.currency} />
                                                                    <span> / night</span>
                                                                </p>
                                                                {!isRoomSelected(minRate.rate_key) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (isHotelstonSeqLocked(minRate, minRate.rate_key, room)) return;
                                                                            handleSelectToggle(room?.id, minRate.rate_key, minRate, room);
                                                                        }}
                                                                        className={styles.roomTypeCardBtn}
                                                                        disabled={isHotelstonSeqLocked(minRate, minRate.rate_key, room)}
                                                                        title={
                                                                            isHotelstonSeqLocked(minRate, minRate.rate_key, room)
                                                                                ? 'A room for this guest group is already selected'
                                                                                : undefined
                                                                        }
                                                                    >
                                                                        Reserve
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {isRoomSelected(minRate.rate_key) && (
                                                            <div className={styles.roomTypeSelectedActions}>
                                                                {!isHotelston && (
                                                                    <Select
                                                                        className={styles.qtySelect}
                                                                        value={
                                                                            String(
                                                                                selectedRooms.find(r => r.ratekey === minRate.rate_key)?.qty || 1
                                                                            )
                                                                        }
                                                                        onChange={(value) =>
                                                                            handleQuantityChange(minRate.rate_key, Number(value))
                                                                        }
                                                                        data={Array.from(
                                                                            { length: Math.max(Number(minRate?.allotment) || 1, 1) },
                                                                            (_, i) => ({
                                                                                value: String(i + 1),
                                                                                label: `${i + 1}`,
                                                                            })
                                                                        )}
                                                                        placeholder="1"
                                                                    />
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSelectToggle(room?.id, minRate.rate_key, minRate, room)}
                                                                    className={styles.roomTypeCardBtnOutline}
                                                                >
                                                                    <CiTrash className={styles.removeRoomIcon} aria-hidden />
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            {hiddenRoomsCount > 0 && (
                                <button
                                    type="button"
                                    className={styles.showMoreRoomsBtn}
                                    onClick={() => setShowAllRooms((prev) => !prev)}
                                >
                                    {showAllRooms ? (
                                        <>Show less <FaAngleUp /></>
                                    ) : (
                                        <>Show more ({hiddenRoomsCount} more) <FaAngleDown /></>
                                    )}
                                </button>
                            )}
                        </div>

                        <aside className={styles.roomsSidebar}>
                            <RoomSummery
                                selectedRooms={selectedRooms}
                                roomList={roomData}
                                detail={hotelDetail}
                                variant="sidebar"
                                hotelstonRequiredCount={hotelstonRequiredSeqCount}
                            />
                        </aside>
                    </div>
                )}
            </section>

            <section className="hotel-detail-card">
                <h3 className="hotel-detail-card__title hotel-detail-card__title--icon">
                    <FiClock />
                    Stay Details
                </h3>
                <div className="hotel-detail-stay-grid">
                    <div className="hotel-detail-stay-box">
                        <span className="hotel-detail-stay-box__label">Check-in</span>
                        <strong>{hotelDetail?.checkIn ? moment(hotelDetail.checkIn).format('DD MMM YYYY') : '—'}</strong>
                        <small>From 14:00</small>
                    </div>
                    <div className="hotel-detail-stay-box">
                        <span className="hotel-detail-stay-box__label">Check-out</span>
                        <strong>{hotelDetail?.checkOut ? moment(hotelDetail.checkOut).format('DD MMM YYYY') : '—'}</strong>
                        <small>Before 12:00</small>
                    </div>
                </div>
            </section>

            {(lat && lng) || hotelDetail?.address ? (
                <section className="hotel-detail-map-section">
                    <div className="hotel-detail-map-wrap">
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hotel-detail-open-maps-btn"
                        >
                            Open in Maps
                            <FiExternalLink />
                        </a>
                        <iframe
                            title="Hotel location map"
                            className="hotel-detail-map-frame"
                            src={mapEmbedUrl}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </section>
            ) : null}

        </>
    );
}
