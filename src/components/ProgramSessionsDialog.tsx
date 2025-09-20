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
import { format, parseISO, startOfDay } from "date-fns"; // Import startOfDay
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
      const datesMap: Record<string, Date> = {};
      data.forEach((session) => {
        if (session.id) {
          datesMap[session.id] = startOfDay(parseISO(session.date)); // Normalize to start of day
        }
      });
      setSessionDates(datesMap);
      setInitialSessionDates(datesMap); // Store initial dates for comparison
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
      setSessionDates((prev) => ({
        ...prev,
        [sessionId]: startOfDay(newDate), // Normalize to start of day
      }));
    }
  };

  const hasChanges = React.useMemo(() => {
    if (!sessions) return false;
    return sessions.some(session => {
      const current = sessionDates[session.id];
      const initial = initialSessionDates[session.id];
      // Compare formatted dates to ensure only day, month, year are considered
      return current && initial && format(current, "yyyy-MM-dd") !== format(initial, "yyyy-MM-dd");
    });
  }, [sessions, sessionDates, initialSessionDates]);

  const onSubmit = () => {
    const updates: SessionUpdate[] = sessions
      ? sessions
          .filter(session => {
            const current = sessionDates[session.id];
            const initial = initialSessionDates[session.id];
            return current && initial && format(current, "yyyy-MM-dd") !== format(initial, "yyyy-MM-dd");
          })
          .map((session) => ({
            session_id: session.id,
            new_date: format(sessionDates[session.id], "yyyy-MM-dd"),
          }))
      : [];

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