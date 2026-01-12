"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Moon, Sunrise, Clock, Loader2 } from "lucide-react";
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
    onError: (error: Error) => {
      toast.error("Update failed", { description: error.message });
    },
  });

  const handleOpenPicker = (type: 'sleep' | 'wakeup') => {
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
      className="border-none shadow-sm bg-muted/30 cursor-pointer active:scale-95 transition-transform"
      onClick={() => !readOnly && handleOpenPicker(type)}
    >
      <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            {React.createElement(icon, { className: "h-6 w-6" })}
        </div>
        <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-lg font-black text-primary">{format(parseISO(timeStr), 'hh:mm a')}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 px-1">Sleep</h3>
        <div className="grid grid-cols-2 gap-3">
          {renderTile("Slept at", activity.sleep_at, Moon, 'sleep')}
          {renderTile("Woke up at", activity.wakeup_at, Sunrise, 'wakeup')}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Regulations</h3>
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">?</div>
        </div>
        <Card className="border-none shadow-sm bg-muted/20">
          <CardContent className="p-0 divide-y">
            {RegulativePrinciples.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between p-4 px-5">
                <span className="text-sm font-bold text-primary/80">{label}</span>
                <Switch 
                  checked={activity[key as keyof ActivityLogResponse] as boolean}
                  onCheckedChange={(checked) => !readOnly && updateMutation.mutate({ [key]: checked })}
                  disabled={readOnly || updateMutation.isPending}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Time Picker Dialog (matching screenshot style) */}
      <Dialog open={!!openPicker} onOpenChange={() => setOpenPicker(null)}>
        <DialogContent className="sm:max-w-[400px] p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black">
                {openPicker === 'sleep' ? 'Sleeping Time' : 'Wakeup Time'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-8">
            <ScrollPicker label="Hour" min={0} max={23} value={tempHour} onChange={setTempHour} />
            <ScrollPicker label="Minutes" min={0} max={55} step={5} value={tempMin} onChange={setTempMin} />
          </div>
          <DialogFooter className="flex-row gap-3 sm:justify-center">
            <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setOpenPicker(null)}>Cancel</Button>
            <Button className="flex-1 rounded-2xl h-12 font-bold" onClick={handleSaveTime} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorshipCard;