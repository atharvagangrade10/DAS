"use client";

import React from "react";
import { format, subDays, addDays, isSameDay, eachDayOfInterval, isToday, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface ActivityHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const ActivityHeader: React.FC<ActivityHeaderProps> = ({ selectedDate, onDateChange }) => {
  const weekDays = eachDayOfInterval({
    start: subDays(selectedDate, 3),
    end: addDays(selectedDate, 3),
  });

  const handlePrevDay = () => onDateChange(subDays(selectedDate, 1));
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1));

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm pt-4 pb-6 border-b">
      <div className="flex items-center justify-between px-6 mb-6">
        <h2 className="text-2xl font-black text-primary tracking-tight">Sadhana Log</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                <CalendarIcon className="h-5 w-5" />
                <span className="sr-only">Open calendar</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              disabled={(date) => date > startOfDay(new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2 px-4">
        <Button variant="ghost" size="icon" onClick={handlePrevDay} className="shrink-0 h-12 w-10">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <div className="flex-1 flex justify-between gap-1 overflow-x-auto no-scrollbar py-2">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isFut = day > startOfDay(new Date());
            
            return (
              <button
                key={day.toString()}
                onClick={() => onDateChange(day)}
                disabled={isFut}
                className={cn(
                  "flex flex-col items-center min-w-[50px] py-3 rounded-2xl transition-all duration-300",
                  isSelected 
                    ? "bg-primary text-primary-foreground shadow-xl ring-4 ring-primary/10 scale-110" 
                    : "text-muted-foreground hover:bg-muted/50",
                  isFut && "opacity-20 grayscale pointer-events-none"
                )}
              >
                <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", isSelected ? "text-primary-foreground/70" : "text-muted-foreground/60")}>
                    {format(day, "MMM")}
                </span>
                <span className="text-xl font-black leading-none mb-1">{format(day, "d")}</span>
                <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-primary-foreground/70" : "text-muted-foreground/60")}>
                    {format(day, "EEE")}
                </span>
              </button>
            );
          })}
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNextDay} 
          disabled={isToday(selectedDate)}
          className="shrink-0 h-12 w-10"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default ActivityHeader;