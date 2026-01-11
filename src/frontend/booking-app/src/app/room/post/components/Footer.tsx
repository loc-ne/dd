import React from 'react';
import { STEPS } from '../constants';

interface FooterProps {
    currentStep: number;
    setCurrentStep: (step: number) => void;
    isSubmitting: boolean;
    handleSubmit: () => void;
    handleDraft: () => void;
    onNext: () => void;
}


const Footer: React.FC<FooterProps> = ({ currentStep, setCurrentStep, isSubmitting, handleSubmit, handleDraft, onNext }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-lg">
            <div className="max-w-5xl mx-auto flex items-center justify-between px-6">
                <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 1}
                    className={`font-semibold underline text-gray-900 hover:text-gray-600 transition ${currentStep === 1 ? 'invisible' : ''}`}
                >
                    ← Quay lại
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDraft}
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Lưu nháp
                    </button>

                    <button
                        onClick={() => {
                            if (currentStep === STEPS.length) {
                                handleSubmit();
                            } else {
                                onNext();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3.5 rounded-xl font-semibold text-lg shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 relative"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                                    ></path>
                                </svg>
                                Đang đăng...
                            </div>
                        ) : currentStep === STEPS.length ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Đăng tin
                            </>
                        ) : (
                            <>
                                Tiếp theo
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default Footer;
