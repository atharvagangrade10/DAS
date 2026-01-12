"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, isSameDay, subDays, parseISO, setHours, setMinutes } from "date-fns";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ActivityLogResponse, ActivityLogCreate } from "@/types/sadhana";
import { fetchActivityLogByDate, createActivityLog } from "@/utils/api";
import ActivityHeader from "@/components/sadhana/ActivityHeader";
import WorshipCard from "@/components/sadhana/WorshipCard";
import ChantingSection from "@/components/sadhana/ChantingSection";
import AssociationSection from "@/components/sadhana/AssociationSection";
import BookReadingSection from "@/components/sadhana/BookReadingSection";
import { Card, CardContent } from "@/components/ui/card";

const Sadhana = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = React.useState<Date>(startOfDay(new Date()));
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  
  const todayStart = startOfDay(new Date());
  const isFuture = selectedDate > todayStart;
  const isToday = isSameDay(selectedDate, new Date());
  const isEditable = !isFuture; // Today and past are editable

  // 1. Fetch Activity Log for the selected date
  const { data: activityLog, isLoading, error, isError } = useQuery<ActivityLogResponse, Error>({
    queryKey: ["activityLog", dateStr],
    queryFn: async () => {
      if (!user?.user_id) throw new Error("User not authenticated.");
      return fetchActivityLogByDate(user.user_id, dateStr);
    },
    enabled: !!user?.user_id && isEditable, // Enable query for today and past dates
    retry: (failureCount, error) => {
      // Do not retry on 404 (which means log doesn't exist)
      if (error.message.includes("Status: 404")) return false;
      return failureCount < 3;
    },
  });

  // 2. Mutation to create a new Activity Log
  const createMutation = useMutation({
    mutationFn: (data: ActivityLogCreate) => createActivityLog(data),
    onSuccess: (newLog) => {
      toast.success("New Sadhana log created for the day!");
      // Invalidate the query to fetch the newly created log
      queryClient.invalidateQueries({ queryKey: ["activityLog", dateStr] });
    },
    onError: (error: Error) => {
      toast.error("Failed to create log", { description: error.message });
    },
  });

  // 3. Check if log exists and create if necessary (only for today/past dates)
  React.useEffect(() => {
    // Check if the query indicates a 404 error
    const isNotFoundError = error?.message.includes("Status: 404") || error?.message.toLowerCase().includes("not found");

    if (
      user?.user_id && 
      !isLoading && 
      isEditable && 
      !activityLog && 
      isNotFoundError && 
      !createMutation.isPending // Prevent multiple creation attempts
    ) {
      // If log doesn't exist for an editable date, create it with default values
      console.log("Activity log not found for date:", dateStr, "- Triggering fallback creation.");
      
      // Default sleep time: 10 PM of the previous day relative to selectedDate
      const previousDay = subDays(selectedDate, 1);
      const defaultSleepTime = setHours(setMinutes(previousDay, 0), 22); 
      
      // Default wakeup time: 4 AM of the selectedDate
      const defaultWakeupTime = setHours(setMinutes(selectedDate, 0), 4); 

      const defaultLog: ActivityLogCreate = {
        participant_id: user.user_id,
        today_date: dateStr,
        sleep_at: defaultSleepTime.toISOString(),
        wakeup_at: defaultWakeupTime.toISOString(),
        no_meat: true,
        no_intoxication: true,
        no_illicit_sex: true,
        no_gambling: true,
        only_prasadam: true,
      };
      createMutation.mutate(defaultLog);
    }
  }, [user?.user_id, isLoading, activityLog, isEditable, error, dateStr, selectedDate, createMutation.isPending]);

  const readOnly = isFuture; // Read-only if future date

  const renderContent = () => {
    if (isLoading || createMutation.isPending) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">
            {createMutation.isPending 
              ? `Creating log for ${format(selectedDate, "PPP")}...` 
              : `Loading Sadhana log for ${format(selectedDate, "PPP")}...`}
          </p>
        </div>
      );
    }

    if (isFuture) {
      return (
        <div className="text-center py-20 space-y-4">
          <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
          <h3 className="text-xl font-semibold">Future Date Selected</h3>
          <p className="text-muted-foreground">You can only view or edit today's log or past logs.</p>
        </div>
      );
    }

    if (activityLog) {
      return (
        <div className="space-y-8">
          <WorshipCard activity={activityLog} readOnly={readOnly} />
          <ChantingSection activity={activityLog} readOnly={readOnly} />
          <AssociationSection activity={activityLog} readOnly={readOnly} />
          <BookReadingSection activity={activityLog} readOnly={readOnly} />
          
          {!isToday && (
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-800 dark:text-green-300">
                  Log for {format(selectedDate, "PPP")} is complete and saved.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    // If there was an error but it's NOT a 404, show the error state
    if (error && !error.message.includes("Status: 404") && !error.message.toLowerCase().includes("not found")) {
      return (
        <div className="text-center py-20 space-y-4 text-red-500">
          <AlertTriangle className="h-10 w-10 mx-auto" />
          <h3 className="text-xl font-semibold">Error Loading Log</h3>
          <p className="text-sm">{error.message}</p>
        </div>
      );
    }

    // While fallback creation is handled in useEffect, we show a loading-like state here if the createMutation hasn't started yet but query failed with 404
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Preparing your log for {format(selectedDate, "PPP")}...</p>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 sm:p-8 max-w-3xl">
      <ActivityHeader selectedDate={selectedDate} onDateChange={setSelectedDate} />
      <div className="mt-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default Sadhana;