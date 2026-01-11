"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState("Đang xác thực email của bạn...");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const router = useRouter();
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link xác thực không hợp lệ hoặc đã hết hạn.");
      return;
    }

    fetch(`${API_URL}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("Email của bạn đã được xác thực thành công!");
          setTimeout(() => {
            router.push("/");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Xác thực thất bại. Vui lòng thử lại.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Có lỗi xảy ra. Vui lòng thử lại sau.");
      });
  }, [token, API_URL]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          {status === "pending" && (
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          )}
          {status === "error" && (
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {status === "pending" && "Đang xác thực..."}
          {status === "success" && "Xác thực thành công!"}
          {status === "error" && "Xác thực thất bại"}
        </h1>

        {/* Message */}
        <p className="text-gray-500 mb-8">{message}</p>

        {/* Actions */}
        {status === "success" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Bạn có thể sử dụng toàn bộ tính năng của tài khoản ngay bây giờ.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              <Mail className="w-4 h-4" />
              Về trang đăng nhập
            </Link>
          </div>
        )}

        {status === "pending" && (
          <p className="text-sm text-gray-400">
            Vui lòng đợi trong giây lát...
          </p>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
