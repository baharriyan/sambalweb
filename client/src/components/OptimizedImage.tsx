import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  /** Responsive sizes attribute for srcSet */
  sizes?: string;
  /** Aspect ratio for placeholder (e.g. "1/1", "4/5", "16/9") */
  aspectRatio?: string;
}

/**
 * Optimized Image component with:
 * - Intersection Observer for true lazy loading (defers offscreen images)
 * - Native lazy loading as fallback
 * - Blur placeholder while loading
 * - Error handling with fallback
 * - fetchpriority for LCP images
 * - Responsive sizes support
 */
export default function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc = "/attached_assets/placeholder.png",
  priority = false,
  sizes,
  aspectRatio,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority); // Priority images are immediately visible
  const containerRef = useRef<HTMLDivElement>(null);

  // Use IntersectionObserver for non-priority images
  useEffect(() => {
    if (priority || isVisible) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px 0px", // Start loading 200px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, isVisible]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-slate-100", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Skeleton Placeholder */}
      {(!loaded || !isVisible) && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-shimmer" />
      )}

      {/* Only render img when visible (IntersectionObserver triggered) */}
      {isVisible && (
        <img
          key={src}
          src={error ? fallbackSrc : src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setError(true);
            setLoaded(true);
          }}
          {...props}
        />
      )}
    </div>
  );
}

OptimizedImage.displayName = "OptimizedImage";
