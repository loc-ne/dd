import React from 'react';
import { FormData } from '../types';
import { ROOM_TYPES_UI } from '../constants';
import Label from './Label';

interface Step1Props {
    formData: FormData;
    handleInputChange: (field: keyof FormData, value: any) => void;
    errors: Record<string, string>;
}

const Step1_BasicInfo: React.FC<Step1Props> = ({ formData, handleInputChange, errors }) => {
    return (
        <div className="animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Bạn đang cho thuê loại hình nào?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {ROOM_TYPES_UI.map((type) => (
    <div
        key={type.id}
        onClick={() => handleInputChange('roomType', type.id)}
        className={`cursor-pointer p-4 border-2 rounded-xl flex flex-col gap-2 hover:border-gray-800 transition-all ${
            formData.roomType === type.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
        }`}
    >
        {/* FIX ICON: dùng như component, không dùng <span> */}
        <type.icon className="w-8 h-8 text-gray-900" />

        <span className="font-bold text-gray-900">{type.label}</span>
        <span className="text-xs text-gray-500">{type.desc}</span>
    </div>
))}

            </div>
            {errors.roomType && <p className="text-red-500 text-sm mb-4">{errors.roomType}</p>}

            <div className="space-y-5">
                <div>
                    <Label required>Tiêu đề bài đăng</Label>
                    <input
                        type="text"
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-medium text-lg"
                        placeholder="VD: Phòng trọ Full nội thất gần ĐH Bách Khoa..."
                        value={formData.title}
                        onChange={e => handleInputChange('title', e.target.value)}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                    <Label required>Mô tả chi tiết</Label>
                    <textarea
                        rows={6}
                        className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                        placeholder="Mô tả về không gian, giờ giấc, môi trường xung quanh..."
                        value={formData.description}
                        onChange={e => handleInputChange('description', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default Step1_BasicInfo;
