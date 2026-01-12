"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DurationPickerProps {
  value: number; // in minutes
  onChange: (value: number) => void;
  label?: string;
}

const PRESETS = [15, 30, 45, 60, 120];

const DurationPicker: React.FC<DurationPickerProps> = ({ value, onChange, label }) => {
  const formatDisplay = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ""}`;
    return `${m} mins`;
  };

  const adjust = (amount: number) => {
    const newValue = Math.max(0, value + amount);
    onChange(newValue);
  };

  return (
    <div className="space-y-4 w-full">
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
      
      {/* Main Display & Stepper */}
      <div className="flex items-center justify-between bg-muted/30 p-2 rounded-2xl border">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 rounded-xl"
          onClick={() => adjust(-5)}
          type="button"
        >
          <Minus className="h-6 w-6" />
        </Button>

        <div className="flex flex-col items-center flex-1">
            <div className="flex items-center gap-2 text-primary">
                <Clock className="h-4 w-4 opacity-50" />
                <span className="text-2xl font-black tracking-tight">{formatDisplay(value)}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground/60">Total Duration</span>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-12 w-12 rounded-xl"
          onClick={() => adjust(5)}
          type="button"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-5 gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            variant={value === preset ? "default" : "outline"}
            size="sm"
            className={cn(
                "h-10 rounded-lg text-[10px] font-bold uppercase p-0",
                value === preset ? "shadow-md scale-105 transition-transform" : "opacity-60"
            )}
            onClick={() => onChange(preset)}
            type="button"
          >
            {preset >= 60 ? `${preset/60}h` : `${preset}m`}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DurationPicker;