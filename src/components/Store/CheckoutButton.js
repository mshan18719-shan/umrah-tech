'use client'
import React, { useState } from 'react'
import { useUmrahPackage } from '@/contexts/UmrahPackageContext';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { useCurrency } from '@/util/currency';
import { ConvertPrice } from '../Currency/ConvertPrice';
export default function CheckoutButton() {
    const { packageData, selections } = useUmrahPackage();
    // const [rates, setRates] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    
    const fetchCurrencyRates = async () => {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${process.env.NEXT_PUBLIC_CURRENCY_KEY}/latest/${packageData?.currency}`);
        const data = await response.json();
        return data.conversion_rates  || {[packageData?.currency] : 1};
    }
    // Handle proceed to checkout with API call
    const handleProceedToCheckout = async () => {
        setIsLoading(true);
       const rates = await fetchCurrencyRates();
        try {
            // Deep clone packageData to avoid mutating the original
            const updatedPackageData = JSON.parse(JSON.stringify(packageData));

            // Update Makkah Hotel flags based on selection
            if (updatedPackageData.makkah_hotel?.rooms) {
                updatedPackageData.makkah_hotel.rooms.forEach((room, roomIdx) => {
                    const isSelectedRoom = roomIdx === selections.makkahHotel.roomIndex;

                    if (isSelectedRoom) {
                        room.selected_for_package = true;
                        room.price_added_to_package = true;
                        updatedPackageData.makkah_hotel.selected_room_id = room.id;
                    } else {
                        delete room.selected_for_package;
                        delete room.price_added_to_package;
                    }

                    room.rates.forEach((rate, rateIdx) => {
                        const isSelectedRate = isSelectedRoom && rateIdx === selections.makkahHotel.rateIndex;

                        if (isSelectedRate) {
                            rate.selected_for_package = true;
                            rate.price_added_to_package = true;
                            updatedPackageData.makkah_hotel.selected_rate_key = rate.rate_key;
                        } else {
                            delete rate.selected_for_package;
                            delete rate.price_added_to_package;
                        }
                    });
                });
                updatedPackageData.makkah_hotel.selected_rate_index = selections.makkahHotel.rateIndex;
                updatedPackageData.makkah_hotel.selected_room_index = selections.makkahHotel.roomIndex;

                const makkahSelectedRoom = updatedPackageData.makkah_hotel.rooms?.[selections.makkahHotel.roomIndex];
                const makkahSelectedRate = makkahSelectedRoom?.rates?.[selections.makkahHotel.rateIndex];
                updatedPackageData.makkah_hotel.selected_room_name = makkahSelectedRoom?.name || '';
                updatedPackageData.makkah_hotel.selected_board_name = makkahSelectedRate?.board_name || '';
            }

            // Update Madinah Hotel flags based on selection
            if (updatedPackageData.madinah_hotel?.rooms) {
                updatedPackageData.madinah_hotel.rooms.forEach((room, roomIdx) => {
                    const isSelectedRoom = roomIdx === selections.madinahHotel.roomIndex;

                    if (isSelectedRoom) {
                        room.selected_for_package = true;
                        room.price_added_to_package = true;
                        updatedPackageData.madinah_hotel.selected_room_id = room.id;
                    } else {
                        delete room.selected_for_package;
                        delete room.price_added_to_package;
                    }

                    room.rates.forEach((rate, rateIdx) => {
                        const isSelectedRate = isSelectedRoom && rateIdx === selections.madinahHotel.rateIndex;

                        if (isSelectedRate) {
                            rate.selected_for_package = true;
                            rate.price_added_to_package = true;
                            updatedPackageData.madinah_hotel.selected_rate_key = rate.rate_key;
                        } else {
                            delete rate.selected_for_package;
                            delete rate.price_added_to_package;
                        }
                    });
                });
                updatedPackageData.madinah_hotel.selected_rate_index = selections.madinahHotel.rateIndex;
                updatedPackageData.madinah_hotel.selected_room_index = selections.madinahHotel.roomIndex;

                const madinahSelectedRoom = updatedPackageData.madinah_hotel.rooms?.[selections.madinahHotel.roomIndex];
                const madinahSelectedRate = madinahSelectedRoom?.rates?.[selections.madinahHotel.rateIndex];
                updatedPackageData.madinah_hotel.selected_room_name = madinahSelectedRoom?.name || '';
                updatedPackageData.madinah_hotel.selected_board_name = madinahSelectedRate?.board_name || '';
            }

            // Calculate total count
            const totalCount = updatedPackageData.original_request.adult + updatedPackageData.original_request.child;
            // Calculate Makkah Hotel Price based on selection

            let makkahHotelPrice = 0;
            if (selections.makkahHotel.roomIndex !== null && selections.makkahHotel.rateIndex !== null) {
                const selectedRoom = updatedPackageData.makkah_hotel?.rooms?.[selections.makkahHotel.roomIndex];
                const selectedRate = selectedRoom?.rates?.[selections.makkahHotel.rateIndex];
                const conversionMakkah = ConvertPrice(selectedRate?.price, selectedRate.currency, packageData?.currency, rates);
                makkahHotelPrice = parseFloat(conversionMakkah.newprice || 0);
            }

            // Calculate Madinah Hotel Price based on selection
            let madinahHotelPrice = 0;
            if (selections.madinahHotel.roomIndex !== null && selections.madinahHotel.rateIndex !== null) {
                const selectedRoom = updatedPackageData.madinah_hotel?.rooms?.[selections.madinahHotel.roomIndex];
                const selectedRate = selectedRoom?.rates?.[selections.madinahHotel.rateIndex];
                const conversionMadinah = ConvertPrice(selectedRate?.price, selectedRate.currency, packageData?.currency, rates);
                madinahHotelPrice = parseFloat(conversionMadinah.newprice || 0);
            }
            // Calculate Flight Price based on selection
            let flightPrice = 0;

            if (selections.customFlight) {
                // User selected a custom flight
                const conversionFlight = ConvertPrice(selections.customFlight.pricing.total_amount, selections.customFlight.pricing.currency, packageData?.currency, rates);
                flightPrice = parseFloat(conversionFlight.newprice || 0);
                // Replace the entire flight object
                updatedPackageData.flight = selections.customFlight;
            } else if (updatedPackageData.flight) {
                // Use default flight price
                const conversionFlight = ConvertPrice(updatedPackageData.pricing?.flight_price, updatedPackageData.pricing?.currency, packageData?.currency, rates);
                flightPrice = parseFloat(conversionFlight.newprice || 0);
            }

            // Calculate Transfer Price based on selection
            let transferPrice = 0;
            let selectedTransfer = null;
            if (selections.otherServices?.transfer_selected_id !== null && selections.otherServices?.transfer_selected_id !== undefined) {
                selectedTransfer = updatedPackageData.transfers?.find(t => t.id === Number(selections.otherServices.transfer_selected_id));
                const conversionTransfer = ConvertPrice(selectedTransfer?.fare, selectedTransfer.currency, packageData?.currency, rates);
                transferPrice = parseFloat(conversionTransfer.newprice || 0);
            }

            // Calculate Visa Price based on selection
            let visaPrice = 0;
            let selectedVisa = null;
            if (selections.otherServices?.visa_selected_id !== null && selections.otherServices?.visa_selected_id !== undefined) {
                selectedVisa = updatedPackageData.visas?.find(v => v.id === Number(selections.otherServices.visa_selected_id));
                const conversionTransfer = ConvertPrice(selectedVisa?.visa_price, selectedVisa.currency, packageData?.currency, rates);
                visaPrice = Number(conversionTransfer?.newprice || 0) * Number(totalCount);
            }

            // Calculate New Total Price
            const newTotalPrice = makkahHotelPrice + madinahHotelPrice + flightPrice + transferPrice + visaPrice;
            const pricePerPerson = newTotalPrice / totalCount;

            // Update package data with new pricing
            updatedPackageData.total_price = newTotalPrice;

            const requestData = {
                ...updatedPackageData,
                transfer_selected_id: selections.otherServices?.transfer_selected_id,
                visa_selected_id: selections.otherServices?.visa_selected_id,
                transfer: selectedTransfer,
                visa: selectedVisa,
                pricing: {
                    ...updatedPackageData.pricing,
                    makkah_hotel_price: makkahHotelPrice,
                    madinah_hotel_price: madinahHotelPrice,
                    flight_price: flightPrice,
                    transfer_price: transferPrice,
                    visa_price: visaPrice,
                    total_price: Number(newTotalPrice).toFixed(2),
                    price_per_person: Number(pricePerPerson).toFixed(2)
                }
            };
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customized/packages/tempCart/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (result.Success) {
                sessionStorage.setItem(`umrah_checkout_${result.Content.package_id}`, JSON.stringify({
                    makkah: {
                        roomName: updatedPackageData.makkah_hotel?.selected_room_name || '',
                        boardName: updatedPackageData.makkah_hotel?.selected_board_name || '',
                    },
                    madinah: {
                        roomName: updatedPackageData.madinah_hotel?.selected_room_name || '',
                        boardName: updatedPackageData.madinah_hotel?.selected_board_name || '',
                    },
                }));
                sessionStorage.removeItem('umrah_package_selections');
                router.push('/umrah-getaway/checkout?packageId=' + result.Content.package_id);
            } else {
                console.error('Failed to add to cart:', result);
                notifications.show({
                    title: 'Error',
                    message: result.Message || 'Failed to add to cart. Please try again.',
                    color: 'red'
                });
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('An error occurred while processing your request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className='text-end mt-4'>
            <button
                className='btn btn-success px-5'
                onClick={handleProceedToCheckout}
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                    </>
                ) : (
                    'Proceed to Checkout'
                )}
            </button>
        </div>
    )
}
