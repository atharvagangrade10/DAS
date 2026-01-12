"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Moon, Sunrise, Check, X, Utensils, Droplet, Heart, Zap } from "lucide-react";
import { ActivityLogResponse, ActivityLogUpdate } from "@/types/sadhana";
import { format, parseISO, setHours, setMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateActivityLog } from "@/utils/api";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface WorshipCardProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const RegulativePrinciples = [
  { key: 'no_meat', label: 'No Meat', icon: Utensils },
  { key: 'no_intoxication', label: 'No Intox', icon: Droplet },
  { key: 'no_illicit_sex', label: 'No Illicit Sex', icon: Heart },
  { key: 'no_gambling', label: 'No Gambling', icon: Zap },
  { key: 'only_prasadam', label: 'Only Prasadam', icon: Check },
] as const;

const WorshipCard: React.FC<WorshipCardProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [tempSleepTime, setTempSleepTime] = React.useState(format(parseISO(activity.sleep_at), 'HH:mm'));
  const [tempWakeupTime, setTempWakeupTime] = React.useState(format(parseISO(activity.wakeup_at), 'HH:mm'));

  React.useEffect(() => {
    setTempSleepTime(format(parseISO(activity.sleep_at), 'HH:mm'));
    setTempWakeupTime(format(parseISO(activity.wakeup_at), 'HH:mm'));
  }, [activity.sleep_at, activity.wakeup_at]);

  const updateMutation = useMutation({
    mutationFn: (data: ActivityLogUpdate) => updateActivityLog(activity.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog", activity.today_date] });
      toast.success("Schedule updated.");
    },
    onError: (error: Error) => {
      toast.error("Update failed", { description: error.message });
    },
  });

  const handleTimeUpdate = (field: 'sleep_at' | 'wakeup_at', timeString: string) => {
    if (readOnly || updateMutation.isPending) return;

    const [hours, minutes] = timeString.split(':').map(Number);
    let newDateTime = setMinutes(setHours(parseISO(activity.today_date), hours), minutes);
    
    const payload: ActivityLogUpdate = {
        [field]: newDateTime.toISOString(),
    };
    updateMutation.mutate(payload);
  };

  const handleRegulativeToggle = (key: keyof ActivityLogUpdate) => {
    if (readOnly || updateMutation.isPending) return;
    const currentValue = activity[key as keyof ActivityLogResponse];
    updateMutation.mutate({ [key]: !currentValue });
  };

  const renderTimeInput = (field: 'sleep_at' | 'wakeup_at', timeValue: string, tempValue: string, setTempValue: (v: string) => void, icon: React.ElementType) => {
    const time = format(parseISO(timeValue), 'hh:mm a');
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex flex-col h-24 w-full p-4 border-primary/20 shadow-sm">
            <div className="flex items-center gap-2 text-primary/70 mb-1">
              {React.createElement(icon, { className: "h-5 w-5" })}
              <span className="text-[10px] font-bold uppercase tracking-widest">{field === 'sleep_at' ? 'Sleep' : 'Wakeup'}</span>
            </div>
            <span className="text-2xl font-black text-primary">{time}</span>
          </Button>
        </PopoverTrigger>
        {!readOnly && (
          <PopoverContent className="w-auto p-4" align="center">
            <div className="space-y-4">
              <p className="text-sm font-bold text-center">Set {field === 'sleep_at' ? 'Sleep' : 'Wakeup'} Time</p>
              <Input
                type="time"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="text-lg h-12"
              />
              <Button 
                className="w-full" 
                onClick={() => handleTimeUpdate(field, tempValue)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Save Time"}
              </Button>
            </div>
          </PopoverContent>
        )}
      </Popover>
    );
  };

  return (
    <Card className="shadow-sm border-primary/10 overflow-hidden">
      <CardHeader className="pb-3 bg-primary/5">
        <CardTitle className="text-xl font-semibold flex items-center gap-2 text-primary">
          <Clock className="h-6 w-6" />
          Schedule & Vows
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {renderTimeInput('sleep_at', activity.sleep_at, tempSleepTime, setTempSleepTime, Moon)}
          {renderTimeInput('wakeup_at', activity.wakeup_at, tempWakeupTime, setTempWakeupTime, Sunrise)}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Regulative Principles</h3>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">DAILY VOWS</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {RegulativePrinciples.map(({ key, icon: Icon }) => {
              const isFollowed = activity[key as keyof ActivityLogResponse] as boolean;
              return (
                <Button
                  key={key}
                  variant="outline"
                  className={cn(
                    "flex flex-col h-20 p-2 transition-all rounded-xl",
                    isFollowed
                      ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20"
                      : "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20",
                    readOnly && "opacity-70 cursor-default"
                  )}
                  onClick={() => handleRegulativeToggle(key as keyof ActivityLogUpdate)}
                  disabled={readOnly || updateMutation.isPending}
                >
                  <Icon className="h-6 w-6 mb-1" />
                  <div className="mt-auto">
                    {isFollowed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </div>
                </Button>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-medium px-1">
             {RegulativePrinciples.map(p => <span key={p.key} className="text-center flex-1">{p.label}</span>)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorshipCard;