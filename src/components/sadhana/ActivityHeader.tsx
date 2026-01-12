"use client";

import React from "react";
import { format, subDays, addDays, isSameDay, startOfWeek, eachDayOfInterval, isToday, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface ActivityHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const ActivityHeader: React.FC<ActivityHeaderProps> = ({ selectedDate, onDateChange }) => {
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
  const weekDays = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: addDays(startOfCurrentWeek, 6),
  });

  const handlePrevDay = () => onDateChange(subDays(selectedDate, 1));
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1));
  const handleSelectDay = (date: Date) => onDateChange(date);

  return (
    <div className="sticky top-0 z-10 bg-background border-b pb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-4xl font-bold">Sadhana Log</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {isToday(selectedDate) ? "Today" : format(selectedDate, "MMM dd, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Week View */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handlePrevDay}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex space-x-1 overflow-x-auto">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isPast = day < startOfDay(new Date());
            const dayLabel = format(day, "EEE");
            const dateLabel = format(day, "d");

            return (
              <Button
                key={day.toString()}
                variant="outline"
                size="lg"
                className={cn(
                  "flex flex-col h-16 w-14 p-1 transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted/50 hover:bg-muted",
                  !isPast && !isSelected && "opacity-70"
                )}
                onClick={() => handleSelectDay(day)}
              >
                <span className="text-xs font-medium">{format(day, "MMM")}</span>
                <span className="text-xl font-bold">{dateLabel}</span>
                <span className="text-xs">{dayLabel}</span>
              </Button>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" onClick={handleNextDay} disabled={isSameDay(selectedDate, new Date()) || selectedDate > new Date()}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ActivityHeader;