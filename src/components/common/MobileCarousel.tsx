import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface MobileCarouselRef {
  scrollToSlide: (index: number) => void;
  activeIndex: number;
}

export interface MobileCarouselProps {
  title?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  actionButton?: React.ReactNode;
  children: React.ReactNode[];
  className?: string;
  initialIndex?: number;
  plain?: boolean;
}

export const MobileCarousel = forwardRef<MobileCarouselRef, MobileCarouselProps>(({
  title,
  icon,
  subtitle,
  badge,
  actionButton,
  children,
  className = '',
  initialIndex = 0,
  plain = false,
}, ref) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToSlide = (index: number) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const targetChild = container.children[index] as HTMLElement;
    if (targetChild) {
      container.scrollTo({
        left: targetChild.offsetLeft,
        behavior: 'smooth',
      });
    }
    setActiveIndex(index);
  };

  useImperativeHandle(ref, () => ({
    scrollToSlide,
    activeIndex,
  }), [activeIndex]);

  useEffect(() => {
    if (initialIndex > 0) {
      const timer = setTimeout(() => {
        scrollToSlide(initialIndex);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [initialIndex]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i] as HTMLElement;
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(containerCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    setActiveIndex(closestIndex);
  };

  return (
    <div
      className={
        plain
          ? `w-full space-y-2 ${className}`
          : `w-full bg-[#1A0C3B]/95 backdrop-blur-xl border border-[#3A1C61] rounded-3xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(147,51,234,0.15)] space-y-3 ${className}`
      }
    >
      {/* Header section if title/icon/badge exists */}
      {(title || badge || actionButton) && (
        <div
          className={`flex items-center justify-between pb-1.5 ${
            plain ? 'border-b border-purple-800/40' : 'border-b border-[#3A1C61]/80'
          }`}
        >
          <div className="flex items-center space-x-2 min-w-0">
            {icon}
            <div className="min-w-0">
              {title && <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate">{title}</h3>}
              {subtitle && <p className="text-[11px] text-purple-300 font-medium truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {badge}
            {actionButton}
          </div>
        </div>
      )}

      {/* Swipeable Container */}
      <div className="relative group">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-3 pb-1 transition-all scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {children.map((child, idx) => (
            <div
              key={idx}
              className="w-full shrink-0 snap-center snap-always"
              style={{ scrollSnapStop: 'always' }}
            >
              {child}
            </div>
          ))}
        </div>

        {/* Carousel Bottom Controls & Indicators */}
        {children.length > 1 && (
          <div
            className={`flex items-center justify-between pt-2 px-1 ${
              plain ? 'border-t border-purple-800/40' : 'border-t border-[#3A1C61]/50'
            }`}
          >
            {/* Prev Button */}
            <button
              onClick={() => scrollToSlide(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="w-7 h-7 rounded-full bg-[#12072B] border border-purple-600/40 flex items-center justify-center text-purple-300 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
              aria-label="Previous card"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Slide Count & Pagination Dots */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
                {activeIndex + 1} / {children.length}
              </span>
              <div className="flex items-center space-x-1.5">
                {children.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToSlide(idx)}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      activeIndex === idx
                        ? 'w-5 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_8px_rgba(251,226,120,0.6)]'
                        : 'w-2 h-2 bg-purple-900/80 hover:bg-purple-600 border border-purple-500/30'
                    }`}
                    aria-label={`Go to card ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => scrollToSlide(Math.min(children.length - 1, activeIndex + 1))}
              disabled={activeIndex === children.length - 1}
              className="w-7 h-7 rounded-full bg-[#12072B] border border-purple-600/40 flex items-center justify-center text-purple-300 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
              aria-label="Next card"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

MobileCarousel.displayName = 'MobileCarousel';

