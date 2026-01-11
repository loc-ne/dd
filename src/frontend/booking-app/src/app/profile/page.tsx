"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  // State cho chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State form data
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhoneNumber(user.phoneNumber || "");
      setPreviewAvatar(user.avatarUrl || null);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  const handleSendVerification = async () => {
    if (isSendingEmail) return;
    setIsSendingEmail(true);

    try {
      const res = await fetch(`${API_URL}/auth/send-verification-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (res.ok) {
        toast.success("Đã gửi email xác thực! Vui lòng kiểm tra hộp thư.");
      } else {
        toast.error("Gửi email thất bại. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối đến server.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Lấy data cũ từ user
      const oldData = {
        fullName: user?.fullName || "",
        phoneNumber: user?.phoneNumber || "",
      };

      // Lấy data mới từ form
      const newData = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      };

      // Kiểm tra fullName hợp lệ
      if (!newData.fullName) {
        toast.error("Họ tên không được để trống");
        setIsSaving(false);
        return;
      }

      if (newData.fullName.length < 2 || newData.fullName.length > 100) {
        toast.error("Họ tên phải từ 2 đến 100 ký tự");
        setIsSaving(false);
        return;
      }

      // Kiểm tra phoneNumber: nếu không rỗng thì phải đúng định dạng
      if (newData.phoneNumber && !/^(0|\+84)(\d{9,10})$/.test(newData.phoneNumber)) {
        toast.error("Số điện thoại không đúng định dạng Việt Nam");
        setIsSaving(false);
        return;
      }

      // Tạo FormData để gửi
      const formData = new FormData();

      // Chỉ gửi những trường thay đổi
      if (newData.fullName !== oldData.fullName) {
        formData.append("fullName", newData.fullName);
      }
      if (newData.phoneNumber !== oldData.phoneNumber) {
        formData.append("phoneNumber", newData.phoneNumber);
      }
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await fetch(`${API_URL}/users/profile`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");

      toast.success("Cập nhật thông tin thành công!");

      await refreshUser();

      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi cập nhật profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6 text-slate-900">
        Hồ sơ cá nhân
      </h1>

      {!user.isActive && (
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3">
          <svg
            className="w-5 h-5 text-slate-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 text-sm font-medium">
              Vui lòng xác thực email để sử dụng đầy đủ tính năng
            </p>
          </div>
          <button
            onClick={handleSendVerification}
            disabled={isSendingEmail}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition disabled:opacity-50 flex-shrink-0"
          >
            {isSendingEmail ? "Đang gửi..." : "Gửi email"}
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6">
          {!isEditing ? (
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center border border-slate-200 shadow-sm">
                    <span className="text-white text-3xl font-semibold">
                      {user.fullName?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {user.fullName}
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">{user.email}</p>
                  <span className="inline-block mt-2 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded font-medium">
                    {user.role || "Thành viên"}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5 space-y-4">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-slate-600 text-sm">Số điện thoại:</span>
                  <span className="text-slate-900 text-sm font-medium">
                    {user.phoneNumber || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-slate-600 text-sm">Trạng thái:</span>
                  <span
                    className={`text-sm font-medium ${
                      user.isActive ? "text-green-600" : "text-slate-500"
                    }`}
                  >
                    {user.isActive ? "Đã xác thực" : "Chưa xác thực"}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition"
                >
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Ảnh đại diện
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={previewAvatar || "https://via.placeholder.com/150"}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border border-slate-200"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-slate-200 file:text-sm file:font-medium file:bg-white file:text-slate-700 hover:file:bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm transition"
                    placeholder="Nhập họ tên của bạn"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm transition"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarFile(null);
                    setPreviewAvatar(user.avatarUrl || null);
                  }}
                  className="px-5 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
