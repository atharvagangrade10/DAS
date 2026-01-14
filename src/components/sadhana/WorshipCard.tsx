"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Moon, Sunrise, Loader2, CheckCircle2, Sun } from "lucide-react";
import { ActivityLogResponse, ActivityLogUpdate } from "@/types/sadhana";
import { format, parseISO, setHours, setMinutes, isValid, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateActivityLog } from "@/utils/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import TimeStepper from "./TimeStepper";

interface WorshipCardProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
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
  { key: 'darshan_arti_attended', label: 'Darshan Arti' },
  { key: 'guru_puja_attended', label: 'Guru Puja' },
  { key: 'sandhya_arti_attended', label: 'Sandhya Arti' },
] as const;

const WorshipCard: React.FC<WorshipCardProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [openPicker, setOpenPicker] = React.useState<'sleep' | 'wakeup' | null>(null);
  const [tempHour, setTempHour] = React.useState(22);
  const [tempMin, setTempMin] = React.useState(0);

  const updateMutation = useMutation({
    mutationFn: (data: ActivityLogUpdate) => updateActivityLog(activity.id, {
        // Spread existing activity to satisfy strict backend models
        sleep_at: activity.sleep_at,
        wakeup_at: activity.wakeup_at,
        no_meat: activity.no_meat,
        no_intoxication: activity.no_intoxication,
        no_illicit_sex: activity.no_illicit_sex,
        no_gambling: activity.no_gambling,
        only_prasadam: activity.only_prasadam,
        notes_of_day: activity.notes_of_day,
        mangla_attended: activity.mangla_attended,
        narshima_attended: activity.narshima_attended,
        tulsi_arti_attended: activity.tulsi_arti_attended,
        darshan_arti_attended: activity.darshan_arti_attended,
        guru_puja_attended: activity.guru_puja_attended,
        sandhya_arti_attended: activity.sandhya_arti_attended,
        ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      setOpenPicker(null);
      toast.success("Updated successfully.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleOpenPicker = (type: 'sleep' | 'wakeup') => {
    if (readOnly) return;
    const timeStr = type === 'sleep' ? activity.sleep_at : activity.wakeup_at;
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
    
    const today = parseISO(activity.today_date);
    let baseDate = today;

    if (openPicker === 'sleep') {
        if (tempHour >= 12) {
            baseDate = subDays(today, 1);
        }
    }

    const updatedDate = setMinutes(setHours(baseDate, tempHour), tempMin);
    const dateString = format(updatedDate, "yyyy-MM-dd'T'HH:mm:ss");
    
    updateMutation.mutate({ 
        [openPicker === 'sleep' ? 'sleep_at' : 'wakeup_at']: dateString 
    });
  };

  const formatDisplayTime = (isoString: string) => {
    const date = parseISO(isoString);
    return isValid(date) ? format(date, 'hh:mm a') : "--:--";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card 
            className="cursor-pointer hover:border-primary/50 transition-colors bg-primary/5 border-primary/10 shadow-none" 
            onClick={() => handleOpenPicker('sleep')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground/60">
              <Moon className="h-3 w-3" /> Slept At
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">
                {formatDisplayTime(activity.sleep_at)}
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
                {formatDisplayTime(activity.wakeup_at)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Church className="h-5 w-5 text-blue-600" />
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
                checked={activity[key as keyof ActivityLogResponse] as boolean}
                onCheckedChange={(checked) => !readOnly && updateMutation.mutate({ [key]: checked })}
                disabled={readOnly || updateMutation.isPending}
                className="scale-110"
              />
            </div>
          ))}
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
                checked={activity[key as keyof ActivityLogResponse] as boolean}
                onCheckedChange={(checked) => !readOnly && updateMutation.mutate({ [key]: checked })}
                disabled={readOnly || updateMutation.isPending}
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