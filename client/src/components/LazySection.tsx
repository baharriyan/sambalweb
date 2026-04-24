import { useState, useRef, useEffect, ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  /** Skeleton placeholder height (CSS value) */
  minHeight?: string;
  /** How far before viewport to start loading */
  rootMargin?: string;
  /** Optional className for the wrapper */
  className?: string;
}

/**
 * Defers rendering of children until the section is near the viewport.
 * This prevents below-the-fold sections from making API calls and
 * rendering heavy components on initial page load.
 */
export default function LazySection({
  children,
  minHeight = "300px",
  rootMargin = "300px 0px",
  className,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (isVisible) {
    return <>{children}</>;
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight }}
      aria-hidden="true"
    />
  );
}

LazySection.displayName = "LazySection";
