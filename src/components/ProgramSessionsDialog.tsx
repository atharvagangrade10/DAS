"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Program, Session, SessionUpdate } from "@/types/program";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProgramSessionsDialogProps {
  program: Program;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const fetchProgramSessions = async (programId: string): Promise<Session[]> => {
  const response = await fetch(`http://127.0.0.1:8000/program/${programId}/sessions`);
  if (!response.ok) {
    throw new Error("Failed to fetch program sessions");
  }
  const data = await response.json();
  if (Array.isArray(data)) {
    return data;
  }
  return [];
};

const updateProgramSessionsDates = async (
  programId: string,
  updates: SessionUpdate[],
): Promise<any> => {
  const response = await fetch(
    `http://127.0.0.1:8000/program/${programId}/sessions/update-dates`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    },
  );
  if (!response.ok) {
    throw new Error("Failed to update program session dates");
  }
  return response.json();
};

const ProgramSessionsDialog: React.FC<ProgramSessionsDialogProps> = ({
  program,
  isOpen,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const [sessionDates, setSessionDates] = React.useState<Record<string, Date>>({});
  const [initialSessionDates, setInitialSessionDates] = React.useState<Record<string, Date>>({});

  const {
    data: sessions,
    isLoading,
    error,
  } = useQuery<Session[], Error>({
    queryKey: ["programSessions", program.id],
    queryFn: () => fetchProgramSessions(program.id),
    enabled: isOpen, // Only fetch when dialog is open
    onSuccess: (data) => {
      console.log("ProgramSessionsDialog: API fetched sessions data:", data); // Debug 1
      const currentDatesMap: Record<string, Date> = {};
      const initialDatesMap: Record<string, Date> = {};
      data.forEach((session) => {
        if (session.id && session.date) {
          const parsedDate = parseISO(session.date);
          const normalizedDate = startOfDay(parsedDate);
          if (!isNaN(normalizedDate.getTime())) {
            currentDatesMap[session.id] = normalizedDate;
            // Create a new Date object from the timestamp to ensure it's a true copy
            initialDatesMap[session.id] = new Date(normalizedDate.getTime());
          } else {
            console.error(`ProgramSessionsDialog: Invalid date string for session ${session.id}: "${session.date}"`);
            toast.error(`Invalid date for session ${session.name || session.id}`, {
              description: `Could not parse date: "${session.date}"`,
            });
          }
        } else {
          console.error(`ProgramSessionsDialog: Session missing ID or date:`, session);
          toast.error(`Missing data for a session`, {
            description: `Session ID or date is missing.`,
          });
        }
      });
      setSessionDates(currentDatesMap);
      setInitialSessionDates(initialDatesMap);
      console.log("ProgramSessionsDialog: Initial sessionDates state:", currentDatesMap); // Debug 2
      console.log("ProgramSessionsDialog: Initial initialSessionDates state:", initialDatesMap); // Debug 3
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updates: SessionUpdate[]) =>
      updateProgramSessionsDates(program.id, updates),
    onSuccess: () => {
      toast.success("Session dates updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["programSessions", program.id] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to update session dates", {
        description: error.message,
      });
    },
  });

  const handleDateChange = (sessionId: string, newDate: Date | undefined) => {
    if (newDate) {
      const normalizedNewDate = startOfDay(newDate);
      setSessionDates((prev) => {
        const updated = {
          ...prev,
          [sessionId]: normalizedNewDate,
        };
        console.log("ProgramSessionsDialog: handleDateChange - updated sessionDates:", updated); // Debug 4
        return updated;
      });
    }
  };

  const hasChanges = React.useMemo(() => {
    if (!sessions || Object.keys(initialSessionDates).length === 0) {
      console.log("ProgramSessionsDialog: hasChanges - No sessions or initial dates. Returning false."); // Debug 5
      return false;
    }
    const changesDetected = sessions.some(session => {
      const current = sessionDates[session.id];
      const initial = initialSessionDates[session.id];
      if (!current || !initial) {
        console.log(`ProgramSessionsDialog: hasChanges - Missing current or initial date for session ${session.id}. Skipping.`); // Debug 6
        return false;
      }
      const currentFormatted = format(current, "yyyy-MM-dd");
      const initialFormatted = format(initial, "yyyy-MM-dd");
      const changed = currentFormatted !== initialFormatted;
      console.log(`ProgramSessionsDialog: hasChanges - Session ${session.id}: Current=${currentFormatted}, Initial=${initialFormatted}, Changed=${changed}`); // Debug 7
      return changed;
    });
    console.log("ProgramSessionsDialog: hasChanges - Final result:", changesDetected); // Debug 8
    return changesDetected;
  }, [sessions, sessionDates, initialSessionDates]);

  const onSubmit = () => {
    if (!sessions) return;

    const updates: SessionUpdate[] = [];
    sessions.forEach((session) => {
      const current = sessionDates[session.id];
      const initial = initialSessionDates[session.id];

      if (current && initial && format(current, "yyyy-MM-dd") !== format(initial, "yyyy-MM-dd")) {
        updates.push({
          session_id: session.id,
          new_date: format(current, "yyyy-MM-dd"),
        });
      }
    });

    if (updates.length > 0) {
      updateMutation.mutate(updates);
    } else {
      toast.info("No changes to save.");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Sessions for {program.program_name}</DialogTitle>
          <DialogDescription>
            View and update the dates for each session of this program.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="grid gap-4 py-4">
            {isLoading ? (
              <div className="flex items-center space-x-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>Loading sessions...</p>
              </div>
            ) : error ? (
              <p className="text-red-500">Error: {error.message}</p>
            ) : sessions && sessions.length > 0 ? (
              sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between gap-2">
                  <span className="font-medium">{session.name || `Session ${session.id.substring(0, 8)}`}:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[200px] pl-3 text-left font-normal",
                          !sessionDates[session.id] && "text-muted-foreground"
                        )}
                      >
                        {sessionDates[session.id] ? (
                          format(sessionDates[session.id], "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={sessionDates[session.id]}
                        onSelect={(date) => handleDateChange(session.id, date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No sessions found for this program.</p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={updateMutation.isPending || !hasChanges}
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProgramSessionsDialog;