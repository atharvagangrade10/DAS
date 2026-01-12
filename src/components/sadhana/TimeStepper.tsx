"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeStepperProps {
  hour: number; // 0-23
  minute: number; // 0-59
  onChange: (hour: number, minute: number) => void;
}

const TimeStepper: React.FC<TimeStepperProps> = ({ hour, minute, onChange }) => {
  // Convert 24h to 12h for UI
  const isPM = hour >= 12;
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  const adjustHour = (amount: number) => {
    let newHour = (hour + amount + 24) % 24;
    onChange(newHour, minute);
  };

  const adjustMinute = (amount: number) => {
    let newMin = (minute + amount + 60) % 60;
    onChange(hour, newMin);
  };

  const toggleAMPM = () => {
    let newHour = isPM ? hour - 12 : hour + 12;
    onChange(newHour, minute);
  };

  return (
    <div className="space-y-6 w-full py-2">
      <div className="flex items-center justify-around gap-2">
        {/* Hour Section */}
        <div className="flex flex-col items-center gap-2">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => adjustHour(1)}>
            <Plus className="h-5 w-5" />
          </Button>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black tabular-nums">{displayHour.toString().padStart(2, '0')}</span>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Hour</span>
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => adjustHour(-1)}>
            <Minus className="h-5 w-5" />
          </Button>
        </div>

        <span className="text-3xl font-black text-muted-foreground/30 mb-8">:</span>

        {/* Minute Section */}
        <div className="flex flex-col items-center gap-2">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => adjustMinute(5)}>
            <Plus className="h-5 w-5" />
          </Button>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black tabular-nums">{minute.toString().padStart(2, '0')}</span>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Min</span>
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={() => adjustMinute(-5)}>
            <Minus className="h-5 w-5" />
          </Button>
        </div>

        {/* AM/PM Toggle */}
        <div className="flex flex-col gap-2 mb-2">
            <Button 
                variant={!isPM ? "default" : "outline"} 
                className={cn("h-12 w-14 font-black rounded-xl", !isPM && "shadow-lg")}
                onClick={() => isPM && toggleAMPM()}
            >
                AM
            </Button>
            <Button 
                variant={isPM ? "default" : "outline"} 
                className={cn("h-12 w-14 font-black rounded-xl", isPM && "shadow-lg")}
                onClick={() => !isPM && toggleAMPM()}
            >
                PM
            </Button>
        </div>
      </div>
    </div>
  );
};

export default TimeStepper;