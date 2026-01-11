import React from 'react';
import { FormData } from '../types';

interface Step5Props {
    formData: FormData;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeImage: (index: number) => void;
    handleInputChange: (field: keyof FormData, value: any) => void;
    imagePreviews: string[];
    errors?: Record<string, string>;
}

const Step5_Images: React.FC<Step5Props> = ({ formData, handleImageUpload, removeImage, handleInputChange, imagePreviews, errors }) => {
    const imageCount = formData.images.length;
    const hasError = errors?.images;
    
    return (
        <div className="animate-fadeIn space-y-6">
            <div className={`flex flex-col items-center justify-center space-y-4 border-2 border-dashed rounded-2xl p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer relative ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}>
                <input type="file" multiple accept="image/jpeg,image/jpg,image/png" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className={`w-16 h-16 ${hasError ? 'text-red-500' : ''}`}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7h3l2-3h8l2 3h3v12H3V7z"
                    />
                    <circle cx="12" cy="13" r="4" strokeWidth="2" stroke="currentColor" fill="none" />
                </svg>

                <p className="font-medium text-gray-900">Kéo thả ảnh vào đây hoặc click để tải lên</p>
                <p className="text-sm text-gray-500 mt-1">
                    <strong>Chỉ chấp nhận JPG, PNG.</strong> Tối thiểu 4 ảnh.
                </p>
                {imageCount > 0 && (
                    <p className={`text-sm font-semibold ${imageCount >= 4 ? 'text-green-600' : 'text-orange-600'}`}>
                        Đã tải: {imageCount}/4 ảnh {imageCount >= 4 ? '✓' : '(cần thêm ' + (4 - imageCount) + ' ảnh)'}
                    </p>
                )}
            </div>

            {hasError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-medium">⚠️ {errors.images}</p>
                </div>
            )}

            {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviews.map((src, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-gray-200">
                            <img src={src} alt="Preview" className="w-full h-full object-cover" />
                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2">
                                <button
                                    onClick={() => handleInputChange('coverImageIndex', idx)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${formData.coverImageIndex === idx ? 'bg-green-500 text-white' : 'bg-white text-black'}`}
                                >
                                    {formData.coverImageIndex === idx ? '★ Ảnh bìa' : 'Đặt làm bìa'}
                                </button>
                                <button onClick={() => removeImage(idx)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                                    🗑️
                                </button>
                            </div>
                            {formData.coverImageIndex === idx && <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-sm">Ảnh bìa</div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Step5_Images;
