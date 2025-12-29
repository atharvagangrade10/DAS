"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isValid, isAfter, isBefore } from "date-fns";

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
  maxLength,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  maxLength: number;
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            // Only allow numbers and respect max length
            if (/^\d*$/.test(val) && val.length <= maxLength) {
              onChange(val);
            }
          }}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          className="w-full text-center"
        />
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-[var(--radix-popover-trigger-width)]" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()} // Don't steal focus from input
      >
        <Command>
          <CommandList>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className="justify-center text-center cursor-pointer"
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
  // Use local state for the strings so typing isn't interrupted
  const [day, setDay] = React.useState<string>("");
  const [month, setMonth] = React.useState<string>("");
  const [year, setYear] = React.useState<string>("");

  // Initialize from value prop only once or when value changes from outside
  React.useEffect(() => {
    if (value && isValid(value)) {
      const d = value.getDate().toString().padStart(2, "0");
      const m = (value.getMonth() + 1).toString().padStart(2, "0");
      const y = value.getFullYear().toString();
      
      // Only update if different to avoid focus/cursor jumps
      if (d !== day) setDay(d);
      if (m !== month) setMonth(m);
      if (y !== year) setYear(y);
    } else if (value === null || value === undefined) {
      // If parent explicitly clears, we clear
      if (day !== "" || month !== "" || year !== "") {
        setDay("");
        setMonth("");
        setYear("");
      }
    }
  }, [value]);

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => (currentYear - i).toString());

  const validateAndTriggerChange = (dStr: string, mStr: string, yStr: string) => {
    const d = parseInt(dStr);
    const m = parseInt(mStr);
    const y = parseInt(yStr);

    if (!isNaN(d) && !isNaN(m) && !isNaN(y) && yStr.length === 4) {
      const date = new Date(y, m - 1, d);
      const today = new Date();
      const minDate = new Date(1900, 0, 1);

      // Verify it's a valid calendar date (e.g. Feb 30 is invalid)
      if (
        date.getFullYear() === y && 
        date.getMonth() === m - 1 && 
        date.getDate() === d &&
        isBefore(date, today) &&
        isAfter(date, minDate)
      ) {
        onChange(date);
        return;
      }
    }
    // If any part is incomplete or invalid, parent value is null
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        <TypeableSelect
          value={day}
          onChange={(val) => {
            setDay(val);
            validateAndTriggerChange(val, month, year);
          }}
          options={days}
          placeholder="DD"
          maxLength={2}
        />
        <TypeableSelect
          value={month}
          onChange={(val) => {
            setMonth(val);
            validateAndTriggerChange(day, val, year);
          }}
          options={months}
          placeholder="MM"
          maxLength={2}
        />
        <TypeableSelect
          value={year}
          onChange={(val) => {
            setYear(val);
            validateAndTriggerChange(day, month, val);
          }}
          options={years}
          placeholder="YYYY"
          maxLength={4}
        />
      </div>
    </div>
  );
};

export default DOBInput;