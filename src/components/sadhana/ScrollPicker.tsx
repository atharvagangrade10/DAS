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
    const itemWidth = 60; 
    const index = Math.round(scrollLeft / itemWidth);
    const newValue = numbers[index];
    
    if (newValue !== undefined && newValue !== value) {
      onChange(newValue);
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
        if (scrollRef.current) {
            const index = numbers.indexOf(value);
            if (index !== -1) {
              scrollRef.current.scrollLeft = index * 60;
            }
        }
    }, 100);
    return () => clearTimeout(timer);
  }, [value, numbers]);

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && <p className="text-xs font-black text-center text-muted-foreground uppercase tracking-widest">{label}</p>}
      <div className="relative flex flex-col items-center justify-center h-24">
        {/* Highlighter */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="h-14 w-14 rounded-2xl border-2 border-primary/20 bg-primary/5" />
        </div>

        {/* Scroll Container */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar items-center py-4 relative z-0"
          style={{ paddingLeft: 'calc(50% - 30px)', paddingRight: 'calc(50% - 30px)' }}
        >
          {numbers.map((num) => (
            <div 
              key={num}
              className={cn(
                "flex-none w-[60px] h-12 flex items-center justify-center snap-center cursor-pointer transition-all duration-200",
                num === value ? "text-4xl font-black text-primary" : "text-xl font-bold text-muted-foreground/30"
              )}
              onClick={() => onChange(num)}
            >
              {num}
            </div>
          ))}
        </div>
        
        {/* Indicator */}
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-primary mt-1" />
      </div>
    </div>
  );
};

export default ScrollPicker;