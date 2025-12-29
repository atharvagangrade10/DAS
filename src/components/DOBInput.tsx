"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { isValid, isAfter, isBefore } from "date-fns";

interface DOBInputProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  label?: React.ReactNode;
}

const DOBInput: React.FC<DOBInputProps> = ({ value, onChange, label = "Date of Birth" }) => {
  const [day, setDay] = React.useState<string>("");
  const [month, setMonth] = React.useState<string>("");
  const [year, setYear] = React.useState<string>("");

  // Sync state with incoming value prop
  React.useEffect(() => {
    if (value && isValid(value)) {
      setDay(value.getDate().toString().padStart(2, "0"));
      setMonth((value.getMonth() + 1).toString().padStart(2, "0"));
      setYear(value.getFullYear().toString());
    } else if (value === null || value === undefined) {
      setDay("");
      setMonth("");
      setYear("");
    }
  }, [value]);

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => (currentYear - i).toString());

  const handleValueChange = (dStr: string, mStr: string, yStr: string) => {
    // If any part is missing, set the external value to null and stop processing.
    if (!dStr || !mStr || !yStr) {
      onChange(null);
      return;
    }
    
    const d = parseInt(dStr, 10);
    const m = parseInt(mStr, 10);
    const y = parseInt(yStr, 10);

    // Check if parsing resulted in valid numbers
    if (isNaN(d) || isNaN(m) || isNaN(y)) {
        onChange(null);
        return;
    }

    const date = new Date(y, m - 1, d);
    const today = new Date();
    const minDate = new Date(1900, 0, 1);

    // Verify it's a valid calendar date (e.g., not Feb 30th)
    // and check constraints (not in the future, not too far in the past)
    if (
      date.getFullYear() === y && 
      date.getMonth() === m - 1 && 
      date.getDate() === d &&
      isBefore(date, today) &&
      isAfter(date, minDate)
    ) {
      onChange(date);
    } else {
      // If the date is invalid (e.g., Feb 30th, or future date)
      onChange(null);
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase ml-1">Day</Label>
          <Select
            value={day}
            onValueChange={(val) => {
              setDay(val);
              handleValueChange(val, month, year);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="DD" />
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase ml-1">Month</Label>
          <Select
            value={month}
            onValueChange={(val) => {
              setMonth(val);
              handleValueChange(day, val, year);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="MM" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase ml-1">Year</Label>
          <Select
            value={year}
            onValueChange={(val) => {
              setYear(val);
              handleValueChange(day, month, val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="YYYY" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default DOBInput;