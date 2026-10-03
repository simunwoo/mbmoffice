"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const activeSrc = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-background">
        {activeSrc && (
          <Image
            key={activeSrc}
            src={activeSrc}
            alt={alt}
            fill
            className="object-contain p-8"
            sizes="(min-width: 1024px) 560px, 100vw"
            priority
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-background transition ${
                active === i ? "border-brand" : "border-border hover:border-brand/50"
              }`}
              aria-label={`${alt} 이미지 ${i + 1}`}
            >
              <Image src={src} alt="" fill className="object-contain p-1.5" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
