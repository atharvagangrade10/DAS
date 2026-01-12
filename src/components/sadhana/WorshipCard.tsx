"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Moon, Sunrise, Loader2, CheckCircle2 } from "lucide-react";
import { ActivityLogResponse, ActivityLogUpdate } from "@/types/sadhana";
import { format, parseISO, setHours, setMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateActivityLog } from "@/utils/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const WorshipCard: React.FC<WorshipCardProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [openPicker, setOpenPicker] = React.useState<'sleep' | 'wakeup' | null>(null);
  const [tempHour, setTempHour] = React.useState("22");
  const [tempMin, setTempMin] = React.useState("00");

  const updateMutation = useMutation({
    mutationFn: (data: ActivityLogUpdate) => updateActivityLog(activity.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      setOpenPicker(null);
      toast.success("Updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleOpenPicker = (type: 'sleep' | 'wakeup') => {
    if (readOnly) return;
    const time = parseISO(type === 'sleep' ? activity.sleep_at : activity.wakeup_at);
    setTempHour(time.getHours().toString());
    setTempMin(time.getMinutes().toString().padStart(2, '0'));
    setOpenPicker(type);
  };

  const handleSaveTime = () => {
    if (!openPicker) return;
    let newDate = setMinutes(setHours(parseISO(activity.today_date), parseInt(tempHour)), parseInt(tempMin));
    updateMutation.mutate({ [openPicker === 'sleep' ? 'sleep_at' : 'wakeup_at']: newDate.toISOString() });
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString());
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleOpenPicker('sleep')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Moon className="h-4 w-4" /> Slept At
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(parseISO(activity.sleep_at), 'hh:mm a')}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleOpenPicker('wakeup')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Sunrise className="h-4 w-4" /> Woke Up At
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(parseISO(activity.wakeup_at), 'hh:mm a')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Daily Vows
          </CardTitle>
          <CardDescription>Track your adherence to regulative principles.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {RegulativePrinciples.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between space-x-2 border-b pb-3 last:border-0 last:pb-0">
              <Label htmlFor={key} className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
              </Label>
              <Switch 
                id={key}
                checked={activity[key as keyof ActivityLogResponse] as boolean}
                onCheckedChange={(checked) => !readOnly && updateMutation.mutate({ [key]: checked })}
                disabled={readOnly || updateMutation.isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!openPicker} onOpenChange={() => setOpenPicker(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set {openPicker === 'sleep' ? 'Sleeping' : 'Wakeup'} Time</DialogTitle>
            <DialogDescription>Select the hour and minute for this activity.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Hour (24h)</Label>
              <Select value={tempHour} onValueChange={setTempHour}>
                <SelectTrigger>
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map(h => <SelectItem key={h} value={h}>{h.padStart(2, '0')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Minute</Label>
              <Select value={tempMin} onValueChange={setTempMin}>
                <SelectTrigger>
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveTime} disabled={updateMutation.isPending} className="w-full sm:w-auto">
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorshipCard;