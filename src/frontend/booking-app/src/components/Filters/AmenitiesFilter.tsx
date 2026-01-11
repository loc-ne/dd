'use client';

import { useState } from 'react';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import amenitiesData from './amenities.json';

interface AmenitiesFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
}

// ✅ Map dữ liệu từ JSON
const AMENITIES = amenitiesData.map((amenity) => ({
  id: amenity.slug,
  label: amenity.amenity_name,
  icon: amenity.icon,
}));

export default function AmenitiesFilter({ value, onChange }: AmenitiesFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAmenity = (amenityLabel: string) => {
    if (value.includes(amenityLabel)) {
      onChange(value.filter((label) => label !== amenityLabel));
    } else {
      onChange([...value, amenityLabel]);
    }
  };

  const selectAll = () => {
    onChange(AMENITIES.map(a => a.label));
  };

  const clearAll = () => {
    onChange([]);
  };

  // ✅ Kiểm tra có tiện nghi được chọn không
  const isFiltered = value.length > 0;

  return (
    <div className="relative">
      {/* ✅ Trigger Button - Booking.com Style (giống PriceFilter) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${
          isFiltered
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isFiltered 
            ? `Tiện nghi (${value.length})`
            : 'Tiện nghi'
          }
        </span>
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
          
          {/* Panel - Simple & Clean */}
          <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded border border-gray-300 shadow-lg z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Tiện nghi</h3>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Quick Actions */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAll}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                >
                  Chọn tất cả
                </button>
                <button
                  onClick={clearAll}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                >
                  Bỏ chọn
                </button>
              </div>

              {/* Amenities Grid */}
              <div className="max-h-80 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {AMENITIES.map((amenity) => {
                    const isSelected = value.includes(amenity.label);
                    
                    return (
                      <label
                        key={amenity.id}
                        className={`flex items-center gap-2 p-3 rounded cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAmenity(amenity.label)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white border-gray-300'
                          }`}>
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Icon */}
                        <div 
                          className={`w-5 h-5 flex-shrink-0 ${
                            isSelected ? 'text-blue-600' : 'text-gray-600'
                          }`}
                          dangerouslySetInnerHTML={{ __html: amenity.icon }}
                        />

                        {/* Label */}
                        <span className={`text-sm ${
                          isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'
                        }`}>
                          {amenity.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={clearAll}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                Đặt lại
              </button>
              <button
                onClick={() => setIsOpen(false)}
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