"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Calendar as CalendarIcon,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Batch } from "@/types/batch";
import { Participant } from "@/types/participant";
import {
  fetchBatchAttendance,
  markBatchAttendanceBulk,
} from "@/utils/api";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AttendanceTabContentProps {
  batch: Batch;
  participants: Participant[];
  isLoadingParticipants: boolean;
  isOpen: boolean;
}

const AttendanceTabContent: React.FC<AttendanceTabContentProps> = ({
  batch,
  participants,
  isLoadingParticipants,
  isOpen,
}) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [attendanceStatuses, setAttendanceStatuses] = React.useState<
    Record<string, string>
  >({});

  // Fetch Attendance for Selected Date
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data: currentAttendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["batchAttendance", batch.id, dateStr],
    queryFn: () => fetchBatchAttendance(batch.id, dateStr),
    enabled: isOpen,
  });

  // Sync current attendance to state
  React.useEffect(() => {
    if (currentAttendance) {
      const initial: Record<string, string> = {};
      currentAttendance.forEach((a: any) => {
        initial[a.participant_id] = a.status;
      });
      setAttendanceStatuses(initial);
    }
  }, [currentAttendance]);

  // Mutations
  const saveAttendanceMutation = useMutation({
    mutationFn: (data: any) => markBatchAttendanceBulk(batch.id, data),
    onSuccess: () => {
      toast.success("Attendance saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["batchAttendance", batch.id, dateStr] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSaveAttendance = () => {
    const presentIds = Object.entries(attendanceStatuses)
      .filter(([_, status]) => status === "Present")
      .map(([id]) => id);

    saveAttendanceMutation.mutate({
      date: dateStr,
      participant_ids: presentIds,
      status: "Present",
      marked_by: "Admin",
    });
  };

  const handleMarkAllAbsent = () => {
    if (!participants) return;
    const absentStatuses = {};
    participants.forEach(p => {
      absentStatuses[p.id] = "Absent";
    });
    setAttendanceStatuses(absentStatuses);
    toast.info("All participants marked as Absent.");
  };

  const toggleStatus = (pId: string) => {
    setAttendanceStatuses((prev) => ({
      ...prev,
      [pId]: prev[pId] === "Present" ? "Absent" : "Present",
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
            Attendance Date
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[240px] justify-start text-left font-normal border-primary/20"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllAbsent}
          >
            Mark All Absent
          </Button>
          <Button
            size="sm"
            onClick={handleSaveAttendance}
            disabled={
              saveAttendanceMutation.isPending ||
              !participants ||
              participants.length === 0
            }
            className="gap-2"
          >
            {saveAttendanceMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center justify-between">
          Attendance Sheet
          <span className="text-xs font-normal text-muted-foreground italic">
            (Select date to view/edit)
          </span>
        </h4>
        {isLoadingAttendance || isLoadingParticipants ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading attendance sheet...
            </p>
          </div>
        ) : participants && participants.length > 0 ? (
          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="grid gap-2 p-2">
              {participants.map((p) => {
                const status = attendanceStatuses[p.id] || "Absent";
                const isPresent = status === "Present";
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "p-3 flex items-center justify-between border rounded-lg transition-all cursor-pointer",
                      isPresent
                        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                        : "bg-background"
                    )}
                    onClick={() => toggleStatus(p.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center border-2 transition-colors",
                          isPresent
                            ? "bg-green-500 border-green-500"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {isPresent && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{p.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.phone}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={isPresent ? "default" : "secondary"}
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        isPresent ? "bg-green-600 hover:bg-green-600" : ""
                      )}
                    >
                      {isPresent ? "Present" : "Absent"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">
              Add participants in the first tab to mark attendance.
            </p>
          </div>
        )}
      </div>
      <p className="text-xs text-amber-600 mt-4">
        Note: The backend must verify that the user marking attendance is an assigned volunteer for this batch.
      </p>
    </div>
  );
};

export default AttendanceTabContent;