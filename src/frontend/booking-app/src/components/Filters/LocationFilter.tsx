'use client';

import { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import locationData from '../../app/data.json';

interface LocationFilterProps {
  value: {
    city: string;
    district: string;
    ward: string;
  };
  onChange: (value: { city: string; district: string; ward: string }) => void;
}

export default function LocationFilter({ value, onChange }: LocationFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    if (isOpen) {
      setTempValue(value);
    }
  }, [isOpen, value]);

  // Get available districts based on selected city
  const availableDistricts = tempValue.city
    ? locationData.cities.find((c) => c.city_name === tempValue.city)?.districts || []
    : [];

  // Get available wards based on selected district
  const availableWards = tempValue.district
    ? availableDistricts.find((d) => d.district_name === tempValue.district)?.wards || []
    : [];

  const handleApply = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempValue({ city: '', district: '', ward: '' });
  };

  // Get display text for the button
  const getDisplayText = () => {
    if (!value.city) return 'Vị trí';

    if (value.ward) {
      return `${value.ward}, ${value.district}`;
    }
    if (value.district) {
      return value.district;
    }
    return value.city;
  };

  const isFiltered = value.city !== '' || value.district !== '' || value.ward !== '';

  return (
    <div className="relative">
      {/* Trigger Button - Booking.com Style (matching PriceFilter) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${
          isFiltered
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
        }`}
      >
        <MapPin className="w-4 h-4" />
        <span className="text-sm font-medium">{getDisplayText()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Panel - Simple & Clean (matching PriceFilter) */}
          <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded border border-gray-300 shadow-lg z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Chọn vị trí</h3>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* City Select */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 font-medium">
                  Tỉnh/Thành phố
                </label>
                <select
                  value={tempValue.city}
                  onChange={(e) => {
                    setTempValue({ city: e.target.value, district: '', ward: '' });
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">Chọn Tỉnh/Thành phố</option>
                  {locationData.cities.map((city) => (
                    <option key={city.city_code} value={city.city_name}>
                      {city.city_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Select */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 font-medium">
                  Quận/Huyện
                </label>
                <select
                  value={tempValue.district}
                  onChange={(e) => {
                    setTempValue({ ...tempValue, district: e.target.value, ward: '' });
                  }}
                  disabled={!tempValue.city}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Chọn Quận/Huyện</option>
                  {availableDistricts.map((district) => (
                    <option key={district.district_code} value={district.district_name}>
                      {district.district_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward Select */}
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 font-medium">
                  Phường/Xã
                </label>
                <select
                  value={tempValue.ward}
                  onChange={(e) => {
                    setTempValue({ ...tempValue, ward: e.target.value });
                  }}
                  disabled={!tempValue.district}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Chọn Phường/Xã</option>
                  {availableWards.map((ward) => (
                    <option key={ward.ward_code} value={ward.ward_name}>
                      {ward.ward_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                Đặt lại
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}