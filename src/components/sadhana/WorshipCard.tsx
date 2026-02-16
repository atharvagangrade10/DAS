"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Moon, Sunrise, Loader2, CheckCircle2, Sun } from "lucide-react";
import { ActivityLogResponse, ActivityLogUpdate } from "@/types/sadhana";
import { format, parseISO, setHours, setMinutes, isValid, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { updateActivityLog, fetchBatchAttendance } from "@/utils/api";

import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import TimeStepper from "./TimeStepper";

interface WorshipCardProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
  userId?: string;
}

const RegulativePrinciples = [
  { key: 'no_meat', label: 'No meat eating' },
  { key: 'no_intoxication', label: 'No intoxication' },
  { key: 'no_illicit_sex', label: 'No illicit sex' },
  { key: 'no_gambling', label: 'No gambling' },
  { key: 'only_prasadam', label: 'Only prasadam' },
] as const;

const TemplePrograms = [
  { key: 'mangla_attended', label: 'Mangala Arti' },
  { key: 'narshima_attended', label: 'Narasimha Arti' },
  { key: 'tulsi_arti_attended', label: 'Tulsi Arti' },
  { key: 'japa_sanga', label: 'Japa Sanga' },
  { key: 'darshan_arti_attended', label: 'Darshan Arti' },
  { key: 'guru_puja_attended', label: 'Guru Puja' },
  { key: 'sandhya_arti_attended', label: 'Sandhya Arti' },
] as const;

