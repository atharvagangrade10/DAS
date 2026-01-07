"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, BarChart3, Info, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Batch, BatchRecursionEnum } from "@/types/batch";
import { useQuery } from "@tanstack/react-query";
import { fetchBatchParticipants, fetchParticipantById } from "@/utils/api";
import { addDays, isBefore, startOfDay, format, parseISO } from "date-fns";
import { Participant } from "@/types/participant";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BatchStatsDialogProps {
  batch: Batch;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BatchStatsDialog: React.FC<BatchStatsDialogProps> = ({ batch, isOpen, onOpenChange }) => {
  // Fetch participants for this batch
  const { data: currentMappings, isLoading: isLoadingMappings } = useQuery({
    queryKey: ["batchParticipants", batch.id],
    queryFn: () => fetchBatchParticipants(batch.id),
    enabled: isOpen,
  });

  // Fetch detailed participant profiles
  const { data: participants, isLoading: isLoadingParticipants } = useQuery<Participant[]>({
    queryKey: ["batchParticipantDetailsForStats", batch.id, currentMappings?.length],
    queryFn: async () => {
      if (!currentMappings) return [];
      const promises = currentMappings.map((m) =>
        fetchParticipantById(m.participant_id)
      );
      return Promise.all(promises);
    },
    enabled: !!currentMappings,
  });

  // Calculate total possible sessions based on recurrence
  const totalPossibleSessions = React.useMemo(() => {
    if (!batch.start_date) return 0;

    let count = 0;
    let currentDate = startOfDay(parseISO(batch.start_date));
    const today = startOfDay(new Date());

    while (isBefore(currentDate, addDays(today, 1))) { // Include today
      if (batch.recursion_type === BatchRecursionEnum.daily) {
        count++;
      } else if (batch.recursion_type === BatchRecursionEnum.weekly) {
        const dayOfWeek = currentDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
        // Adjust to match 0 for Monday, 6 for Sunday if batch.days_of_week uses that
        const adjustedDayOfWeek = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; 
        if (batch.days_of_week.includes(adjustedDayOfWeek)) {
          count++;
        }
      }
      currentDate = addDays(currentDate, 1);
    }
    return count;
  }, [batch.start_date, batch.recursion_type, batch.days_of_week]);

  const isLoading = isLoadingMappings || isLoadingParticipants;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <BarChart3 className="h-6 w-6 text-primary" />
            Class Stats: {batch.name}
          </DialogTitle>
          <DialogDescription>
            Overview of participants and theoretical session count.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6 py-4">
              {/* Overall Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : participants?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Registered for this class.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Possible Sessions</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {totalPossibleSessions}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Since {format(parseISO(batch.start_date), "MMM dd, yyyy")}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* API Limitation Note */}
              <div className="p-4 bg-amber-50/20 border border-amber-200 rounded-lg flex items-start gap-3 text-sm text-amber-800 dark:bg-amber-950/20 dark:border-amber-700 dark:text-amber-200">
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Detailed Attendance Stats Not Available</h4>
                  <p className="mt-1">
                    Comprehensive attendance percentages for this class are not yet available due to current backend API limitations. This feature requires an API endpoint to fetch full attendance history for a batch.
                  </p>
                </div>
              </div>

              {/* Participants List (without individual attendance for now) */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Participants
                </h3>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-muted-foreground">Loading participants...</span>
                  </div>
                ) : participants && participants.length > 0 ? (
                  <div className="grid gap-2">
                    {participants.map((p) => (
                      <Card key={p.id} className="p-3 flex items-center gap-3 shadow-sm">
                        <Avatar className="h-9 w-9 border">
                          {p.profile_photo_url ? (
                            <AvatarImage src={p.profile_photo_url} alt={p.full_name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {p.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground">{p.phone}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No participants registered for this class yet.</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 pt-3 border-t">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchStatsDialog;