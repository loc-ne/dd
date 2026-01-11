'use client';

import { useState } from 'react';

interface DescriptionViewerProps {
    description: string;
}

export default function DescriptionViewer({ description }: DescriptionViewerProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatText = (text: string) => {
        if (!text) return [];

        const regex = /(?<=[.!?])\s+(?=[A-ZÀ-Ỹ])|(?=\s*(?:Vị trí|Tiện ích|Lưu ý|Giờ giấc|Khu vực|Giá điện|Giá nước|An ninh):)/g;

        const sentences = text
            .split(regex)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        return sentences;
    };

    const paragraphs = formatText(description);

    const shouldCollapse = paragraphs.length > 4;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Mô tả chi tiết
            </h3>

            <div className={`relative transition-all duration-500 ease-in-out ${!isExpanded && shouldCollapse ? 'max-h-[220px] overflow-hidden' : ''}`}>
                <ul className="space-y-3">
                    {paragraphs.map((sentence, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-700 leading-relaxed group">

                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 group-hover:bg-blue-600 transition-colors" />

                            <span className="text-[15px]">
                                {sentence.includes(':') ? (
                                    <>
                                        <span className="font-bold text-gray-900">{sentence.split(':')[0]}:</span>
                                        {sentence.split(':').slice(1).join(':')}
                                    </>
                                ) : sentence}
                            </span>
                        </li>
                    ))}
                </ul>

                {!isExpanded && shouldCollapse && (
                    <div className="absolute bottom-0 left-0 w-full h-16 bg-[linear-gradient(to_top,rgba(0,0,0,0.06),transparent)] pointer-events-none" />

                )}
            </div>

            {shouldCollapse && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-4 flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all mx-auto"
                >
                    {isExpanded ? 'Thu gọn' : 'Xem thêm mô tả'}
                    <svg
                        className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            )}
        </div>
    );
}