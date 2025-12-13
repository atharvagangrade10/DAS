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
import { API_BASE_URL } from "@/config/api";

interface ProgramSessionsDialogProps {
  program: Program;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const fetchProgramSessions = async (programId: string): Promise<Session[]> => {
  console.log(`ProgramSessionsDialog: Attempting to fetch sessions for program ID: ${programId}`);
  const response = await fetch(`${API_BASE_URL}/program/${programId}/sessions`);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`ProgramSessionsDialog: API fetch failed with status ${response.status}: ${errorText}`);
    throw new Error(`Failed to fetch program sessions: ${errorText}`);
  }
  const data = await response.json();
  console.log("ProgramSessionsDialog: Raw API response data:", data);
  if (Array.isArray(data)) {
    return data;
  }
  console.warn("ProgramSessionsDialog: API response is not an array, returning empty array.");
  return [];
};

const updateProgramSessionsDates = async (
  programId: string,
  updates: SessionUpdate[],
): Promise<any> => {
  const response = await fetch(
    `${API_BASE_URL}/program/${programId}/sessions/update-dates`,
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

  console.log("ProgramSessionsDialog: Render - program.id:", program.id, "isOpen:", isOpen);
  console.log("ProgramSessionsDialog: Render - current sessionDates keys:", Object.keys(sessionDates).length);
  console.log("ProgramSessionsDialog: Render - current initialSessionDates keys:", Object.keys(initialSessionDates).length);

  const {
    data: sessions,
    isLoading,
    error,
  } = useQuery<Session[], Error>({
    queryKey: ["programSessions", program.id],
    queryFn: () => fetchProgramSessions(program.id),
    enabled: isOpen, // Only fetch when dialog is open
    onError: (err: Error) => {
      console.error("ProgramSessionsDialog: useQuery error:", err);
      toast.error("Error loading program sessions", {
        description: err.message,
      });
    },
  });

  console.log("ProgramSessionsDialog: useQuery hook returned - sessions:", sessions, "isLoading:", isLoading, "error:", error);

  // Effect to initialize sessionDates and initialSessionDates when sessions data is available
  React.useEffect(() => {
    console.log("ProgramSessionsDialog: useEffect for sessions data triggered.");
    if (sessions && sessions.length > 0 && !isLoading) {
      console.log("ProgramSessionsDialog: Sessions data available in useEffect:", sessions);
      const currentDatesMap: Record<string, Date> = {};
      const initialDatesMap: Record<string, Date> = {};
      sessions.forEach((session) => {
        console.log("ProgramSessionsDialog: Processing session in useEffect:", session);
        if (session.id && session.date) {
          const parsedDate = parseISO(session.date);
          console.log(`ProgramSessionsDialog: Session ${session.id} date "${session.date}" parsed to (useEffect):`, parsedDate);
          const normalizedDate = startOfDay(parsedDate);
          if (!isNaN(normalizedDate.getTime())) {
            currentDatesMap[session.id] = normalizedDate;
            initialDatesMap[session.id] = new Date(normalizedDate.getTime()); // Ensure a new Date object
          } else {
            console.error(`ProgramSessionsDialog: Invalid date string for session ${session.id}: "${session.date}" (useEffect)`);
            toast.error(`Invalid date for session ${session.name || session.id}`, {
              description: `Could not parse date: "${session.date}"`,
            });
          }
        } else {
          console.error(`ProgramSessionsDialog: Session missing ID or date (useEffect):`, session);
          toast.error(`Missing data for a session`, {
            description: `Session ID or date is missing.`,
          });
        }
      });
      console.log("ProgramSessionsDialog: Setting sessionDates with (useEffect):", currentDatesMap);
      setSessionDates(currentDatesMap);
      setInitialSessionDates(initialDatesMap);
      console.log("ProgramSessionsDialog: Initial sessionDates state (useEffect):", currentDatesMap);
      console.log("ProgramSessionsDialog: Initial initialSessionDates state (useEffect):", initialDatesMap);
    } else if (!sessions && !isLoading && isOpen) {
      console.log("ProgramSessionsDialog: No sessions data available after loading, and dialog is open.");
    }
  }, [sessions, isLoading, isOpen]); // Depend on sessions, isLoading, and isOpen

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
        console.log("ProgramSessionsDialog: handleDateChange - updated sessionDates:", updated);
        return updated;
      });
    }
  };

  const hasChanges = React.useMemo(() => {
    if (!sessions || Object.keys(initialSessionDates).length === 0) {
      console.log("ProgramSessionsDialog: hasChanges - No sessions or initial dates. Returning false.");
      return false;
    }
    const changesDetected = sessions.some(session => {
      const current = sessionDates[session.id];
      const initial = initialSessionDates[session.id];
      if (!current || !initial) {
        console.log(`ProgramSessionsDialog: hasChanges - Missing current or initial date for session ${session.id}. Skipping.`);
        return false;
      }
      const currentFormatted = format(current, "yyyy-MM-dd");
      const initialFormatted = format(initial, "yyyy-MM-dd");
      const changed = currentFormatted !== initialFormatted;
      console.log(`ProgramSessionsDialog: hasChanges - Session ${session.id}: Current=${currentFormatted}, Initial=${initialFormatted}, Changed=${changed}`);
      return changed;
    });
    console.log("ProgramSessionsDialog: hasChanges - Final result:", changesDetected);
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
              sessions.map((session) => {
                const sessionDate = sessionDates[session.id];
                console.log(`ProgramSessionsDialog: Rendering session ${session.id} (${session.name}). Date in state:`, sessionDate);
                return (
                  <div key={session.id} className="flex items-center justify-between gap-2">
                    <span className="font-medium">{session.name || `Unnamed Session`}:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[200px] pl-3 text-left font-normal",
                            !sessionDate && "text-muted-foreground"
                          )}
                        >
                          {sessionDate ? (
                            format(sessionDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={sessionDate}
                        onSelect={(date) => handleDateChange(session.id, date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  </div>
                );
              })
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
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProgramSessionsDialog;