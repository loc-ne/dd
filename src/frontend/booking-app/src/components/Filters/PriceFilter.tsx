'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ChevronDown } from 'lucide-react';

interface PriceFilterProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
}

export default function PriceFilter({ 
  value, 
  onChange, 
  min = 0, 
  max = 10000000 
}: PriceFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    if (isOpen) {
      setTempValue(value);
    }
  }, [isOpen, value]);

  const handleApply = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}tr`;
    }
    return `${(price / 1000).toFixed(0)}k`;
  };

  const formatPriceFull = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const isFiltered = value[0] > min || value[1] < max;

  return (
    <div className="relative">
      {/* Trigger Button - Booking.com Style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${
          isFiltered
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
        }`}
      >
        <DollarSign className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isFiltered 
            ? `${formatPrice(value[0])} - ${formatPrice(value[1])}`
            : 'Khoảng giá'
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
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded border border-gray-300 shadow-lg z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Khoảng giá mỗi đêm</h3>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Price Display */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {formatPriceFull(tempValue[0])} đ - {formatPriceFull(tempValue[1])} đ
                </span>
              </div>

              {/* ✅ FIX: Range Slider - Centered Thumbs */}
              <div className="relative pt-2 pb-6">
                {/* Track Background */}
                <div className="relative h-1 bg-gray-200 rounded">
                  {/* Active Range */}
                  <div 
                    className="absolute h-full bg-blue-600 rounded"
                    style={{
                      left: `${((tempValue[0] - min) / (max - min)) * 100}%`,
                      right: `${100 - ((tempValue[1] - min) / (max - min)) * 100}%`
                    }}
                  />
                </div>

                {/* ✅ FIX: Slider Container - Căn giữa thumbs */}
                <div className="relative" style={{ top: '-10px' }}>
                  {/* Min Slider */}
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={100000}
                    value={tempValue[0]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= tempValue[1] - 100000) {
                        setTempValue([val, tempValue[1]]);
                      }
                    }}
                    className="range-slider range-slider-min"
                    style={{
                      zIndex: tempValue[0] > (max - min) * 0.5 ? 25 : 20
                    }}
                  />
                  
                  {/* Max Slider */}
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={100000}
                    value={tempValue[1]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= tempValue[0] + 100000) {
                        setTempValue([tempValue[0], val]);
                      }
                    }}
                    className="range-slider range-slider-max"
                    style={{
                      zIndex: tempValue[1] < (max - min) * 0.5 ? 25 : 20
                    }}
                  />
                </div>

                {/* Min/Max Labels */}
                <div className="flex justify-between text-xs text-gray-500 mt-3">
                  <span>{formatPrice(min)}</span>
                  <span>{formatPrice(max)}</span>
                </div>
              </div>

              {/* Price Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Giá tối thiểu
                  </label>
                  <input
                    type="number"
                    value={tempValue[0]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= min && val <= tempValue[1] - 100000) {
                        setTempValue([val, tempValue[1]]);
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                    min={min}
                    max={tempValue[1] - 100000}
                    step={100000}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Giá tối đa
                  </label>
                  <input
                    type="number"
                    value={tempValue[1]}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val <= max && val >= tempValue[0] + 100000) {
                        setTempValue([tempValue[0], val]);
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-600"
                    min={tempValue[0] + 100000}
                    max={max}
                    step={100000}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setTempValue([min, max]);
                }}
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

      {/* ✅ UPDATED: Custom CSS - Thumbs căn giữa track */}
      <style jsx>{`
        .range-slider {
          position: absolute;
          width: 100%;
          height: 20px;
          appearance: none;
          background: transparent;
          pointer-events: none;
          top: 0;
        }

        /* Thumb styling - Căn giữa theo track */
        .range-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #2563eb;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          position: relative;
          margin-top: -10px; /* ✅ Căn giữa: (20px - track height) / 2 */
        }

        .range-slider::-webkit-slider-thumb:hover {
          border-width: 3px;
        }

        .range-slider::-webkit-slider-thumb:active {
          border-color: #1d4ed8;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .range-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #2563eb;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .range-slider::-moz-range-thumb:hover {
          border-width: 3px;
        }

        .range-slider::-moz-range-thumb:active {
          border-color: #1d4ed8;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        /* Remove default track */
        .range-slider::-webkit-slider-runnable-track {
          height: 0;
        }

        .range-slider::-moz-range-track {
          height: 0;
          background: transparent;
        }
      `}</style>
    </div>
  );
}