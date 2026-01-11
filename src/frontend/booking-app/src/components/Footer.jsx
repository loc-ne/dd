"use client";

import React from "react";
import {
    Phone,
    Mail,
    MapPin,
    Heart,
    Facebook,
    Instagram,
    Linkedin,
} from "lucide-react";

const MemberItem = ({ name, phone, email }) => (
    <div className="p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-500/50 hover:shadow-md transition-all">
        <h4 className="font-medium text-slate-900">{name}</h4>

        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <Phone size={13} className="text-blue-600" />
            <span>{phone}</span>
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 break-all">
            <Mail size={13} className="text-blue-600" />
            <span>{email}</span>
        </div>
    </div>
);

const MomoIcon = () => (
    <svg
        viewBox="0 0 88 88"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect fill="#a50064" width="88" height="88" rx="12" />
        <path
            d="M63.5 14C55.3 14 48.7 20.4 48.7 28.2S55.3 42.4 63.5 42.4s14.8-6.4 14.8-14.2S71.7 14 63.5 14zm0 20.2c-3.3 0-6.3-3.1-6.3-6s3-6 6.3-6 6.3 3.1 6.3 6-2.7 6-6.3 6zm-19-9.6V42.5H36V24.6a2.5 2.5 0 0 0-5 0v17.9h-8.5V24.6a2.5 2.5 0 0 0-5 0v17.9H9V24.7A10.9 10.9 0 0 1 20 14a11.3 11.3 0 0 1 6.7 2.1 11.4 11.4 0 0 1 6.6-2.1 10.9 10.9 0 0 1 11.2 10.6zM63.5 48.5c-8.2 0-14.8 6.4-14.8 14.2s6.6 14.2 14.8 14.2s14.8-6.4 14.8-14.2S71.7 48.5 63.5 48.5zm0 20.2c-3.1 0-6.3-3-6.3-6s3.1-6 6.3-6 6.3 3.1 6.3 6-3 6-6.3 6zM44.5 59.2v17.8H36V59.1a2.5 2.5 0 0 0-5 0v17.9h-8.5V59.1a2.5 2.5 0 0 0-5 0v17.9H9V59.2A10.9 10.9 0 0 1 20 48.5a11.4 11.4 0 0 1 6.7 2.1 11.3 11.3 0 0 1 6.6-2.1 10.9 10.9 0 0 1 11.2 10.7z"
            fill="#fff"
        />
    </svg>
);

export default function Footer() {
    const teamMembers = [
        { name: "Nguyễn Quốc Lộc", phone: "0973277984", email: "nakrothnguyen127@gmail.com" },
        { name: "Phạm Trần Thanh Phong", phone: "0797423318", email: "phongpham26122007@gmail.com" },
        { name: "Huỳnh Đăng Khoa", phone: "0326291609", email: "khoahuynh787898@gmail.com" },
        { name: "Nguyễn Văn Phước", phone: "0937179611", email: "nguyenvanphuoc1172@gmail.com" },
        { name: "Hà Công Thuận", phone: "0818120250", email: "hazzthuan@gmail.com" },
    ];

    return (
        <footer className="bg-white text-slate-600 border-t border-slate-200">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Cột 1 ---------------------------------------------------------------- */}
                    <div className="lg:col-span-4 space-y-5">
                        <div className="flex items-center gap-4">
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="w-full h-40 object-contain"
                            />

                        </div>

                        <p className="text-sm leading-relaxed text-slate-600">
                            Nền tảng kết nối người thuê và cho thuê phòng trọ hàng đầu.
                            Chúng tôi mang đến trải nghiệm tìm kiếm và đăng phòng
                            nhanh chóng, minh bạch và an toàn.
                        </p>
                    </div>

                    {/* Cột 2 ---------------------------------------------------------------- */}
                    <div className="lg:col-span-5">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <Heart className="text-blue-600" size={18} />
                            Đội ngũ phát triển
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {teamMembers.map((m, index) => (
                                <MemberItem key={index} name={m.name} phone={m.phone} email={m.email} />
                            ))}
                        </div>
                    </div>

                    {/* Cột 3 ---------------------------------------------------------------- */}
                    <div className="lg:col-span-3 space-y-10">

                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">
                                Thanh toán
                            </h3>

                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-white border border-slate-200 shadow-sm rounded-xl p-1 hover:shadow-md transition-all">
                                    <MomoIcon />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-3">
                                Văn phòng
                            </h3>

                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                    <MapPin size={16} className="text-blue-600 mt-0.5" />
                                    Thành phố Thủ Đức, TP. Hồ Chí Minh
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail size={16} className="text-blue-600" />
                                    admin@gmail.com
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright ---------------------------------------------------------------- */}
            <div className="border-t border-slate-200 py-4 bg-slate-50">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-2">
                    <p>© 2024 Phòng Trọ VIP. All rights reserved.</p>

                    <div className="flex gap-6">
                        <a href="#" className="hover:text-blue-600">Điều khoản</a>
                        <a href="#" className="hover:text-blue-600">Bảo mật</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