const WorshipCard: React.FC<WorshipCardProps> = ({ activity, readOnly, userId }) => {
  const queryClient = useQueryClient();

  // Fetch Sanjeevani Class Attendance
  // Batch ID for Sanjeevani: 695e8a0f91d5274d0da3bf1d
  const { data: sanjeevaniAttendance } = useQuery({
    queryKey: ["batchAttendance", "695e8a0f91d5274d0da3bf1d", activity.today_date],
    queryFn: () => fetchBatchAttendance("695e8a0f91d5274d0da3bf1d", activity.today_date),
    enabled: !!userId,
  });

  const isSanjeevaniAttended = React.useMemo(() => {
    if (!sanjeevaniAttendance || !userId) return false;
    // Check if user is in the list and status is Present
    return sanjeevaniAttendance.some((record: any) =>
      record.participant_id === userId && record.status === "Present"
    );
  }, [sanjeevaniAttendance, userId]);
  const [openPicker, setOpenPicker] = React.useState<'sleep' | 'wakeup' | null>(null);
  const [tempHour, setTempHour] = React.useState(22);
  const [tempMin, setTempMin] = React.useState(0);

  // Local state for all fields to support optimistic updates and debouncing
  const [localActivity, setLocalActivity] = React.useState<ActivityLogResponse>(activity);
  const [isSaving, setIsSaving] = React.useState(false);

  // Sync local activity when prop updates, ONLY if we aren't mid-save or to ensure data consistency
  // However, simpler is to just sync, but we use a ref to prevent loops if we wanted complex merging.
  // For now, simpler: We trust the local state while the user is editing.
  React.useEffect(() => {
    // If we are not saving, we can sync. If we are saving, we might race.
    // Ideally, we only sync if the remote activity ID changed (date change)
    if (activity.id !== localActivity.id) {
      setLocalActivity(activity);
    }
    // We explicitly DON'T sync on every prop change if it's just a refresh of the same data, 
    // to avoid overwriting optimistic updates that haven't round-tripped yet.
    // BUT we must sync if the user changes the DATE in the parent.
    // The parent (Sadhana.tsx) changes 'activity' when date changes.
  }, [activity.id, activity]);

  // NOTE: The above dependency `[activity.id, activity]` will still update if ANY field in activity changes.
  // This might overwrite local state if background refetch happens.
  // To fix this properly: Only update local state if `activity` is "newer" or "different" significantly,
  // OR just rely on the fact that we disabled `refetchOnWindowFocus`, so background updates are rare.
  // Let's refine:
  React.useEffect(() => {
    // If the ID is different, it's a new day/log -> Force sync
    if (activity.id !== localActivity.id) {
      setLocalActivity(activity);
    }
    // If the ID is same, we assume local state is more current due to optimistic updates.
    // We do NOT overwrite local state with incoming `activity` prop to prevent "jumping" switches.
  }, [activity.id]);


  const updateMutation = useMutation({
    mutationFn: (data: ActivityLogUpdate) => updateActivityLog(activity.id, data),
    onMutate: () => setIsSaving(true),
    onSuccess: () => {
      // Silent success - or maybe just clear the saving indicator
      // We INVALIDATE to ensure consistency, but we won't overwrite local state forcefully due to the useEffect above.
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      setIsSaving(false);

      // OPTIONAL: toast.success("Saved");  - Removing toast to reduce noise as requested "frictionless"
    },
    onError: (error: Error) => {
      toast.error("Failed to save: " + error.message);
      setIsSaving(false);
    },
  });

  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const latestActivityRef = React.useRef(localActivity);

  React.useEffect(() => {
    latestActivityRef.current = localActivity;
  }, [localActivity]);

  const triggerDebouncedSave = (updates: Partial<ActivityLogUpdate>) => {
    if (readOnly) return;

    // 1. Update Local State immediately (Optimistic)
    setLocalActivity(prev => ({ ...prev, ...updates }));
    setIsSaving(true); // Show "Saving..." immediately

    // 2. Clr existing
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 3. Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      const current = latestActivityRef.current;


      // Calculate Scores
      // Construct payload with CURRENT fields + explicit updates to be safe
      const payload: ActivityLogUpdate = {
        sleep_at: current.sleep_at,
        wakeup_at: current.wakeup_at,
        no_meat: current.no_meat,
        no_intoxication: current.no_intoxication,
        no_illicit_sex: current.no_illicit_sex,
        no_gambling: current.no_gambling,
        only_prasadam: current.only_prasadam,
        notes_of_day: current.notes_of_day,
        mangla_attended: current.mangla_attended,
        narshima_attended: current.narshima_attended,
        tulsi_arti_attended: current.tulsi_arti_attended,
        darshan_arti_attended: current.darshan_arti_attended,
        guru_puja_attended: current.guru_puja_attended,
        sandhya_arti_attended: current.sandhya_arti_attended,
        japa_sanga: current.japa_sanga, // Manual Switch
        ...updates // ensures specific field override
      };

      updateMutation.mutate(payload);
    }, 1000);
  };


  const handleOpenPicker = (type: 'sleep' | 'wakeup') => {
    if (readOnly) return;
    const timeStr = type === 'sleep' ? localActivity.sleep_at : localActivity.wakeup_at;
    const time = parseISO(timeStr);

    if (isValid(time)) {
      setTempHour(time.getHours());
      setTempMin(time.getMinutes());
    } else {
      setTempHour(type === 'sleep' ? 22 : 4);
      setTempMin(0);
    }
    setOpenPicker(type);
  };

  const handleSaveTime = () => {
    if (!openPicker) return;

    const today = parseISO(localActivity.today_date);
    let baseDate = today;

    if (openPicker === 'sleep') {
      if (tempHour >= 12) {
        baseDate = subDays(today, 1);
      }
    }

    const updatedDate = setMinutes(setHours(baseDate, tempHour), tempMin);
    const dateString = format(updatedDate, "yyyy-MM-dd'T'HH:mm:ss");

    // Immediate update for explicit "Save" button in dialog
    const updates = { [openPicker === 'sleep' ? 'sleep_at' : 'wakeup_at']: dateString };

    setLocalActivity(prev => ({ ...prev, ...updates }));

    // Calculate Scores for immediate save
    const tempLogForScore = {
      ...localActivity,
      ...updates,
      japa_sanga: localActivity.japa_sanga
    };
    // Bypass debounce for this explicit action
    // We must construct the payload explicitly to avoid sending read-only fields like 'id'
    const payload: ActivityLogUpdate = {
      sleep_at: localActivity.sleep_at,
      wakeup_at: localActivity.wakeup_at,
      no_meat: localActivity.no_meat,
      no_intoxication: localActivity.no_intoxication,
      no_illicit_sex: localActivity.no_illicit_sex,
      no_gambling: localActivity.no_gambling,
      only_prasadam: localActivity.only_prasadam,
      notes_of_day: localActivity.notes_of_day,
      mangla_attended: localActivity.mangla_attended,
      narshima_attended: localActivity.narshima_attended,
      tulsi_arti_attended: localActivity.tulsi_arti_attended,
      darshan_arti_attended: localActivity.darshan_arti_attended,
      guru_puja_attended: localActivity.guru_puja_attended,
      sandhya_arti_attended: localActivity.sandhya_arti_attended,
      japa_sanga: localActivity.japa_sanga,
      ...updates // Override with new time
    };

    updateMutation.mutate(payload);

    setOpenPicker(null);
  };

  const formatDisplayTime = (isoString: string) => {
    const date = parseISO(isoString);
    return isValid(date) ? format(date, 'hh:mm a') : "--:--";
  };

  return (
    <div className="space-y-6">
      {/* Header with Saving Indicator */}
      <div className="flex justify-end h-4 pr-2">
        {isSaving && (
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/60 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors bg-primary/5 border-primary/10 shadow-none"
          onClick={() => handleOpenPicker('sleep')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground/60">
              <Moon className="h-3 w-3" /> Last Day Slept at
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">
              {formatDisplayTime(localActivity.sleep_at)}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors bg-primary/5 border-primary/10 shadow-none"
          onClick={() => handleOpenPicker('wakeup')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground/60">
              <Sunrise className="h-3 w-3" /> Woke Up At
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">
              {formatDisplayTime(localActivity.wakeup_at)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sun className="h-5 w-5 text-blue-600" />
            Arti
          </CardTitle>
          <CardDescription>Daily arti attendance.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-0 p-0">
          {TemplePrograms.map(({ key, label }, idx) => (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between px-6 py-4 transition-colors",
                idx % 2 === 0 ? "bg-muted/30" : "bg-white"
              )}
            >
              <Label htmlFor={key} className="text-base font-bold text-primary/80">
                {label}
              </Label>
              <Switch
                id={key}
                checked={localActivity[key as keyof ActivityLogResponse] as boolean}
                onCheckedChange={(checked) => triggerDebouncedSave({ [key]: checked })}
                disabled={readOnly}
                className="scale-110"
              />
            </div>
          ))}

          {/* Sanjeevani Class Display - Read Only from Attendance Records */}
          <div
            className={cn(
              "flex items-center justify-between px-6 py-4 transition-colors",
              TemplePrograms.length % 2 === 0 ? "bg-muted/30" : "bg-white"
            )}
          >
            <Label className="text-base font-bold text-primary/80">
              Sanjeevani Class
            </Label>
            <Switch
              checked={isSanjeevaniAttended}
              disabled={true}
              className="scale-110"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Regulative Principles
          </CardTitle>
          <CardDescription>Daily vows of a spiritual practitioner.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-0 p-0">
          {RegulativePrinciples.map(({ key, label }, idx) => (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between px-6 py-4 transition-colors",
                idx % 2 === 0 ? "bg-muted/30" : "bg-white"
              )}
            >
              <Label htmlFor={key} className="text-base font-bold text-primary/80">
                {label}
              </Label>
              <Switch
                id={key}
                checked={localActivity[key as keyof ActivityLogResponse] as boolean}
                onCheckedChange={(checked) => triggerDebouncedSave({ [key]: checked })}
                disabled={readOnly}
                className="scale-110"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!openPicker} onOpenChange={() => setOpenPicker(null)}>
        <DialogContent className="sm:max-w-[400px] p-6 rounded-[28px]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-xl font-black">
              Set {openPicker === 'sleep' ? 'Sleeping' : 'Wakeup'} Time
            </DialogTitle>
            <DialogDescription className="text-center">Select your actual time below.</DialogDescription>
          </DialogHeader>

          <TimeStepper hour={tempHour} minute={tempMin} onChange={(h, m) => { setTempHour(h); setTempMin(m); }} />

          <DialogFooter className="mt-8">
            <Button onClick={handleSaveTime} disabled={updateMutation.isPending} className="w-full h-12 rounded-xl font-bold text-lg">
              {updateMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorshipCard;