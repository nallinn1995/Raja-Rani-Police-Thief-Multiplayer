import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileCarouselProps {
  title?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  actionButton?: React.ReactNode;
  children: React.ReactNode[];
  className?: string;
}

export const MobileCarousel: React.FC<MobileCarouselProps> = ({
  title,
  icon,
  subtitle,
  badge,
  actionButton,
  children,
  className = '',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const index = Math.round(scrollLeft / clientWidth);
      setActiveIndex(index);
    }
  };

  const scrollToSlide = (index: number) => {
    if (!scrollRef.current) return;
    const clientWidth = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: index * clientWidth,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  };

  return (
    <div className={`w-full bg-[#1A0C3B]/95 backdrop-blur-xl border border-[#3A1C61] rounded-3xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(147,51,234,0.15)] space-y-3 ${className}`}>
      {/* Header section if title/icon/badge exists */}
      {(title || badge || actionButton) && (
        <div className="flex items-center justify-between pb-2 border-b border-[#3A1C61]/80">
          <div className="flex items-center space-x-2">
            {icon}
            <div>
              {title && <h3 className="text-base font-extrabold text-white tracking-wide">{title}</h3>}
              {subtitle && <p className="text-[11px] text-purple-300 font-medium">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
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
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none space-x-3 pb-1 transition-all scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {children.map((child, idx) => (
            <div key={idx} className="w-full shrink-0 snap-center">
              {child}
            </div>
          ))}
        </div>

        {/* Carousel Bottom Controls & Indicators */}
        {children.length > 1 && (
          <div className="flex items-center justify-between pt-2.5 border-t border-[#3A1C61]/50 px-1">
            {/* Prev Button */}
            <button
              onClick={() => scrollToSlide(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="w-7 h-7 rounded-full bg-[#12072B] border border-[#3A1C61] flex items-center justify-center text-purple-300 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              aria-label="Previous card"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Pagination Dots */}
            <div className="flex items-center space-x-1.5">
              {children.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSlide(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    activeIndex === idx
                      ? 'w-5 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_8px_rgba(251,226,120,0.6)]'
                      : 'w-2 h-2 bg-purple-900/80 hover:bg-purple-600 border border-purple-500/30'
                  }`}
                  aria-label={`Go to card ${idx + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => scrollToSlide(Math.min(children.length - 1, activeIndex + 1))}
              disabled={activeIndex === children.length - 1}
              className="w-7 h-7 rounded-full bg-[#12072B] border border-[#3A1C61] flex items-center justify-center text-purple-300 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              aria-label="Next card"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
