import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface SwitchPageProps {
  onSwitch?: (page: number) => void;
  className?: string;
  maxPage: number;
}

function SwithPage({ maxPage, onSwitch, className }: SwitchPageProps) {
  const [page, setPage] = useState(1);
  const arr = useRef(Array.from({ length: maxPage + 1 }));

  useEffect(() => {
    onSwitch?.(page);
  }, [page]);

  return (
    <div
      className={`flex flex-row gap-2.5 justify-center items-center text-1xl ${className}`}
    >
      <button
        className="h-full"
        onClick={() => setPage(page - 1)}
        disabled={page > 1 ? false : true}
      >
        <ArrowLeft></ArrowLeft>
      </button>

      <div className="flex flex-wrap gap-2.5 justify-center text-1xl">
        {arr.current.map(
          (_, i) =>
            i !== 0 && (
              <button
                className={`flex text-center w-10 justify-center items-center
                rounded-sm bg-[#f3f3f3] cursor-pointer border-2  ${
                  page === i ? " border-black" : "border-transparent"
                }
             `}
                onClick={() => setPage(i)}
              >
                {i}
              </button>
            )
        )}
      </div>

      <button
        className="h-full"
        onClick={() => setPage(page + 1)}
        disabled={page < maxPage ? false : true}
      >
        <ArrowRight></ArrowRight>
      </button>
    </div>
  );
}

export default SwithPage;
