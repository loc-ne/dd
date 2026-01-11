import React from 'react';

const Counter = ({ value, onChange, min = 0, suffix = '' }: { value: number, onChange: (v: number) => void, min?: number, suffix?: string }) => (
    <div className="flex items-center space-x-4">
        <button
            onClick={() => onChange(Math.max(min, value - 1))}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${value <= min ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-400 text-gray-600 hover:border-black hover:text-black'}`}
            disabled={value <= min}
        >
            -
        </button>
        <span className="text-gray-900 font-medium w-12 text-center">{value} {suffix}</span>
        <button
            onClick={() => onChange(value + 1)}
            className="w-8 h-8 rounded-full border border-gray-400 text-gray-600 flex items-center justify-center hover:border-black hover:text-black transition-colors"
        >
            +
        </button>
    </div>
);

export default Counter;
