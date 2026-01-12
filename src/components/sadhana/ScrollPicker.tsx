"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ScrollPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  label?: string;
  className?: string;
}

const ScrollPicker: React.FC<ScrollPickerProps> = ({ 
  min, 
  max, 
  value, 
  onChange, 
  step = 1,
  label,
  className 
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const numbers = React.useMemo(() => {
    const arr = [];
    for (let i = min; i <= max; i += step) arr.push(i);
    return arr;
  }, [min, max, step]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = 64; // w-16
    const index = Math.round(scrollLeft / itemWidth);
    const newValue = numbers[index];
    
    if (newValue !== undefined && newValue !== value) {
      onChange(newValue);
    }
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      const index = numbers.indexOf(value);
      if (index !== -1) {
        scrollRef.current.scrollLeft = index * 64;
      }
    }
  }, [value, numbers]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-bold text-center text-muted-foreground">{label}</p>}
      <div className="relative flex flex-col items-center justify-center">
        {/* Scroll Container */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory py-6 no-scrollbar items-center px-[calc(50%-32px)]"
        >
          {numbers.map((num) => (
            <div 
              key={num}
              className={cn(
                "flex-none w-16 h-12 flex items-center justify-center snap-center cursor-pointer transition-all duration-200",
                num === value ? "text-3xl font-black text-primary scale-110" : "text-xl font-medium text-muted-foreground opacity-20"
              )}
              onClick={() => onChange(num)}
            >
              {num}
            </div>
          ))}
        </div>
        
        {/* Triangle Indicator (from image) */}
        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] border-b-primary -mt-2" />
        <div className="w-full h-[1px] bg-muted-foreground/20 mt-4" />
      </div>
    </div>
  );
};

export default ScrollPicker;