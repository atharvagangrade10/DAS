"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Moon, Sunrise, Check, X, Utensils, Droplet, Heart, Zap } from "lucide-react";
import { ActivityLogResponse, ActivityLogUpdate } from "@/types/sadhana";
import { format, parseISO, setHours, setMinutes, isSameDay } from "date-fns";
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
  { key: 'no_intoxication', label: 'No Intoxication', icon: Droplet },
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
      toast.success("Activity updated.");
    },
    onError: (error: Error) => {
      toast.error("Update failed", { description: error.message });
    },
  });

  const handleTimeUpdate = (field: 'sleep_at' | 'wakeup_at', timeString: string) => {
    if (readOnly || updateMutation.isPending) return;

    const [hours, minutes] = timeString.split(':').map(Number);
    let newDateTime = setMinutes(setHours(parseISO(activity.today_date), hours), minutes);

    // Handle sleep_at potentially being on the previous day
    if (field === 'sleep_at' && hours >= 12 && hours <= 23) {
        // If sleep time is in the evening (12:00 PM to 11:59 PM), it belongs to the previous day relative to the log date.
        // We assume the backend handles this time shift correctly based on the log date.
        // For frontend display and update, we just ensure the time component is correct.
    }
    
    const payload: ActivityLogUpdate = {
        [field]: newDateTime.toISOString(),
    };
    updateMutation.mutate(payload);
  };

  const handleRegulativeToggle = (key: keyof ActivityLogUpdate) => {
    if (readOnly || updateMutation.isPending) return;
    const currentValue = activity[key as keyof ActivityLogResponse];
    const payload: ActivityLogUpdate = {
        [key]: !currentValue,
    };
    updateMutation.mutate(payload);
  };

  const renderTimeInput = (field: 'sleep_at' | 'wakeup_at', timeValue: string, tempValue: string, setTempValue: (v: string) => void, icon: React.ElementType) => {
    const time = format(parseISO(timeValue), 'hh:mm a');
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex flex-col h-20 w-full p-2">
            <div className="flex items-center gap-2 text-primary">
              {React.createElement(icon, { className: "h-5 w-5" })}
              <span className="text-xs font-medium">{field === 'sleep_at' ? 'Sleep At' : 'Wakeup At'}</span>
            </div>
            <span className="text-xl font-bold mt-1">{time}</span>
          </Button>
        </PopoverTrigger>
        {!readOnly && (
          <PopoverContent className="w-auto p-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Set Time (24h format)</p>
              <Input
                type="time"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
              />
              <Button 
                size="sm" 
                className="w-full" 
                onClick={() => handleTimeUpdate(field, tempValue)}
                disabled={updateMutation.isPending}
              >
                Save
              </Button>
            </div>
          </PopoverContent>
        )}
      </Popover>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Daily Schedule & Principles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sleep/Wake Times */}
        <div className="grid grid-cols-2 gap-4">
          {renderTimeInput('sleep_at', activity.sleep_at, tempSleepTime, setTempSleepTime, Moon)}
          {renderTimeInput('wakeup_at', activity.wakeup_at, tempWakeupTime, setTempWakeupTime, Sunrise)}
        </div>

        {/* Regulative Principles */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Regulative Principles</h3>
          <div className="grid grid-cols-3 gap-3">
            {RegulativePrinciples.map(({ key, label, icon: Icon }) => {
              const isFollowed = activity[key as keyof ActivityLogResponse] as boolean;
              return (
                <Button
                  key={key}
                  variant="outline"
                  className={cn(
                    "flex flex-col h-24 p-2 transition-colors",
                    isFollowed
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-red-500 bg-red-50 dark:bg-red-950/20",
                    readOnly && "opacity-70 cursor-default"
                  )}
                  onClick={() => handleRegulativeToggle(key as keyof ActivityLogUpdate)}
                  disabled={readOnly || updateMutation.isPending}
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full mb-1">
                    <Icon className={cn("h-5 w-5", isFollowed ? "text-green-600" : "text-red-600")} />
                  </div>
                  <span className="text-xs font-medium text-center">{label}</span>
                  <div className="mt-1">
                    {isFollowed ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorshipCard;