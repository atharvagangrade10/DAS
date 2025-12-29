"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DOBInputProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  label?: React.ReactNode;
}

const TypeableSelect = ({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  className?: string;
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full"
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} className="h-9" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const DOBInput: React.FC<DOBInputProps> = ({ value, onChange, label = "Date of Birth" }) => {
  const [day, setDay] = React.useState<string>(value ? value.getDate().toString().padStart(2, "0") : "");
  const [month, setMonth] = React.useState<string>(value ? (value.getMonth() + 1).toString().padStart(2, "0") : "");
  const [year, setYear] = React.useState<string>(value ? value.getFullYear().toString() : "");

  React.useEffect(() => {
    if (value) {
      setDay(value.getDate().toString().padStart(2, "0"));
      setMonth((value.getMonth() + 1).toString().padStart(2, "0"));
      setYear(value.getFullYear().toString());
    } else {
      setDay("");
      setMonth("");
      setYear("");
    }
  }, [value]);

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => (currentYear - i).toString());

  const validateAndTriggerChange = (newDay: string, newMonth: string, newYear: string) => {
    const d = parseInt(newDay);
    const m = parseInt(newMonth);
    const y = parseInt(newYear);

    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      if (d > 0 && d <= 31 && m > 0 && m <= 12 && y > 1900) {
        const date = new Date(y, m - 1, d);
        // Check if the date is valid (e.g. avoids Feb 31st)
        if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
          onChange(date);
        } else {
          onChange(null);
        }
      } else {
        onChange(null);
      }
    } else {
      onChange(null);
    }
  };

  const handleDayChange = (val: string) => {
    setDay(val);
    validateAndTriggerChange(val, month, year);
  };

  const handleMonthChange = (val: string) => {
    setMonth(val);
    validateAndTriggerChange(day, val, year);
  };

  const handleYearChange = (val: string) => {
    setYear(val);
    validateAndTriggerChange(day, month, val);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        <TypeableSelect
          value={day}
          onChange={handleDayChange}
          options={days}
          placeholder="DD"
        />
        <TypeableSelect
          value={month}
          onChange={handleMonthChange}
          options={months}
          placeholder="MM"
        />
        <TypeableSelect
          value={year}
          onChange={handleYearChange}
          options={years}
          placeholder="YYYY"
        />
      </div>
    </div>
  );
};

export default DOBInput;