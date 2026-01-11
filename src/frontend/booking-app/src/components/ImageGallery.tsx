"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useCloudinaryImages } from "@/hooks/useCloudinaryImages";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

interface RoomImage {
  id: number;
  imageUrl: string;
  isThumbnail: boolean;
}

export default function ImageGallery({ images }: { images: RoomImage[] }) {
  const fileNames = images.map((img) => img.imageUrl);
  const { imageUrls, isLoading } = useCloudinaryImages(fileNames);

  const [selectedIndex, setSelectedIndex] = useState(
    images.findIndex((img) => img.isThumbnail) || 0
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const selectedImage = images[selectedIndex]?.imageUrl;

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    if (thumbnailsRef.current) {
      const container = thumbnailsRef.current;
      const selectedThumb = container.children[selectedIndex] as HTMLElement;

      if (selectedThumb) {
        const containerWidth = container.offsetWidth;
        const thumbLeft = selectedThumb.offsetLeft;
        const thumbWidth = selectedThumb.offsetWidth;
        const scrollLeft = thumbLeft - containerWidth / 2 + thumbWidth / 2;

        container.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") setIsFullscreen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
        <div className="w-full h-[500px] bg-gradient-to-br from-gray-200 to-gray-300" />
        <div className="flex gap-3 p-4 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-24 w-32 flex-shrink-0 bg-gray-300 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Main Image */}
        <div className="relative w-full h-[500px] group cursor-zoom-in bg-gradient-to-br from-gray-100 to-gray-200">
          <Image
            src={imageUrls[selectedImage] || "/placeholder.jpg"}
            alt="Room main image"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority
            onClick={() => setIsFullscreen(true)}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Fullscreen Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
          >
            <Maximize2 className="w-5 h-5 text-gray-800" />
          </button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white backdrop-blur-sm p-4 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 border border-gray-200"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white backdrop-blur-sm p-4 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 border border-gray-200"
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>
            </>
          )}
        </div>

        <div className="relative bg-gradient-to-br from-gray-50 to-white p-8">
          <div
            ref={thumbnailsRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`mt-5 gap-10 relative h-28 w-40 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
                  index === selectedIndex
                    ? "ring-4 ring-blue-600 shadow-2xl scale-110"
                    : "ring-2 ring-gray-200 hover:ring-blue-400 hover:shadow-lg hover:scale-105"
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <Image
                  src={imageUrls[image.imageUrl] || "/placeholder.jpg"}
                  alt={`Thumbnail ${image.id}`}
                  fill
                  className="object-cover"
                />
                {index === selectedIndex && (
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600/30 to-transparent" />
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/98 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-full text-white transition-all hover:scale-110 shadow-2xl border border-white/20"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto p-8">
            <Image
              src={imageUrls[selectedImage] || "/placeholder.jpg"}
              alt="Fullscreen image"
              fill
              className="object-contain drop-shadow-2xl"
            />
          </div>

          {/* Fullscreen Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md p-5 rounded-full transition-all hover:scale-110 shadow-2xl border border-white/20"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md p-5 rounded-full transition-all hover:scale-110 shadow-2xl border border-white/20"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-md px-8 py-4 rounded-full text-white font-semibold text-lg shadow-2xl border border-white/20">
            {selectedIndex + 1} / {images.length}
          </div>

          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === selectedIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
