'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import locationData from '../../../data.json';

const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);

function LocationPicker({ onLocationSelect, initialPosition, cityCode, districtCode, wardCode }: any) {
    const [position, setPosition] = useState(initialPosition);
    const [isClient, setIsClient] = useState(false);
    const [map, setMap] = useState<any>(null);

    useEffect(() => {
        setIsClient(true);
        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
        }
    }, []);

    // Update map position when location selection changes
    useEffect(() => {
        if (!map) return;

        // Find location coordinates from data.json
        let targetLat: number | null = null;
        let targetLng: number | null = null;
        let zoomLevel = 13;

        if (cityCode) {
            const city = locationData.cities.find(c => c.city_code === cityCode);
            if (city) {
                targetLat = city.lat;
                targetLng = city.long;
                zoomLevel = 11;

                if (districtCode) {
                    const district = city.districts.find(d => d.district_code === districtCode);
                    if (district) {
                        targetLat = district.lat;
                        targetLng = district.long;
                        zoomLevel = 13;

                        if (wardCode) {
                            const ward = district.wards.find(w => w.ward_code === wardCode);
                            if (ward) {
                                targetLat = ward.lat;
                                targetLng = ward.long;
                                zoomLevel = 15;
                            }
                        }
                    }
                }
            }
        }

        // Pan and zoom to the location
        if (targetLat && targetLng) {
            const newPos: [number, number] = [targetLat, targetLng];
            setPosition(newPos);
            map.flyTo(newPos, zoomLevel, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [cityCode, districtCode, wardCode, map]);

    // Sync position with initialPosition prop changes
    useEffect(() => {
        if (initialPosition[0] !== position[0] || initialPosition[1] !== position[1]) {
            setPosition(initialPosition);
            if (map) {
                map.flyTo(initialPosition, map.getZoom(), {
                    duration: 1
                });
            }
        }
    }, [initialPosition, map]);

    const MapEvents = () => {
        const { useMapEvents } = require('react-leaflet');
        const mapInstance = useMapEvents({
            click(e: any) {
                const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
                setPosition(newPos);
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            },
        });

        // Store map instance
        useEffect(() => {
            setMap(mapInstance);
        }, [mapInstance]);

        return null;
    };

    if (!isClient) return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;

    return (
        <MapContainer 
            center={position} 
            zoom={13} 
            style={{ height: '350px', width: '100%', borderRadius: '1rem', zIndex: 0 }}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapEvents />
            <Marker position={position} />
        </MapContainer>
    );
}

export default LocationPicker;
