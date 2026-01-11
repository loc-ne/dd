import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { FormData } from '../types';
import { Icons } from './Icons';

interface Step6Props {
    formData: FormData;
    handleInputChange: (field: keyof FormData, value: any) => void;
}

const Step6_Contact: React.FC<Step6Props> = ({ formData, handleInputChange }) => {
    const { user, refreshUser } = useAuth();

    const [profileUpdates, setProfileUpdates] = useState({ fullName: '', phoneNumber: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const [errorsProfile, setErrorsProfile] = useState<{ fullName?: string; phoneNumber?: string }>({});

    const isMissingName = !user?.fullName;
    const isMissingPhone = !user?.phoneNumber;
    const isProfileIncomplete = isMissingName || isMissingPhone;

    useEffect(() => {
        if (user) {
            if (!formData.contactName) handleInputChange('contactName', user.fullName || '');
            if (!formData.phone) handleInputChange('phone', user.phoneNumber || '');

            setProfileUpdates({
                fullName: user.fullName || '',
                phoneNumber: user.phoneNumber || ''
            });
        }
    }, [user]);

    const handleSaveProfile = async () => {
        setErrorsProfile({});

        let isValid = true;
        const newErrors: { fullName?: string; phoneNumber?: string } = {};

        if (isMissingName) {
            if (!profileUpdates.fullName.trim()) {
                newErrors.fullName = 'Vui lòng nhập họ và tên';
                isValid = false;
            } else if (profileUpdates.fullName.trim().length < 2) {
                newErrors.fullName = 'Tên quá ngắn';
                isValid = false;
            }
        }

        if (isMissingPhone) {
            const phone = profileUpdates.phoneNumber.trim();
            if (!phone) {
                newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
                isValid = false;
            } else if (!/^0\d{9}$/.test(phone)) {
                newErrors.phoneNumber = 'SĐT không hợp lệ (cần 10 số, bắt đầu bằng 0)';
                isValid = false;
            }
        }

        if (!isValid) {
            setErrorsProfile(newErrors);
            return;
        }
        const payload: any = {};

        if (profileUpdates.fullName.trim() !== '') {
            payload.fullName = profileUpdates.fullName.trim();
        }

        if (profileUpdates.phoneNumber.trim() !== '') {
            payload.phoneNumber = profileUpdates.phoneNumber.trim();
        }

        try {
            setIsUpdating(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await refreshUser();
                toast.success("Đã cập nhật hồ sơ!");

                if (isMissingName) handleInputChange('contactName', profileUpdates.fullName);
                if (isMissingPhone) handleInputChange('phone', profileUpdates.phoneNumber);
            } else {
                const data = await res.json();
                toast.error(data.message || "Lỗi cập nhật");
            }
        } catch (error) {
            console.log("Có lỗi xảy ra khi update profile nè");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="animate-fadeIn max-w-xl mx-auto space-y-10 pb-10">
            {isProfileIncomplete && (
                <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
                    <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                        <div className="p-2 bg-gray-200 rounded-full text-gray-700">
                            <Icons.Alert />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                Cần bổ sung hồ sơ
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Vui lòng điền thông tin liên hệ để tiếp tục.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            {isMissingName && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-900">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-400"><Icons.User /></span>
                                        <input
                                            type="text"
                                            value={profileUpdates.fullName}
                                            onChange={(e) => {
                                                setProfileUpdates({ ...profileUpdates, fullName: e.target.value });
                                                if (errorsProfile.fullName) setErrorsProfile({ ...errorsProfile, fullName: undefined });
                                            }}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition text-sm font-medium
                                            ${errorsProfile.fullName
                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                    : 'bg-gray-50 border-gray-200 focus:bg-white focus:ring-black focus:border-transparent'
                                                }`}
                                            placeholder="Nhập họ tên thật..."
                                        />
                                    </div>
                                    {errorsProfile.fullName && (
                                        <p className="text-red-500 text-xs ml-1 animate-fadeIn">{errorsProfile.fullName}</p>
                                    )}
                                </div>
                            )}

                            {isMissingPhone && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-900">
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-400"><Icons.Phone /></span>
                                        <input
                                            type="tel"
                                            value={profileUpdates.phoneNumber}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                setProfileUpdates({ ...profileUpdates, phoneNumber: val });
                                                if (errorsProfile.phoneNumber) setErrorsProfile({ ...errorsProfile, phoneNumber: undefined });
                                            }}
                                            maxLength={10}
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition text-sm font-medium
                                            ${errorsProfile.phoneNumber
                                                    ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
                                                    : 'bg-gray-50 border-gray-200 focus:bg-white focus:ring-black focus:border-transparent'
                                                }`}
                                            placeholder="Nhập SĐT chính chủ..."
                                        />
                                    </div>
                                    {errorsProfile.phoneNumber && (
                                        <p className="text-red-500 text-xs ml-1 animate-fadeIn">{errorsProfile.phoneNumber}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            disabled={isUpdating}
                            className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
                        >
                            {isUpdating ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Đang lưu...
                                </span>
                            ) : (
                                <>
                                    <span>Lưu thông tin</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <div className={`transition-all duration-500 ${isProfileIncomplete ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Thông tin liên hệ
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Thông tin này sẽ hiển thị công khai trên bài đăng. bạn có thể chỉnh sửa thông tin này.</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Tên hiển thị</label>
                        <div className="relative group">
                            <span className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-black transition">
                                <Icons.User />
                            </span>
                            <input
                                type="text"
                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition font-medium text-gray-800"
                                placeholder="VD: Anh Nam (Chính chủ)"
                                value={formData.contactName}
                                onChange={e => handleInputChange('contactName', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Số điện thoại liên hệ</label>
                        <div className="relative group">
                            <span className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-black transition">
                                <Icons.Phone />
                            </span>
                            <input
                                type="tel"
                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition font-medium text-gray-800"
                                placeholder="0912..."
                                value={formData.phone}
                                onChange={e => handleInputChange('phone', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Step6_Contact;
