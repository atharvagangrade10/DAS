"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Moon, Sunrise, Loader2 } from "lucide-react";
import { ActivityLogResponse, ActivityLogUpdate } from "@/types/sadhana";
import { format, parseISO, setHours, setMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateActivityLog } from "@/utils/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ScrollPicker from "./ScrollPicker";

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
  const [tempHour, setTempHour] = React.useState(22);
  const [tempMin, setTempMin] = React.useState(0);

  const updateMutation = useMutation({
    mutationFn: (data: ActivityLogUpdate) => updateActivityLog(activity.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      setOpenPicker(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleOpenPicker = (type: 'sleep' | 'wakeup') => {
    if (readOnly) return;
    const time = parseISO(type === 'sleep' ? activity.sleep_at : activity.wakeup_at);
    setTempHour(time.getHours());
    setTempMin(time.getMinutes());
    setOpenPicker(type);
  };

  const handleSaveTime = () => {
    if (!openPicker) return;
    let newDate = setMinutes(setHours(parseISO(activity.today_date), tempHour), tempMin);
    updateMutation.mutate({ [openPicker === 'sleep' ? 'sleep_at' : 'wakeup_at']: newDate.toISOString() });
  };

  const renderTile = (label: string, timeStr: string, icon: React.ElementType, type: 'sleep' | 'wakeup') => (
    <Card 
      className="border-none shadow-lg bg-white active:scale-95 transition-all cursor-pointer ring-1 ring-primary/5"
      onClick={() => handleOpenPicker(type)}
    >
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
        <div className="h-16 w-16 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl">
            {React.createElement(icon, { className: "h-8 w-8" })}
        </div>
        <div className="space-y-1">
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{label}</p>
            <p className="text-xl font-black text-primary">{format(parseISO(timeStr), 'hh:mm a')}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-base font-black uppercase tracking-widest text-primary/60 px-2">Sleep Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          {renderTile("Slept At", activity.sleep_at, Moon, 'sleep')}
          {renderTile("Woke Up At", activity.wakeup_at, Sunrise, 'wakeup')}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-base font-black uppercase tracking-widest text-primary/60 px-2">Daily Vows</h3>
        <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
          <CardContent className="p-2">
            <div className="divide-y divide-primary/5">
                {RegulativePrinciples.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                    <span className="text-sm font-bold text-primary/80 tracking-tight">{label}</span>
                    <Switch 
                    checked={activity[key as keyof ActivityLogResponse] as boolean}
                    onCheckedChange={(checked) => !readOnly && updateMutation.mutate({ [key]: checked })}
                    disabled={readOnly || updateMutation.isPending}
                    className="data-[state=checked]:bg-green-500 scale-125"
                    />
                </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog open={!!openPicker} onOpenChange={() => setOpenPicker(null)}>
        <DialogContent className="sm:max-w-[400px] p-8 rounded-[40px] border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-center text-2xl font-black tracking-tight">
                {openPicker === 'sleep' ? 'Sleeping Time' : 'Wakeup Time'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-12">
            <ScrollPicker label="Hour (24h Format)" min={0} max={23} value={tempHour} onChange={setTempHour} />
            <ScrollPicker label="Minutes" min={0} max={55} step={5} value={tempMin} onChange={setTempMin} />
          </div>
          <DialogFooter className="mt-10 flex-row gap-3">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl text-lg font-bold" onClick={() => setOpenPicker(null)}>Cancel</Button>
            <Button className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleSaveTime} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Update Time"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorshipCard;