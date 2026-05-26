"use client"; // 🚀 This tells Next.js this component is allowed to handle clicks!

import { useState } from "react";

export default function ImageGallery({ mediaUrls }: { mediaUrls: string | string[] }) {
  // 1. Safely parse the database string back into a real array
  let images: string[] = [];
  try {
    images = typeof mediaUrls === "string" ? JSON.parse(mediaUrls) : mediaUrls;
    if (!Array.isArray(images) || images.length === 0) {
      images = ["https://placehold.co/600x800/1a1a1a/333333?text=No+Image"];
    }
  } catch (e) {
    images = ["https://placehold.co/600x800/1a1a1a/333333?text=No+Image"];
  }

  // 2. State to track which image is currently selected (defaults to the first one)
  const [activeImage, setActiveImage] = useState(images[0]);

  return (
    <div className="flex flex-col gap-4">
      
      {/* 🌟 The Main Large Viewport */}
      <div className="aspect-[4/5] md:aspect-square w-full relative rounded-2xl overflow-hidden bg-white/5 border border-white/10">
        <img 
          src={activeImage} 
          alt="Main Item View" 
          className="w-full h-full object-cover transition-opacity duration-300" 
        />
      </div>

      {/* 🌟 The Clickable Thumbnail Strip (Only shows if there is more than 1 image) */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveImage(img)}
              className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                activeImage === img 
                  ? "border-white opacity-100 shadow-[0_0_15px_rgba(255,255,255,0.3)]" // Active State
                  : "border-transparent opacity-50 hover:opacity-100" // Inactive State
              }`}
            >
              <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}