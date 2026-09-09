'use client'
import React, { useState, useEffect } from 'react'
import { Modal } from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/navigation'
import styles from './AiSearchRes.module.css';
export default function HotelAiSearch({ searchResponse }) {
    const router = useRouter()
    const [modalOpened, setModalOpened] = useState(true)
    const [dateRange, setDateRange] = useState([])
    const [breakPoint, setBreakPoint] = useState(false)

    useEffect(() => {
        setBreakPoint(window.innerWidth <= 500)

        // Check if dates are missing and open modal
        if (!searchResponse.checkIn || !searchResponse.checkOut) {
            setDateRange([searchResponse.checkIn || null, searchResponse.checkOut || null])
            setModalOpened(true)
        } else {
            // If dates are present, navigate directly
            navigateToHotels(searchResponse.checkIn, searchResponse.checkOut)
        }
    }, [searchResponse])

    const navigateToHotels = (checkIn, checkOut) => {
        const queryParams = new URLSearchParams()
        queryParams.set('checkIn', checkIn)
        queryParams.set('checkOut', checkOut)
        queryParams.set('currency', 'GBP')

        // Destination
        queryParams.set('city', searchResponse.destination?.city || '')
        queryParams.set('lat', searchResponse.destination?.latitude || '')
        queryParams.set('lng', searchResponse.destination?.longitude || '')
        queryParams.set('code', searchResponse.destination?.countryCode || '')
        queryParams.set('location', searchResponse.destination?.city || '')
        queryParams.set('place', searchResponse.destination?.city || '')
        queryParams.set('country', searchResponse.destination?.countryCode || '')

        // Store rooms data in localStorage
        if (searchResponse.rooms && searchResponse.rooms.length > 0) {
            localStorage.setItem('searchRoomSelection', JSON.stringify(searchResponse.rooms))
        }
        setModalOpened(false)
        router.push(`/hotels?${queryParams.toString()}`)
    }

    const handleDateSubmit = () => {
        if (!dateRange || dateRange.length !== 2 || !dateRange[0] || !dateRange[1]) {
            notifications.show({
                autoClose: 2000,
                title: 'Error',
                message: 'Please select both check-in and check-out dates',
                color: 'red',
            })
            return
        }
        const checkIn = dateRange[0]
        const checkOut = dateRange[1]

        // setModalOpened(false)
        navigateToHotels(checkIn, checkOut)
    }

    const handleDateChange = (value) => {
        let newValue = value
        if (!value[0] && !value[1]) {
            newValue = []
        }
        setDateRange(newValue)
    }

    return (
        <>
            <Modal
                opened={modalOpened}
                onClose={() => setModalOpened(false)}
                title="Select Check-in & Check-out Dates"
                centered
                className={styles.aihoteldaterange}
                size="auto"
            >
                <div className="p-2">
                    <DatePicker className='my-3' type="range" value={dateRange} onChange={handleDateChange} numberOfColumns={breakPoint ? 1 : 2} valueFormat="DD-MM-YYYY" minDate={new Date()} />
                    <div className="d-flex gap-2 mt-3 justify-content-end">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => setModalOpened(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-success bg-color"
                            onClick={handleDateSubmit}
                            disabled={!dateRange || dateRange.length !== 2}
                        >
                            Continue to Search
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
