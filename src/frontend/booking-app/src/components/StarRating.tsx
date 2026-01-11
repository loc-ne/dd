'use client';

import { Star } from "lucide-react"; // dùng star trong comment
import { useState } from 'react';

// Rating dùng Star
export default  function StarRating({
    value,
    onChange,
    readonly = false,
  }: {
    value: number;
    onChange?: (v: number) => void;
    readonly?: boolean;
  }) {
    // return (
    //   <div className="flex items-center gap-1">
    //     {[1, 2, 3, 4, 5].map((star) => (
    //       <Star
    //         key={star}
    //         className={`w-5 h-5 cursor-pointer ${
    //           value >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
    //         }`}
    //         onClick={() => !readonly && onChange?.(star)}
    //       />
    //     ))}
    //   </div>
    // );

    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const displayValue = hoverValue ?? value;

    const calcValue = (
      e: React.MouseEvent<HTMLDivElement>,
      star: number
    ) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      return x < rect.width / 2 ? star - 0.5 : star;
    };

    return (
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = displayValue >= star;
          const isHalf = displayValue >= star - 0.5 && displayValue < star;

          return (
            <div
              key={star}
              className="relative w-5 h-5 cursor-pointer"
              onMouseMove={(e) =>
                !readonly && setHoverValue(calcValue(e, star))
              }
              onClick={(e) =>
                !readonly && onChange?.(calcValue(e, star))
              }
            >
              <Star className="w-5 h-5 text-gray-300" />

              {isHalf && (
                <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </div>
              )}

              {isFull && (
                <Star className="absolute top-0 left-0 w-5 h-5 text-yellow-400 fill-yellow-400" />
              )}
            </div>
          );
        })}
      </div>
    );  
  }