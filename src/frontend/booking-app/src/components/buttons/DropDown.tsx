"use client";

import React, { useEffect } from "react";
import { useRef, useState } from "react";

interface DropDownButtonProps {
  onSelected?: (index: number) => void;
  label: string;
  items?: string[];
}

function ButtonDropDown({
  label,
  onSelected,

  items,
}: DropDownButtonProps) {
  const [openDropdown, setOpenDropdown] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(label);

  // This is used to close drop down went clicking outside
  const dropDown = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropDown.current &&
        !dropDown.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (index: number) => {
    items && setTitle(items[index]);
    setOpenDropdown(false);
    onSelected?.(index);
  };

  return (
    <div className="relative flex-1 w-fit h-fit min-w-[180px]" ref={dropDown}>
      <p className="block text-gray-600 font-medium mb-1">{label}</p>
      <div
        className={`border rounded-xl px-4 py-2 bg-white cursor-pointer shadow-sm hover:shadow-md transition-all text-gray-800`}
        onClick={() => setOpenDropdown(!openDropdown)}
      >
        {title ? title : `Chọn ${label.toLowerCase()}`}
      </div>
      {openDropdown && (
        <ul
          className={`absolute mt-1 w-full bg-white border rounded-xl shadow-lg z-10 overflow-hidden`}
        >
          {items?.map((items, index) => (
            <li
              key={index}
              className={`px-4 py-2 hover:bg-blue-50 transition cursor-pointer`}
              onClick={() => handleSelect(index)}
            >
              {items}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ButtonDropDown;
