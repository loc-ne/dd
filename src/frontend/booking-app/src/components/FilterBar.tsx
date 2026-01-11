"use client";

import { useState } from "react";
import ButtonDropDown from "./buttons/DropDown";

interface FilterBarProps {
  onFilter?: ({}) => void;
  className?: string;
}

function FilterBar({ onFilter, className }: FilterBarProps) {
  const [filter, setFilter] = useState({});

  const cities = [
    "Hà Nội",
    "TP. Hồ Chí Minh",
    "Đà Nẵng",
    "Cần Thơ",
    "Hải Phòng",
    "Nha Trang",
  ];

  const roomTypes = ["Phòng trọ", "Căn hộ", "Nhà nguyên căn"];

  const priceRanges = [
    "Dưới 3 triệu",
    "3 – 5 triệu",
    "5 – 10 triệu",
    "Trên 10 triệu",
  ];

  const areaRanges = ["Dưới 20 m²", "20 – 40 m²", "40 – 60 m²", "Trên 60 m²"];

  const amentities = [
    "Máy lạnh",
    "Tủ lạnh",
    "Máy nước nóng",
    "Máy giặt",
    "Máy sưởi",
  ];

  const handleSelect = (field: string, value: string) => {
    setFilter((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearch = () => {
    console.log("Tìm kiếm với:", filter);
    onFilter?.(filter);
    // Todo: Call API hoặc là call bên ngoài
  };

  return (
    <div
      className={`w-fit max-w-5xl bg-white/80 backdrop-blur-md shadow-2xl 
        rounded-3xl p-6 flex flex-wrap justify-between gap-4 border border-gray-200
        ${className}
        `}
    >
      {/* Thành phố */}
      <ButtonDropDown
        label="Thành phố"
        onSelected={(index) => handleSelect("city", cities[index])}
        items={cities}
      ></ButtonDropDown>

      {/* Giá tiền */}
      <ButtonDropDown
        label="Giá tiền"
        onSelected={(index) => handleSelect("priceRange", priceRanges[index])}
        items={priceRanges}
      ></ButtonDropDown>

      {/* Loại phòng */}
      <ButtonDropDown
        label="Loại phòng"
        onSelected={(index) => handleSelect("roomType", roomTypes[index])}
        items={roomTypes}
      ></ButtonDropDown>

      {/* Diện tích */}
      <ButtonDropDown
        label="Diện tích"
        onSelected={(index) => handleSelect("areaRange", areaRanges[index])}
        items={areaRanges}
      ></ButtonDropDown>

      {/* Tiện ích */}
      <ButtonDropDown
        label="Tiện ích"
        onSelected={(index) => handleSelect("amentity", amentities[index])}
        items={amentities}
      ></ButtonDropDown>

      {/* Nút tìm kiếm */}
      <div className="min-w-[150px] flex justify-center">
        <button
          onClick={handleSearch}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl 
            px-6 py-3 transition-all duration-200 shadow-md cursor-pointer"
        >
          Tìm kiếm
        </button>
      </div>
    </div>
  );
}

export default FilterBar;
