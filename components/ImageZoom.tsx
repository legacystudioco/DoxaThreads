"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageZoomProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
  priority?: boolean;
}

export function ImageZoom({
  src,
  alt,
  width = 800,
  height = 800,
  className = "w-full h-full object-contain",
  onClick,
  priority = false,
}: ImageZoomProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setZoom(1);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  return (
    <>
      {/* Image Container - Clickable */}
      <div
        className="cursor-zoom-in group relative overflow-hidden"
        onClick={handleOpenModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpenModal();
          }
        }}
        aria-label={`Click to zoom ${alt}`}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          priority={priority}
        />
        {/* Zoom Indicator */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <svg
              className="w-8 h-8 text-white drop-shadow-lg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom viewer"
        >
          {/* Modal Content */}
          <div className="relative w-full h-full max-w-4xl max-h-screen flex flex-col">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 p-2 bg-white hover:bg-neutral-200 rounded-full transition-colors"
              aria-label="Close zoom"
            >
              <svg
                className="w-6 h-6 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center overflow-auto">
              <div
                className="relative transition-transform duration-200 ease-out"
                style={{ transform: `scale(${zoom})` }}
              >
                <Image
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  className="max-w-2xl max-h-screen object-contain"
                  priority
                />
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 1}
                className="p-2 bg-white hover:bg-neutral-200 disabled:bg-neutral-400 rounded-full transition-colors"
                aria-label="Zoom out"
              >
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>

              <div className="text-white text-sm font-semibold min-w-12 text-center">
                {Math.round(zoom * 100)}%
              </div>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-2 bg-white hover:bg-neutral-200 disabled:bg-neutral-400 rounded-full transition-colors"
                aria-label="Zoom in"
              >
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>

              <span className="text-white text-xs ml-4">
                Scroll to zoom • Click outside to close
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
