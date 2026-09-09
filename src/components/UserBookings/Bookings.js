'use client'
import React, { useState, useEffect } from 'react'
import { Input } from '@mantine/core';
import { FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import moment from 'moment';
export default function Bookings({ email, resetToStep0 }) {
    const [isLoading, setIsLoading] = useState(false);
    const [bookingList, setBookingList] = useState([]);
    useEffect(() => {
        handleVerifyOtp();
    }, []);
    const handleVerifyOtp = async () => {
        setIsLoading(true);
        try {
            const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hotel/customer/booking/details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify({ "holder_email": email }),
            });
            const res = await responses.json();
            setIsLoading(false);
            // console.log(res)
            if (res.success) {
                setBookingList(res?.data?.bookings);
            } else {
                setError(res?.message)
            }
        } catch (err) {
            setIsLoading(false);
            console.error("Error fetching hotel details:", err);
        }
    };

    return (
        <div className='container my-5'>
            <div className='d-flex justify-content-between align-items-center'>
                <div>
                    <h3>My Bookings</h3>
                    <p className='text-muted'>Manage and track all your reservations</p>
                </div>
                <button onClick={resetToStep0} className='btn btn-outline-danger small'>Close Bookings</button>
            </div>
            <div className='mt-4'>
                <Input placeholder="Search by location, hotel name, status..." leftSection={<FaSearch size={16} />} />
            </div>
            <div>
                {bookingList.map((item, index) => (
                    <div key={index} className=" mt-4 card rounded-1 border">
                        <div className="card-header border-bottom d-md-flex justify-content-md-between align-items-center">
                            <div className="d-flex align-items-center">
                                <div className="ms-2">
                                    <h6 className="card-title mb-0">{item?.hotel?.name}</h6>
                                    <ul className="nav nav-divider small" translate="no">
                                        <li className="nav-item">Invoice No: {item?.invoice_number}<br /> Price: {item?.currency} {item?.pricing?.booking_amount}</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-2 mt-md-0">
                                <p className={`text-center ${item?.booking_status === 'confirmed' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger' } bg-success-subtle text-success p-1 rounded-1 mb-0`}>{item?.booking_status}</p>
                            </div>
                            <div className="mt-2 mt-md-0">
                                <Link translate="no" href={`/hotels/voucher/${item?.invoice_number}`} target="_blank" rel="noopener noreferrer">
                                    <p className="btn btn-primary mb-0">View Voucher</p>
                                </Link>
                            </div>
                        </div>
                        <div className="card-body ">
                            <div className="row g-3" translate="no">
                                <div className="col-sm-6 col-md-3">
                                    <span>Check in</span><h6 className="mb-0">{moment(item?.hotel_details?.checkIn).format('ll')}</h6>
                                </div>
                                <div className="col-sm-6 col-md-3"><span>Check out</span><h6 className="mb-0">{moment(item?.hotel_details?.checkOut).format('ll')}</h6>
                                </div>
                                <div className="col-md-3"><span>Booked by</span><h6 className="mb-0">{item?.holder_details?.title} {item?.holder_details?.surname}</h6>
                                </div>
                                <div className="col-md-3"><span>Booking Date</span><h6 className="mb-0">{moment(item?.created_at).format('ll')}</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
