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
      {label && <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">{label}</p>}
      <div className="relative flex items-center justify-center">
        {/* Center Indicator */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-14 w-14 border-2 border-primary rounded-xl bg-primary/5 shadow-inner" />
        </div>

        {/* Scroll Container */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory py-4 no-scrollbar items-center px-[calc(50%-32px)]"
        >
          {numbers.map((num) => (
            <div 
              key={num}
              className={cn(
                "flex-none w-16 h-12 flex items-center justify-center snap-center cursor-pointer transition-all duration-200",
                num === value ? "text-2xl font-black text-primary" : "text-lg font-medium text-muted-foreground opacity-30"
              )}
              onClick={() => onChange(num)}
            >
              {num}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollPicker;