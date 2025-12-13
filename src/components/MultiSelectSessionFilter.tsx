"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { format, parseISO } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Session } from "@/types/program";

interface MultiSelectSessionFilterProps {
  sessions: Session[];
  selectedSessionIds: string[];
  onSelectedChange: (newSelectedIds: string[]) => void;
  disabled?: boolean;
}

const MultiSelectSessionFilter: React.FC<MultiSelectSessionFilterProps> = ({
  sessions,
  selectedSessionIds,
  onSelectedChange,
  disabled,
}) => {
  const [open, setOpen] = React.useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedChange(sessions.map((session) => session.id));
    } else {
      onSelectedChange([]);
    }
  };

  const handleSelectItem = (sessionId: string, checked: boolean) => {
    if (checked) {
      onSelectedChange([...selectedSessionIds, sessionId]);
    } else {
      onSelectedChange(selectedSessionIds.filter((id) => id !== sessionId));
    }
  };

  const isAllSelected = selectedSessionIds.length === sessions.length && sessions.length > 0;
  const isIndeterminate = selectedSessionIds.length > 0 && !isAllSelected;

  const displayValue =
    selectedSessionIds.length === 0
      ? "Select sessions..."
      : selectedSessionIds.length === sessions.length
      ? "All sessions selected"
      : `${selectedSessionIds.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search sessions..." />
          <CommandList>
            <CommandEmpty>No session found.</CommandEmpty>
            <CommandGroup>
              {sessions.length > 0 && (
                <CommandItem
                  onSelect={() => handleSelectAll(!isAllSelected)}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className={cn(isIndeterminate && "bg-primary")}
                  />
                  <span className="font-semibold">Select All</span>
                </CommandItem>
              )}
              {sessions.map((session) => (
                <CommandItem
                  key={session.id}
                  onSelect={() => handleSelectItem(session.id, !selectedSessionIds.includes(session.id))}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedSessionIds.includes(session.id)}
                    onCheckedChange={(checked: boolean) => handleSelectItem(session.id, checked)}
                  />
                  <span>
                    {session.name} ({format(parseISO(session.date), "MMM dd, yyyy")})
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelectSessionFilter;