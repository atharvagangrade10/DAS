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

interface DOBInputProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  label?: string;
}

const DOBInput: React.FC<DOBInputProps> = ({ value, onChange, label = "Date of Birth" }) => {
  const [day, setDay] = React.useState<string>(value ? value.getDate().toString() : "");
  const [month, setMonth] = React.useState<string>(value ? (value.getMonth() + 1).toString() : "");
  const [year, setYear] = React.useState<string>(value ? value.getFullYear().toString() : "");

  // Update internal state if external value changes (e.g., during form reset or initial load)
  React.useEffect(() => {
    if (value) {
      setDay(value.getDate().toString());
      setMonth((value.getMonth() + 1).toString());
      setYear(value.getFullYear().toString());
    } else {
      setDay("");
      setMonth("");
      setYear("");
    }
  }, [value]);

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => (currentYear - i).toString());

  const handleDateChange = (newDay: string, newMonth: string, newYear: string) => {
    if (newDay && newMonth && newYear) {
      const date = new Date(parseInt(newYear), parseInt(newMonth) - 1, parseInt(newDay));
      // Check if the date is valid (e.g., avoids Feb 31st)
      if (date.getDate() === parseInt(newDay)) {
        onChange(date);
      } else {
        onChange(null); // Invalid date
      }
    } else {
      onChange(null);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        <Select
          value={day}
          onValueChange={(val) => {
            setDay(val);
            handleDateChange(val, month, year);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="DD" />
          </SelectTrigger>
          <SelectContent>
            {days.map((d) => (
              <SelectItem key={d} value={d}>
                {d.padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={month}
          onValueChange={(val) => {
            setMonth(val);
            handleDateChange(day, val, year);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={year}
          onValueChange={(val) => {
            setYear(val);
            handleDateChange(day, month, val);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="YYYY" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default DOBInput;