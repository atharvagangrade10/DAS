"use client";

import React from "react";
import { format, subDays, addDays, isSameDay, startOfWeek, eachDayOfInterval, isToday, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActivityHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const ActivityHeader: React.FC<ActivityHeaderProps> = ({ selectedDate, onDateChange }) => {
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
  const weekDays = eachDayOfInterval({
    start: subDays(selectedDate, 3),
    end: addDays(selectedDate, 3),
  });

  const handlePrevDay = () => onDateChange(subDays(selectedDate, 1));
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1));

  return (
    <div className="sticky top-0 z-20 bg-background pt-2 pb-4">
      <div className="flex items-center justify-between px-2 mb-4">
        <h2 className="text-2xl font-black text-primary tracking-tight">Sadhana Log</h2>
        <Button variant="ghost" size="icon" className="rounded-full">
            <CalendarIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-1 px-1">
        <Button variant="ghost" size="icon" onClick={handlePrevDay} className="shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 flex justify-between overflow-x-hidden">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isFut = day > startOfDay(new Date());
            
            return (
              <button
                key={day.toString()}
                onClick={() => onDateChange(day)}
                disabled={isFut}
                className={cn(
                  "flex flex-col items-center min-w-[44px] py-2 rounded-xl transition-all duration-300",
                  isSelected 
                    ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="text-[10px] font-bold uppercase opacity-70 mb-1">{format(day, "MMM")}</span>
                <span className="text-lg font-black leading-none mb-1">{format(day, "d")}</span>
                <span className="text-[10px] font-medium opacity-70">{format(day, "EEE")}</span>
              </button>
            );
          })}
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNextDay} 
          disabled={isToday(selectedDate)}
          className="shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ActivityHeader;