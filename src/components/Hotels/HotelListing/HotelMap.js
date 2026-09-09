"use client";

import { GoogleMap, LoadScriptNext, Marker, InfoWindow } from "@react-google-maps/api";
import { useState, useEffect } from "react";
import { Modal } from "@mantine/core";
import { FaStar } from "react-icons/fa";
import { ConvertPrice } from "@/components/Currency/ConvertPrice";
import Link from "next/link";
import { ProviderCodeList } from '@/util/ProviderCodeList';
import { useCurrency } from "@/util/currency";
const containerStyle = { width: "100%", height: "90vh", };
export default function HotelMap({ hotels = [], lat, long }) {
    const [modalChange, setModalChange] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState();
    const [map, setMap] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [mapCenter, setMapCenter] = useState({ lat: Number(lat), lng: Number(long) });
    const { currency, rates } = useCurrency();

    // Delay map render until modal is visibly open
    useEffect(() => {
        let timer;
        if (modalChange) {
            timer = setTimeout(() => setShowMap(true), 500);
        } else {
            setShowMap(false);
        }
        return () => clearTimeout(timer);
    }, [modalChange]);
    const ProviderShortNames = (provider) => {
        if (!provider) return '';
        const providerFind = ProviderCodeList.find(item => item.name === provider.toLowerCase());
        return providerFind?.code;
    };
    const SetRoomsData = (id) => {
        const selectedHotel = hotels.find(hotel => hotel.id === id);
        if (selectedHotel) {
            localStorage.setItem('roomSelection', JSON.stringify(selectedHotel.rooms));
            localStorage.setItem('selectedHotelMeta', JSON.stringify({
                id: selectedHotel.id,
                stars: selectedHotel.metadata?.stars ?? null,
            }));
        }
    };
    const makingSlug = (name) => {
        return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    };
    
    return (
        <div className="mb-4">
            {/* Small map preview with overlay */}
            <div className="position-relative" style={{ width: "100%", height: "200px" }}>
                <iframe
                    width="100%"
                    height="200"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://maps.google.com/maps?q=${lat},${long}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                    style={{ border: "0", borderRadius: "8px" }}
                ></iframe>

                {/* Overlay with button */}
                <div
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        borderRadius: "8px",
                    }}
                >
                    <button
                        className="btn btn-success px-4 py-2"
                        onClick={() => setModalChange(true)}
                    >
                        Show on Map
                    </button>
                </div>
            </div>

            {/* Fullscreen Modal */}
            <Modal
                opened={modalChange}
                onClose={() => setModalChange(false)}
                title="Map View"
                fullScreen
                radius={0}
                transitionProps={{ transition: "fade", duration: 200 }}
            >
                {/* Google Map */}
                {showMap && lat && long && (
                    <LoadScriptNext googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={mapCenter}
                            zoom={14}
                            onLoad={(map) => setMap(map)}
                            options={{
                                gestureHandling: 'greedy',
                            }}
                        >
                            {map && hotels.map((hotel, index) => {
                                const {newcurrency , newprice} = ConvertPrice(hotel.metadata?.min_price , hotel.metadata?.currency , currency , rates);

                                // SVG path: Rounded rectangle + drop anchor
                                // Only create marker if google maps is loaded
                                if (!window.google || !window.google.maps) return null;

                                const svgMarker = {
                                    path: "M0,0 h80 a5,5 0 0 1 5,5 v25 a5,5 0 0 1 -5,5 h-35 l-5,8 l-5,-8 h-35 a5,5 0 0 1 -5,-5 v-25 a5,5 0 0 1 5,-5 z",
                                    fillColor: "#0056D2",
                                    fillOpacity: 1,
                                    strokeWeight: 0,
                                    scale: 1,
                                    anchor: new window.google.maps.Point(40, 43), // anchor below tip
                                    labelOrigin: new window.google.maps.Point(40, 18), // center text
                                };

                                return (
                                    <Marker
                                        key={index}
                                        position={{
                                            lat: Number(hotel.location.latitude),
                                            lng: Number(hotel.location.longitude),
                                        }}
                                        onClick={() => setSelectedHotel(hotel)}   // 🟢 Hover start
                                        // onMouseOut={() => setSelectedHotel(null)}
                                        icon={svgMarker}

                                        label={{
                                            text: `${newcurrency} ${newprice}`,
                                            color: "#fff",
                                            fontSize: "12px",
                                            fontWeight: "bold",
                                        }}
                                    />
                                );
                            })}
                            {selectedHotel && window.google && window.google.maps && (
                                <InfoWindow
                                    position={{
                                        lat: Number(selectedHotel.location.latitude),
                                        lng: Number(selectedHotel.location.longitude),
                                    }}
                                    options={{
                                        pixelOffset: new window.google.maps.Size(0, -50),
                                    }}
                                    onCloseClick={() => setSelectedHotel(null)}
                                >
                                    <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                                        {selectedHotel.name}
                                        <div>
                                            {Number(selectedHotel.metadata?.stars) > 0 &&
                                                Array(Number(selectedHotel.metadata?.stars))
                                                    .fill(0)
                                                    .map((_, i) => (
                                                        <FaStar key={i} className="text-warning me-1" />
                                                    ))}
                                        </div>
                                        <Link target="_blank" className="mt-2" onClick={() => SetRoomsData(selectedHotel.id)} href={`/hotels/${makingSlug(selectedHotel.name)}?id=${selectedHotel.id}&code=${ProviderShortNames(selectedHotel.provider)}`}>
                                            <button className="btn btn-primary btn-sm">View Detail</button>
                                        </Link>
                                    </div>
                                </InfoWindow>
                            )}

                        </GoogleMap>
                    </LoadScriptNext>
                )}
            </Modal>
        </div>
    );
}
