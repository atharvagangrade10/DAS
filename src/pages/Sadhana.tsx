"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, subDays, setHours, setMinutes, parse, getHours, getMinutes } from "date-fns";
import { Loader2, AlertTriangle, BarChart2, Copy, Share2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ActivityLogResponse, ActivityLogCreate } from "@/types/sadhana";

import { toast } from "sonner";
import { formatSadhanaReport, copyToClipboard } from "@/utils/sadhanaFormatters";
import { fetchActivityLogByDate, createActivityLog, updateActivityLog, fetchBatchAttendance } from "@/utils/api";
import ActivityHeader from "@/components/sadhana/ActivityHeader";
import WorshipCard from "@/components/sadhana/WorshipCard";
import ChantingSection from "@/components/sadhana/ChantingSection";
import AssociationSection from "@/components/sadhana/AssociationSection";
import BookReadingSection from "@/components/sadhana/BookReadingSection";
import NotesSection from "@/components/sadhana/NotesSection";
import ExerciseSection from "@/components/sadhana/ExerciseSection";


const Sadhana = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = React.useState<Date>(startOfDay(new Date()));
  const [targetFinishedTime, setTargetFinishedTime] = React.useState<string>("");
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

  // 1.1 Fetch Previous Day Activity Log (for Sleep)
  const prevDateStr = format(subDays(selectedDate, 1), "yyyy-MM-dd");
  const { data: prevActivityLog } = useQuery<ActivityLogResponse, Error>({
    queryKey: ["activityLog", prevDateStr],
    queryFn: async () => {
      if (!user?.user_id) throw new Error("User not authenticated.");
      return fetchActivityLogByDate(user.user_id, prevDateStr);
    },
    enabled: !!user?.user_id,
    retry: false, // Don't retry if not found
  });

  // 1.2 Fetch Sanjeevani Class Attendance
  // Batch ID for Sanjeevani: 695e8a0f91d5274d0da3bf1d
  const { data: sanjeevaniAttendance } = useQuery({
    queryKey: ["batchAttendance", "695e8a0f91d5274d0da3bf1d", dateStr],
    queryFn: () => fetchBatchAttendance("695e8a0f91d5274d0da3bf1d", dateStr),
    enabled: !!user?.user_id && !isFuture,
  });

  const isSanjeevaniAttended = React.useMemo(() => {
    if (!sanjeevaniAttendance || !user?.user_id) return false;
    // Check if user is in the list and status is Present
    return sanjeevaniAttendance.some((record: any) =>
      record.participant_id === user.user_id && record.status === "Present"
    );
  }, [sanjeevaniAttendance, user?.user_id]);

  React.useEffect(() => {
    if (activityLog?.finished_by) {
      setTargetFinishedTime(format(new Date(activityLog.finished_by), "h:mm a"));
    } else {
      setTargetFinishedTime("");
    }
  }, [activityLog?.finished_by]);

  // 2. Fallback Creation
  const createMutation = useMutation({
    mutationFn: (data: ActivityLogCreate) => createActivityLog(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activityLog", dateStr] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateActivityLog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      toast.success("Activity log updated successfully.");
    },
  });

  const handleTargetFinishedTimeChange = (time: string) => {
    setTargetFinishedTime(time);
    if (!activityLog) return;

    try {
      const parsedTime = parse(time, "h:mm a", new Date());
      const fullDate = setMinutes(setHours(selectedDate, getHours(parsedTime)), getMinutes(parsedTime));

      updateMutation.mutate({
        id: activityLog.id,
        data: { finished_by: format(fullDate, "yyyy-MM-dd'T'HH:mm:ss") }
      });
    } catch (e) {
      console.error("Failed to parse time", e);
    }
  };

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
        exercise_time: 0,
      });
    }
  }, [user?.user_id, isLoading, activityLog, error, dateStr, isFuture, createMutation, selectedDate]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-4xl mx-auto w-full">
        <ActivityHeader selectedDate={selectedDate} onDateChange={setSelectedDate} />

        <div className="px-4 py-6 space-y-10">
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 self-start sm:self-auto">Daily Entry</h3>

            <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full gap-2 font-bold bg-background shadow-sm border-2 border-primary/10 hover:bg-primary/5 hover:border-primary/20"
                onClick={async () => {
                  if (activityLog) {
                    const text = formatSadhanaReport(
                      activityLog,
                      targetFinishedTime,
                      prevActivityLog?.sleep_at,
                      user?.chanting_rounds ?? 16,
                      user?.initiated_name || user?.full_name || "Participant",
                      isSanjeevaniAttended
                    );

                    // Use robust copy utility
                    const success = await copyToClipboard(text);
                    if (success) {
                      toast.success("Sadhana report copied");
                    } else {
                      toast.error("Failed to copy. Please try Share instead.");
                    }
                  }
                }}
                disabled={!activityLog}
              >
                <Copy className="h-4 w-4 text-primary" />
                <span className="hidden xs:inline-block">Copy</span>
              </Button>

              {/* Share Button (Always Visible - Fallback to WhatsApp) */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full gap-2 font-bold bg-background shadow-sm border-2 border-primary/10 hover:bg-primary/5 hover:border-primary/20"
                onClick={async () => {
                  if (activityLog) {
                    const text = formatSadhanaReport(
                      activityLog,
                      targetFinishedTime,
                      prevActivityLog?.sleep_at,
                      user?.chanting_rounds ?? 16,
                      user?.initiated_name || user?.full_name || "Participant",
                      isSanjeevaniAttended
                    );

                    // Try Native Share
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: 'Sadhana Report',
                          text: text,
                        });
                        toast.success("Shared successfully");
                        return; // Exit if native share worked
                      } catch (err) {
                        console.error("Native share failed/cancelled, trying fallback", err);
                      }
                    }

                    // Fallback to WhatsApp
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(whatsappUrl, '_blank');
                    toast.success("Opening WhatsApp...");
                  }
                }}
                disabled={!activityLog}
              >
                <Share2 className="h-4 w-4 text-blue-500" />
                <span className="inline-block">Share</span>
              </Button>

              <Link to="/sadhana/insights">
                <Button variant="ghost" size="sm" className="h-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5">
                  <BarChart2 className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

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
              <WorshipCard activity={activityLog} readOnly={isFuture} userId={user?.user_id} />
              <ChantingSection
                activity={activityLog}
                readOnly={isFuture}
                targetFinishedTime={targetFinishedTime}
                onTargetFinishedTimeChange={handleTargetFinishedTimeChange}
              />
              <AssociationSection
                activity={activityLog}
                readOnly={isFuture}
                initiatedName={user?.initiated_name}
              />
              <ExerciseSection activity={activityLog} readOnly={isFuture} />
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