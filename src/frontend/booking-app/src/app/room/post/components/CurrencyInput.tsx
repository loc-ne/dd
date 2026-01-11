import React from 'react';

const CurrencyInput = ({ value, onChange, placeholder }: { value: number, onChange: (v: number) => void, placeholder?: string }) => (
    <div className="relative rounded-md shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 sm:text-sm">₫</span>
        </div>
        <input
            type="number"
            className="block w-full rounded-xl border-gray-300 pl-7 py-3 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder={placeholder || "0"}
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            min="0"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-gray-500 sm:text-sm">VNĐ</span>
        </div>
    </div>
);

export default CurrencyInput;
