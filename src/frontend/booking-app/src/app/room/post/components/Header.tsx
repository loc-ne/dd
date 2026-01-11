import React from 'react';
import Link from 'next/link';
import { STEPS } from '../constants';
interface HeaderProps {
    currentStep: number;
}

const Header: React.FC<HeaderProps> = ({ currentStep }) => {
    return (
        <div className="sticky top-16 bg-white z-40 border-b border-gray-200 shadow-sm">
            <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                

                {/* Progress Bar */}
                <div className="hidden md:flex items-center space-x-2">
                    {STEPS.map((s, idx) => (
                        <div key={s.id} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${currentStep > s.id
                                    ? 'bg-blue-600 text-white'
                                    : currentStep === s.id
                                        ? 'bg-blue-600 text-white ring-4 ring-indigo-200'
                                        : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {currentStep > s.id ? '✓' : s.id}
                                </div>
                                <span className={`text-xs mt-1 font-medium ${currentStep === s.id ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    {s.title}
                                </span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={`w-12 h-1 mx-2 rounded transition-all ${currentStep > s.id ? 'bg-blue-500' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Mobile Progress */}
                <div className="md:hidden flex items-center gap-2">
                    <div className="text-sm font-semibold text-gray-700">
                        Bước {currentStep}/{STEPS.length}
                    </div>
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 transition-all duration-300"
                            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>

                <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-black underline">
                    Thoát
                </Link>
            </div>
        </div>
    );
};

export default Header;
