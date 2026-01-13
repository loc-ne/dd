"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

// Import components từ room/post
import Header from "@/app/room/post/components/Header";
import Footer from "@/app/room/post/components/Footer";
import Step1_BasicInfo from "@/app/room/post/components/Step1_BasicInfo";
import Step2_Location from "@/app/room/post/components/Step2_Location";
import Step3_SpecsAndAmenities from "@/app/room/post/components/Step3_SpecsAndAmenities";
import Step4_Pricing from "@/app/room/post/components/Step4_Pricing";
import Step5_Images from "../components/Step5_Images_Edit";
import Step6_Contact from "@/app/room/post/components/Step6_Contact";

import type { FormData } from "@/app/room/post/types";
import { STEPS } from "@/app/room/post/constants";
import locationData from "@/app/data.json";

interface ExistingImage {
  id: number;
  imageUrl: string;
  isThumbnail: boolean;
}

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const roomId = Number(params.id);

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Existing images from server
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [deleteImageIds, setDeleteImageIds] = useState<number[]>([]);

  // New images to upload
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // Thumbnail selection
  const [coverImageId, setCoverImageId] = useState<number | null>(null);
  const [newCoverIndex, setNewCoverIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    roomType: "",
    province: "",
    district: "",
    ward: "",
    address: "",
    latitude: 10.8231,
    longitude: 106.6297,
    cityName: "",
    districtName: "",
    wardName: "",
    area: 20,
    guestCapacity: 1,
    pricePerMonth: 0,
    deposit: 0,
    minLeaseTerm: 6,
    electricityPrice: 3500,
    electricityUnit: "KWH",
    waterPrice: 100000,
    waterUnit: "PERSON",
    wifiPrice: 0,
    parkingFee: 0,
    managementFee: 0,
    miscNotes: "",
    amenities: [],
    cookingAllowed: true,
    petAllowed: false,
    gender: "ALL",
    curfew: true,
    curfewTime: "23:00",
    contactName: "",
    phone: "",
    images: [],
    coverImageIndex: 0,
  });

  const [availableDistricts, setAvailableDistricts] = useState<any[]>([]);
  const [availableWards, setAvailableWards] = useState<any[]>([]);

  // 1. Fetch room data
  useEffect(() => {
    if (!roomId || authLoading) return; // Chờ auth load xong
    fetchRoomData();
  }, [roomId, authLoading]);

  const fetchRoomData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rooms/my-rooms/${roomId}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Không thể tải dữ liệu phòng");
      }

      const { data: room } = await res.json();
      // Map tên địa điểm thành code
      const cityData = locationData.cities.find(
        (c) => c.city_name === room.city
      );
      const cityCode = cityData?.city_code || "";

      const districtData = cityData?.districts.find(
        (d: any) => d.district_name === room.district
      );
      const districtCode = districtData?.district_code || "";

      const wardData = districtData?.wards.find(
        (w: any) => w.ward_name === room.ward
      );
      const wardCode = wardData?.ward_code || "";

      // Map API data to form
      setFormData({
        title: room.title || "",
        description: room.description || "",
        roomType: room.roomType || "",
        province: cityCode,
        district: districtCode,
        ward: wardCode,
        address: room.address || "",
        latitude: room.latitude || 10.8231,
        longitude: room.longitude || 106.6297,
        cityName: room.city || "",
        districtName: room.district || "",
        wardName: room.ward || "",
        area: room.area || 20,
        guestCapacity: room.guestCapacity || 1,
        pricePerMonth: Number(room.pricePerMonth) || 0,
        deposit: Number(room.deposit) || 0,
        minLeaseTerm: room.minLeaseTerm || 6,
        electricityPrice: Number(room.electricityPrice) || 0,
        electricityUnit: room.electricityUnit || "KWH",
        waterPrice: Number(room.waterPrice) || 0,
        waterUnit: room.waterUnit || "PERSON",
        wifiPrice: Number(room.wifiPrice) || 0,
        parkingFee: Number(room.parkingFee) || 0,
        managementFee: Number(room.managementFee) || 0,
        miscNotes: room.miscNotes || "",
        amenities:
          room.roomAmenities?.map((ra: any) => ra.amenity.id.toString()) || [],
        cookingAllowed: room.cookingAllowed ?? true,
        petAllowed: room.petAllowed ?? false,
        gender: room.gender || "ALL",
        curfew: room.curfew ?? true,
        curfewTime: room.curfewTime || "23:00",
        contactName: room.contactName || "",
        phone: room.phone || "",
        images: [],
        coverImageIndex: 0,
      });

      // Set existing images
      const images = room.images || [];
      setExistingImages(images);

      // Find current thumbnail
      const thumbnailImage = images.find((img: any) => img.isThumbnail);
      if (thumbnailImage) {
        setCoverImageId(thumbnailImage.id);
      }

      // Load districts & wards for dropdown
      if (cityData) {
        setAvailableDistricts(cityData.districts || []);

        if (districtData) {
          setAvailableWards(districtData.wards || []);
        }
      }
    } catch (error) {
      console.error("Error fetching room:", error);
      toast.error("Không thể tải dữ liệu phòng");
      //router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));

    if (field === "province") {
      const city = locationData.cities.find((c) => c.city_code === value);
      setAvailableDistricts(city?.districts || []);
      setAvailableWards([]);
      setFormData((prev) => ({
        ...prev,
        province: value,
        district: "",
        ward: "",
      }));
    } else if (field === "district") {
      const district = availableDistricts.find(
        (d) => d.district_code === value
      );
      setAvailableWards(district?.wards || []);
      setFormData((prev) => ({ ...prev, district: value, ward: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Image handlers - passed to Step5
  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const previews = files.map((file) => URL.createObjectURL(file));

    setNewImages((prev) => [...prev, ...files]);
    setNewImagePreviews((prev) => [...prev, ...previews]);
    
    // Clear error if exists
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));

    // Reset new cover index if removed
    if (newCoverIndex === index) {
      setNewCoverIndex(null);
    } else if (newCoverIndex !== null && newCoverIndex > index) {
      setNewCoverIndex(newCoverIndex - 1);
    }
  };

  const removeExistingImage = (imageId: number) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setDeleteImageIds((prev) => [...prev, imageId]);

    // Reset cover if deleted
    if (coverImageId === imageId) {
      setCoverImageId(null);
    }
  };

  const setExistingAsCover = (imageId: number) => {
    setCoverImageId(imageId);
    setNewCoverIndex(null); // Clear new cover selection
  };

  const setNewAsCover = (index: number) => {
    setNewCoverIndex(index);
    setCoverImageId(null); // Clear existing cover selection
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 1 && !formData.title)
      newErrors.title = "Vui lòng nhập tiêu đề";
    if (step === 1 && !formData.roomType)
      newErrors.roomType = "Chọn loại phòng";
    if (step === 2 && !formData.address)
      newErrors.address = "Nhập địa chỉ cụ thể";
    if (step === 4 && !formData.pricePerMonth)
      newErrors.pricePerMonth = "Nhập giá thuê";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const buildUpdatePayload = (isDraft: boolean) => {
    const payload = new FormData();

    // Map code → tên để gửi lên server
    const cityData = locationData.cities.find(
      (c) => c.city_code === formData.province
    );
    const cityName = cityData?.city_name || "";

    const districtData = cityData?.districts.find(
      (d: any) => d.district_code === formData.district
    );
    const districtName = districtData?.district_name || "";

    const wardData = districtData?.wards.find(
      (w: any) => w.ward_code === formData.ward
    );
    const wardName = wardData?.ward_name || "";

    // Basic fields
    payload.append("title", formData.title);
    payload.append("description", formData.description);
    payload.append("roomType", formData.roomType);
    payload.append("province", cityName); // Backend dùng 'province' không phải 'city'
    payload.append("district", districtName);
    payload.append("ward", wardName);
    payload.append("address", formData.address);
    payload.append("latitude", formData.latitude.toString());
    payload.append("longitude", formData.longitude.toString());
    payload.append("area", formData.area.toString());
    payload.append("guestCapacity", formData.guestCapacity.toString());
    payload.append("pricePerMonth", formData.pricePerMonth.toString());
    payload.append("deposit", formData.deposit.toString());
    payload.append("minLeaseTerm", formData.minLeaseTerm.toString());
    payload.append("electricityPrice", formData.electricityPrice.toString());
    payload.append("electricityUnit", formData.electricityUnit);
    payload.append("waterPrice", formData.waterPrice.toString());
    payload.append("waterUnit", formData.waterUnit);
    payload.append("wifiPrice", formData.wifiPrice.toString());
    payload.append("parkingFee", formData.parkingFee.toString());
    payload.append("managementFee", formData.managementFee.toString());
    payload.append("miscNotes", formData.miscNotes);
    payload.append("cookingAllowed", formData.cookingAllowed.toString());
    payload.append("petAllowed", formData.petAllowed.toString());
    payload.append("gender", formData.gender);
    payload.append("curfew", formData.curfew.toString());
    payload.append("curfewTime", formData.curfewTime);
    payload.append("contactName", formData.contactName);
    payload.append("phone", formData.phone);
    payload.append("isDraft", isDraft.toString());

    // Amenities
    formData.amenities.forEach((id) => payload.append("amenities[]", id));

    // Image deletion - Gửi từng ID riêng lẻ thay vì JSON
    deleteImageIds.forEach((id) => {
      payload.append("deleteImageIds[]", id.toString());
    });

    // Thumbnail selection
    if (coverImageId) {
      payload.append("coverImageId", coverImageId.toString());
    } else if (newCoverIndex !== null) {
      payload.append("newCoverIndex", newCoverIndex.toString());
    }

    // New images
    newImages.forEach((file) => {
      payload.append("files", file);
    });

    return payload;
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    // Final validation for images
    const totalImages = existingImages.length + newImages.length;
    if (totalImages < 4) {
      toast.error('Ph\u1ea3i c\u00f3 \u00edt nh\u1ea5t 4 \u1ea3nh');
      setCurrentStep(5); // Go to images step
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = buildUpdatePayload(false);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms/${roomId}`, {
        method: "PATCH",
        credentials: "include",
        body: payload,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Cập nhật tin đăng thành công! Đang chờ duyệt...");
        router.push("/dashboard/host/rooms");
      } else {
        throw new Error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật tin đăng"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDraft = async () => {
    try {
      setIsSubmitting(true);
      const payload = buildUpdatePayload(true);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms/${roomId}`, {
        method: "PATCH",
        credentials: "include",
        body: payload,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Đã lưu bản nháp!");
        router.push("/dashboard/host/rooms");
      } else {
        throw new Error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Save draft error:", error);
      toast.error("Không thể lưu nháp");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1_BasicInfo
            formData={formData}
            handleInputChange={handleInputChange}
            errors={errors}
          />
        );
      case 2:
        return (
          <Step2_Location
            formData={formData}
            handleInputChange={handleInputChange}
            errors={errors}
            availableDistricts={availableDistricts}
            availableWards={availableWards}
          />
        );
      case 3:
        return (
          <Step3_SpecsAndAmenities
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      case 4:
        return (
          <Step4_Pricing
            formData={formData}
            handleInputChange={handleInputChange}
            errors={errors}
          />
        );
      case 5:
        return (
          <Step5_Images
            existingImages={existingImages}
            newImagePreviews={newImagePreviews}
            coverImageId={coverImageId}
            newCoverIndex={newCoverIndex}
            onNewImageUpload={handleNewImageUpload}
            onRemoveExisting={removeExistingImage}
            onRemoveNew={removeNewImage}
            onSetExistingCover={setExistingAsCover}
            onSetNewCover={setNewAsCover}
            errors={errors}
          />
        );
      case 6:
        return (
          <Step6_Contact
            formData={formData}
            handleInputChange={handleInputChange}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <Header currentStep={currentStep} />

      <div className="pt-24 pb-32 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 px-6">
            <h2 className="text-sm font-medium text-slate-500 mb-1">
              Chỉnh sửa tin đăng
            </h2>
            <h1 className="text-2xl font-bold text-slate-900">
              {STEPS[currentStep - 1]?.title}
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              {STEPS[currentStep - 1]?.desc}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            {renderStepContent()}
          </div>
        </div>
      </div>

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
