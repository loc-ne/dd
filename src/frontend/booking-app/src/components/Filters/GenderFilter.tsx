'use client';

import { useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';

export enum TargetGender {
  ALL = 'ALL',
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

interface GenderFilterProps {
  value: TargetGender;
  onChange: (value: TargetGender) => void;
}

const GENDER_OPTIONS = [
  { value: 'ALL' as TargetGender, label: 'Tất cả', icon: '👥', desc: 'Không yêu cầu giới tính' },
  { value: 'MALE' as TargetGender, label: 'Chỉ Nam', icon: '👨', desc: 'Phù hợp cho nam giới' },
  { value: 'FEMALE' as TargetGender, label: 'Chỉ Nữ', icon: '👩', desc: 'Phù hợp cho nữ giới' },
];

export default function GenderFilter({ value, onChange }: GenderFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedGender = GENDER_OPTIONS.find((option) => option.value === value);
  const isFiltered = value !== 'ALL';

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${
          isFiltered
            ? 'border-blue-600 bg-blue-50 text-blue-700'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
        }`}
      >
        <Users className="w-4 h-4" />
        <span className="text-sm font-medium">
          {selectedGender ? selectedGender.label : 'Giới tính'}
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
          
          {/* Panel */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded border border-gray-300 shadow-lg z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Đối tượng cho thuê</h3>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
              {GENDER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    value === option.value
                      ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        value === option.value ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {option.desc}
                      </div>
                    </div>
                    {value === option.value && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  onChange(TargetGender.ALL);
                  setIsOpen(false);
                }}
                className="flex-1 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                Đặt lại
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
