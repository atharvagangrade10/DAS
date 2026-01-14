"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, subDays, setHours, setMinutes } from "date-fns";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ActivityLogResponse, ActivityLogCreate } from "@/types/sadhana";
import { fetchActivityLogByDate, createActivityLog } from "@/utils/api";
import ActivityHeader from "@/components/sadhana/ActivityHeader";
import WorshipCard from "@/components/sadhana/WorshipCard";
import ChantingSection from "@/components/sadhana/ChantingSection";
import AssociationSection from "@/components/sadhana/AssociationSection";
import BookReadingSection from "@/components/sadhana/BookReadingSection";
import NotesSection from "@/components/sadhana/NotesSection";

const Sadhana = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = React.useState<Date>(startOfDay(new Date()));
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  
  const todayStart = startOfDay(new Date());
  const isFuture = selectedDate > todayStart;

  // 1. Fetch Activity Log
  const { data: activityLog, isLoading, error } = useQuery<ActivityLogResponse, Error>({
    queryKey: ["activityLog", dateStr],
    queryFn: async () => {
      if (!user?.user_id) throw new Error("User not authenticated.");
      return fetchActivityLogByDate(user.user_id, dateStr);
    },
    enabled: !!user?.user_id && !isFuture,
    retry: (failureCount, error) => {
      if (error.message.includes("Status: 404")) return false;
      return failureCount < 3;
    },
  });

  // 2. Fallback Creation
  const createMutation = useMutation({
    mutationFn: (data: ActivityLogCreate) => createActivityLog(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activityLog", dateStr] }),
  });

  React.useEffect(() => {
    const isNotFoundError = error?.message.includes("Status: 404") || error?.message.toLowerCase().includes("not found");
    if (user?.user_id && !isLoading && !isFuture && !activityLog && isNotFoundError && !createMutation.isPending) {
      createMutation.mutate({
        participant_id: user.user_id,
        today_date: dateStr,
        sleep_at: setHours(setMinutes(subDays(selectedDate, 1), 0), 22).toISOString(),
        wakeup_at: setHours(setMinutes(selectedDate, 0), 4).toISOString(),
        no_meat: true,
        no_intoxication: true,
        no_illicit_sex: true,
        no_gambling: true,
        only_prasadam: true,
        notes_of_day: null,
        mangla_attended: false,
        narshima_attended: false,
        tulsi_arti_attended: false,
        darshan_arti_attended: false,
        guru_puja_attended: false,
        sandhya_arti_attended: false,
      });
    }
  }, [user?.user_id, isLoading, activityLog, error, dateStr, isFuture, createMutation, selectedDate]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-md mx-auto">
        <ActivityHeader selectedDate={selectedDate} onDateChange={setSelectedDate} />
        
        <div className="px-4 py-6 space-y-10">
          {isLoading || createMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Hare Krishna...</p>
            </div>
          ) : isFuture ? (
            <div className="text-center py-20 space-y-4">
              <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 opacity-20" />
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Future Date Selected</h3>
            </div>
          ) : activityLog ? (
            <>
              <WorshipCard activity={activityLog} readOnly={isFuture} />
              <ChantingSection activity={activityLog} readOnly={isFuture} />
              <AssociationSection activity={activityLog} readOnly={isFuture} />
              <BookReadingSection activity={activityLog} readOnly={isFuture} />
              <NotesSection activity={activityLog} readOnly={isFuture} />
              
              <div className="pt-10 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-30">Your daily journey continues</p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Sadhana;