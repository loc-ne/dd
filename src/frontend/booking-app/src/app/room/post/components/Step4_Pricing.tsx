import React from 'react';
import { FormData } from '../types';
import { UTILITY_UNITS } from '../constants';
import Label from './Label';
import CurrencyInput from './CurrencyInput';

interface Step4Props {
    formData: FormData;
    handleInputChange: (field: keyof FormData, value: any) => void;
    errors: Record<string, string>;
}

const Step4_Pricing: React.FC<Step4Props> = ({ formData, handleInputChange, errors }) => {
    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Main Price */}
            <div className=" p-6 rounded-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <Label required>Giá thuê (Tháng)</Label>
                        <CurrencyInput value={formData.pricePerMonth} onChange={v => handleInputChange('pricePerMonth', v)} placeholder="Nhập giá thuê..." />
                        {errors.pricePerMonth && <p className="text-red-500 text-sm">{errors.pricePerMonth}</p>}
                    </div>
                    <div>
                        <Label required>Tiền cọc</Label>
                        <CurrencyInput value={formData.deposit} onChange={v => handleInputChange('deposit', v)} placeholder="Thường là 1 tháng..." />
                    </div>
                </div>
            </div>

            {/* Utilities */}
            <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">Chi phí dịch vụ</h4>
                <div className="space-y-4">
                    {/* Electricity */}
                    <div className="flex items-center gap-4">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                        </svg>

                        <div className="flex-1">
                            <Label>Điện</Label>
                            <div className="flex gap-2">
                                <div className="w-2/3"><CurrencyInput value={formData.electricityPrice} onChange={v => handleInputChange('electricityPrice', v)} /></div>
                                <select
                                    className="w-1/3 border rounded-xl px-2 bg-white"
                                    value={formData.electricityUnit}
                                    onChange={e => handleInputChange('electricityUnit', e.target.value as any)}
                                >
                                    {UTILITY_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    {/* Water */}
                    <div className="flex items-center gap-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-6 h-6 text-blue-500"
                        >
                            <path d="M12 22c4 0 7-3 7-7 0-4.5-5-10-7-12-2 2-7 7.5-7 12 0 4 3 7 7 7z" />
                        </svg>

                        <div className="flex-1">
                            <Label>Nước</Label>
                            <div className="flex gap-2">
                                <div className="w-2/3"><CurrencyInput value={formData.waterPrice} onChange={v => handleInputChange('waterPrice', v)} /></div>
                                <select
                                    className="w-1/3 border rounded-xl px-2 bg-white"
                                    value={formData.waterUnit}
                                    onChange={e => handleInputChange('waterUnit', e.target.value as any)}
                                >
                                    {UTILITY_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Step4_Pricing;
