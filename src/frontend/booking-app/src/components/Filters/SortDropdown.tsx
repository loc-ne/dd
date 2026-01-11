'use client';

import { useState } from 'react';
import {
  Clock,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ArrowDownUp,
  ArrowUpDown,
  type LucideIcon
} from "lucide-react";


interface SortOption {
  value: string;
  label: string;
  icon: LucideIcon;
}


export const SORT_OPTIONS: SortOption[] = [
  { value: "newest", label: "Mới nhất", icon: Clock },
  { value: "price-asc", label: "Giá thấp đến cao", icon: ArrowDownNarrowWide },
  { value: "price-desc", label: "Giá cao đến thấp", icon: ArrowUpNarrowWide },
  { value: "size-asc", label: "Diện tích nhỏ đến lớn", icon: ArrowDownUp },
  { value: "size-desc", label: "Diện tích lớn đến nhỏ", icon: ArrowUpDown },
];


interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value) || SORT_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:border-gray-400 transition bg-white"
      >
        <selectedOption.icon className="w-5 h-5" />
        <span className="text-sm font-medium">{selectedOption.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition ${value === option.value
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "hover:bg-gray-50"
                  }`}
              >
                <option.icon className="w-5 h-5 text-gray-700" />
                <span className="text-sm">{option.label}</span>
              </button>
            ))}

          </div>
        </>
      )}
    </div>
  );
}