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
    const itemWidth = 80; // Larger item width
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
        scrollRef.current.scrollLeft = index * 80;
      }
    }
  }, [value, numbers]);

  return (
    <div className={cn("space-y-4", className)}>
      {label && <p className="text-xs font-black text-center text-muted-foreground/60 uppercase tracking-[0.2em]">{label}</p>}
      <div className="relative flex flex-col items-center justify-center">
        {/* Selection Highlighter */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
            <div className="h-20 w-20 rounded-3xl border-2 border-primary/20 bg-primary/5 shadow-[0_0_40px_rgba(0,0,0,0.05)]" />
        </div>

        {/* Scroll Container */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory py-10 no-scrollbar items-center px-[calc(50%-40px)]"
        >
          {numbers.map((num) => (
            <div 
              key={num}
              className={cn(
                "flex-none w-20 h-16 flex items-center justify-center snap-center cursor-pointer transition-all duration-300",
                num === value ? "text-5xl font-black text-primary scale-125" : "text-2xl font-bold text-muted-foreground opacity-20 blur-[0.5px]"
              )}
              onClick={() => onChange(num)}
            >
              {num}
            </div>
          ))}
        </div>
        
        {/* Animated Arrow */}
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[12px] border-b-primary -mt-4 animate-bounce" />
      </div>
    </div>
  );
};

export default ScrollPicker;