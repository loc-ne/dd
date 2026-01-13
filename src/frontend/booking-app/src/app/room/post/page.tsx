'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import locationData from '../../data.json';

import type { FormData } from './types';
import { STEPS } from './constants';

import Header from './components/Header';
import Footer from './components/Footer';
import Step1_BasicInfo from './components/Step1_BasicInfo';
import Step2_Location from './components/Step2_Location';
import Step3_SpecsAndAmenities from './components/Step3_SpecsAndAmenities';
import Step4_Pricing from './components/Step4_Pricing';
import Step5_Images from './components/Step5_Images';
import Step6_Contact from './components/Step6_Contact';

export default function CreatePostPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({
        title: '', description: '', roomType: '',
        province: '', district: '', ward: '', address: '', latitude: 10.8231, longitude: 106.6297,
        cityName: '', districtName: '', wardName: '',
        area: 20, guestCapacity: 1,
        pricePerMonth: 0, deposit: 0, minLeaseTerm: 6,
        electricityPrice: 3500, electricityUnit: 'KWH',
        waterPrice: 100000, waterUnit: 'PERSON',
        wifiPrice: 0, parkingFee: 0, managementFee: 0, miscNotes: '',
        amenities: [], cookingAllowed: true, petAllowed: false, gender: 'ALL', curfew: true, curfewTime: '23:00',
        contactName: '', phone: '',
        images: [], coverImageIndex: 0,
    });

    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [availableDistricts, setAvailableDistricts] = useState<any[]>([]);
    const [availableWards, setAvailableWards] = useState<any[]>([]);

    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                contactName: user.fullName || '',
                phone: user.phoneNumber || ''
            }));
        }
    }, [user]);

    const handleInputChange = (field: keyof FormData, value: any) => {
        setErrors(prev => ({ ...prev, [field]: '' }));

        if (field === 'province') {
            const city = locationData.cities.find(c => c.city_code === value);
            setAvailableDistricts(city?.districts || []);
            setAvailableWards([]);
            setFormData(prev => ({ ...prev, province: value, district: '', ward: '' }));
        } else if (field === 'district') {
            const dist = availableDistricts.find(d => d.district_code === value);
            setAvailableWards(dist?.wards || []);
            setFormData(prev => ({ ...prev, district: value, ward: '' }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        // Validate file formats
        const allowedFormats = ['jpg', 'jpeg', 'png'];
        const invalidFiles = files.filter(file => {
            const extension = file.name.split('.').pop()?.toLowerCase();
            return !extension || !allowedFormats.includes(extension);
        });

        if (invalidFiles.length > 0) {
            toast.error('Ch\u1ec9 ch\u1ea5p nh\u1eadn \u1ea3nh \u0111\u1ecbnh d\u1ea1ng JPG, JPEG ho\u1eb7c PNG');
            e.target.value = ''; // Reset input
            return;
        }

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
        setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
        
        // Clear error if exists
        if (errors.images) {
            setErrors(prev => ({ ...prev, images: '' }));
        }
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
            coverImageIndex: (prev.coverImageIndex === index) ? 0 : (prev.coverImageIndex > index ? prev.coverImageIndex - 1 : prev.coverImageIndex)
        }));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {};
        if (step === 1 && !formData.title) newErrors.title = "Vui lòng nhập tiêu đề";
        if (step === 1 && !formData.roomType) newErrors.roomType = "Chọn loại phòng";
        if (step === 2 && !formData.address) newErrors.address = "Nhập địa chỉ cụ thể";
        if (step === 4 && !formData.pricePerMonth) newErrors.pricePerMonth = "Nhập giá thuê";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
        }
    };

    const buildFormData = (data: FormData, isDraft: boolean) => {
        const payload = new FormData();

        // 1. Append các trường Text/Number/Boolean cơ bản
        payload.append('title', data.title);
        payload.append('description', data.description);
        payload.append('roomType', data.roomType);

        // Location
        payload.append('province', data.cityName);
        payload.append('district', data.districtName);
        payload.append('ward', data.wardName);
        payload.append('address', data.address);
        payload.append('latitude', data.latitude.toString());
        payload.append('longitude', data.longitude.toString());

        // Specs & Pricing
        payload.append('area', data.area.toString());
        payload.append('guestCapacity', data.guestCapacity.toString());
        payload.append('pricePerMonth', data.pricePerMonth.toString());
        payload.append('deposit', data.deposit.toString());
        payload.append('minLeaseTerm', data.minLeaseTerm.toString());

        // Utilities
        payload.append('electricityPrice', data.electricityPrice.toString());
        payload.append('electricityUnit', data.electricityUnit);
        payload.append('waterPrice', data.waterPrice.toString());
        payload.append('waterUnit', data.waterUnit);
        payload.append('wifiPrice', data.wifiPrice.toString());
        payload.append('parkingFee', data.parkingFee.toString());
        payload.append('managementFee', data.managementFee.toString());

        if (data.miscNotes) payload.append('miscNotes', data.miscNotes);
        if (data.amenities && data.amenities.length > 0) {
            data.amenities.forEach((item) => payload.append('amenities', item));
        }
        console.log("payload: ",data.amenities)

        // Rules & Contact
        payload.append('cookingAllowed', String(data.cookingAllowed));
        payload.append('petAllowed', String(data.petAllowed));
        payload.append('gender', data.gender);
        payload.append('curfew', String(data.curfew));
        if (data.curfewTime) payload.append('curfewTime', data.curfewTime);

        payload.append('contactName', data.contactName);
        payload.append('phone', data.phone);

        // Images Meta
        payload.append('coverImageIndex', data.coverImageIndex.toString());

        // Quan trọng: Cờ đánh dấu Draft
        payload.append('isDraft', String(isDraft));

        // 2. Append File ảnh
        if (data.images && data.images.length > 0) {
            data.images.forEach((file) => {
                payload.append('files', file); // Tên 'files' khớp với backend
            });
        }

        return payload;
    };

    const handleSubmit = async () => {
        try {
            // Validate images before submitting
            if (formData.images.length < 4) {
                toast.error('Ph\u1ea3i t\u1ea3i l\u00ean \u00edt nh\u1ea5t 4 \u1ea3nh');
                setCurrentStep(5); // Go to images step
                return;
            }

            setIsSubmitting(true);
            const payload = buildFormData(formData, false); // isDraft = false

            // 2. Gọi API
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${API_URL}/rooms`, {
                method: 'POST',
                credentials: 'include',
                body: payload,
            });

            const data = await res.json();

            if (res.ok) {
                // 3. Xử lý thành công
                const { requireVerification } = data.meta || {};

                if (requireVerification) {
                    // Case: Đăng tin nhưng chưa active email -> Redirect kèm cờ báo
                    toast.success("Đã lưu tin! Vui lòng xác thực email.");
                    router.push('/dashboard/host/rooms?status=verification_needed');
                } else {
                    // Case: Đăng tin thành công -> Chờ duyệt
                    toast.success("Đăng tin thành công! Đang chờ duyệt.");
                    router.push('/dashboard/host/rooms?status=success');
                }
            } else {
                toast.error(data.message || "Có lỗi xảy ra khi đăng tin");
                console.error("Backend Error:", data);
            }
        } catch (error) {
            console.error("Network Error:", error);
            toast.error("Lỗi kết nối đến máy chủ");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDraft = async () => {
        if (!formData.title) {
            toast.error("Vui lòng nhập ít nhất tiêu đề để lưu nháp");
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = buildFormData(formData, true); // isDraft = true

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${API_URL}/rooms`, {
                method: 'POST',
                credentials: 'include',
                body: payload,
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Đã lưu bản nháp thành công!");
                router.push('/dashboard/host/rooms');
            } else {
                toast.error(data.message || "Không thể lưu bản nháp");
            }
        } catch (error) {
            toast.error("Lỗi kết nối");
        } finally {
            setIsSubmitting(false);
        }
    };
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <Step1_BasicInfo formData={formData} handleInputChange={handleInputChange} errors={errors} />;
            case 2:
                return <Step2_Location formData={formData} handleInputChange={handleInputChange} errors={errors} availableDistricts={availableDistricts} availableWards={availableWards} />;
            case 3:
                return <Step3_SpecsAndAmenities formData={formData} handleInputChange={handleInputChange} />;
            case 4:
                return <Step4_Pricing formData={formData} handleInputChange={handleInputChange} errors={errors} />;
            case 5:
                return <Step5_Images formData={formData} handleImageUpload={handleImageUpload} removeImage={removeImage} handleInputChange={handleInputChange} imagePreviews={imagePreviews} errors={errors} />;
            case 6:
                return <Step6_Contact formData={formData} handleInputChange={handleInputChange} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 pb-24">
            <Header currentStep={currentStep} />

            <main className="max-w-3xl mx-auto px-6 pt-32">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">{STEPS[currentStep - 1].title}</h1>
                    <p className="text-gray-500 mt-2 text-lg">{STEPS[currentStep - 1].desc}</p>
                </div>
                {renderStepContent()}
            </main>

            <Footer
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isSubmitting={isSubmitting}
                handleSubmit={handleSubmit}
                handleDraft={handleDraft}
                onNext={onNext}
            />
        </div>
    );
}
