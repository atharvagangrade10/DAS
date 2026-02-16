"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ActivityLogResponse, ChantingLogCreate, ChantingLogUpdate, ChantingSlot } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addChantingLog, updateChantingLog, deleteChantingLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Trash2, Plus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import TimeStepper from "./TimeStepper";
import { parse, getHours, getMinutes, setHours, setMinutes, format, isValid } from "date-fns";




interface ChantingSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
  targetFinishedTime?: string;
  onTargetFinishedTimeChange?: (time: string) => void;
}

const CHANTING_SLOT_CONFIG: { value: ChantingSlot, label: string }[] = [
  { value: "before_7_30_am", label: "Early Morning (Before 7:30)" },
  { value: "7_30_to_12_00_pm", label: "Morning (7:30 - 12:00)" },
  { value: "12_00_to_6_00_pm", label: "Afternoon (12:00 - 6:00)" },
  { value: "6_00_to_12_00_am", label: "Evening (6:00 - 12:00)" },
  { value: "after_12_00_am", label: "Late Night (After 12:00)" },
];

const ChantingSection: React.FC<ChantingSectionProps> = ({
  activity,
  readOnly,
  targetFinishedTime,
  onTargetFinishedTimeChange
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Determine slot based on current time
  const getCurrentTimeSlot = (): ChantingSlot => {
    const now = new Date();
    const hour = getHours(now);
    const minute = getMinutes(now);

    // after_12_00_am: 00:00 to 04:00
    if (hour >= 0 && hour < 4) return "after_12_00_am";

    // before_7_30_am: 04:00 to 07:30
    if (hour < 7 || (hour === 7 && minute < 30)) return "before_7_30_am";

    // 7_30_to_12_00_pm: 07:30 to 12:00
    if (hour < 12) return "7_30_to_12_00_pm";

    // 12_00_to_6_00_pm: 12:00 to 18:00
    if (hour < 18) return "12_00_to_6_00_pm";

    // 6_00_to_12_00_am: 18:00 to 24:00
    return "6_00_to_12_00_am";
  };

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  // Default to current time slot
  const [selectedSlot, setSelectedSlot] = React.useState<ChantingSlot>(getCurrentTimeSlot());

  const [tempRounds, setTempRounds] = React.useState("16");
  const [tempRating, setTempRating] = React.useState("8");

  // Time Picker State
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [tempHour, setTempHour] = React.useState(8);
  const [tempMinute, setTempMinute] = React.useState(30);

  const targetRounds = user?.chanting_rounds || 16;


  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["activityLog"] });
    setIsDialogOpen(false);
  };

  const addMutation = useMutation({
    mutationFn: (data: ChantingLogCreate) => addChantingLog(activity.id, data),
    onSuccess: () => { toast.success("Recorded."); invalidateQueries(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ slot, data }: { slot: string, data: ChantingLogUpdate }) => updateChantingLog(activity.id, slot, data),
    onSuccess: () => { toast.success("Updated."); invalidateQueries(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (slot: string) => deleteChantingLog(activity.id, slot),
    onSuccess: () => { toast.success("Deleted."); invalidateQueries(); },
  });

  const updateFormForSlot = (slot: ChantingSlot) => {
    const log = activity.chanting_logs.find(l => l.slot === slot);
    if (log) {
      setTempRounds(log.rounds.toString());
      setTempRating(log.rating.toString());
    } else {
      // Defaults for new entry
      setTempRounds("16");
      setTempRating("8");
    }
  };

  const handleOpenDialog = (slot?: ChantingSlot) => {
    if (readOnly) return;

    const targetSlot = slot || getCurrentTimeSlot();
    setSelectedSlot(targetSlot);
    updateFormForSlot(targetSlot);
    setIsDialogOpen(true);
  };

  const handleSlotChange = (value: string) => {
    const newSlot = value as ChantingSlot;
    setSelectedSlot(newSlot);
    updateFormForSlot(newSlot);
  };


  // ... inside handleSave ...
  const handleSave = () => {
    if (!selectedSlot) return;

    const rounds = parseInt(tempRounds);

    const log = activity.chanting_logs.find(l => l.slot === selectedSlot);
    const data = { rounds, rating: parseInt(tempRating) };

    if (log) {
      updateMutation.mutate({ slot: selectedSlot, data });
    } else {
      addMutation.mutate({ slot: selectedSlot, ...data });
    }
  };

  const handleOpenTimePicker = () => {
    if (targetFinishedTime) {
      const date = parse(targetFinishedTime, "h:mm a", new Date());
      if (isValid(date)) {
        setTempHour(getHours(date));
        setTempMinute(getMinutes(date));
      }
    }
    setShowTimePicker(true);
  };

  const handleSaveTime = () => {
    if (onTargetFinishedTimeChange) {
      const date = setMinutes(setHours(new Date(), tempHour), tempMinute);
      onTargetFinishedTimeChange(format(date, "h:mm a"));
    }
    setShowTimePicker(false);
  };

  const totalRounds = activity.chanting_logs.reduce((sum, log) => sum + log.rounds, 0);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between w-full">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Chanting
            </CardTitle>
            <CardDescription>Track your daily rounds.</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-2xl font-black text-primary">{totalRounds}</span>
              <span className="text-sm font-bold text-muted-foreground ml-1">/ {targetRounds}</span>
            </div>
            {!readOnly && (
              <Button onClick={() => handleOpenDialog()} size="sm" className="hidden sm:flex rounded-full font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Record
              </Button>
            )}
          </div>
        </div>

        {!readOnly && (
          <Button onClick={() => handleOpenDialog()} variant="outline" className="w-full sm:hidden rounded-full border-dashed border-2 font-bold text-primary">
            <Plus className="h-4 w-4 mr-2" />
            Record Chanting
          </Button>
        )}

        {!readOnly && onTargetFinishedTimeChange && (
          <div className="flex items-center gap-2 mt-2 bg-muted/30 p-3 rounded-lg border border-dashed justify-between">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
              Finished By:
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenTimePicker}
              className="font-bold min-w-[100px]"
            >
              {targetFinishedTime || "Select Time"}
            </Button>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span>Daily Progress</span>
            <span>{Math.round((totalRounds / targetRounds) * 100)}%</span>
          </div>
          <Progress value={(totalRounds / targetRounds) * 100} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="grid gap-3">
        {CHANTING_SLOT_CONFIG.map(({ value, label }) => {
          const log = activity.chanting_logs.find(l => l.slot === value);
          const isFilled = !!log;

          return (
            <div
              key={value}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer",
                isFilled ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-dashed"
              )}
              onClick={() => handleOpenDialog(value)}
            >
              <div className="flex flex-col">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-tight">{label}</span>
                <span className="text-lg font-black">
                  {isFilled ? `${log.rounds} Rounds` : "Not Recorded"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {isFilled && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    ⭐ {log.rating}/10
                  </Badge>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className={cn("h-5 w-5", isFilled ? "text-primary" : "text-muted-foreground")} />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Chanting</DialogTitle>
            <DialogDescription>Enter rounds and quality for the selected slot.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Select value={selectedSlot} onValueChange={handleSlotChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANTING_SLOT_CONFIG.map(slot => {
                    const isCompleted = activity.chanting_logs.some(l => l.slot === slot.value);
                    return (
                      <SelectItem key={slot.value} value={slot.value}>
                        <span>{slot.label}</span>
                        {isCompleted && <span className="ml-2 text-xs text-green-600 font-bold">( Recorded )</span>}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rounds Chanted</Label>
              <Select value={tempRounds} onValueChange={setTempRounds}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 65 }, (_, i) => i.toString()).map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quality Rating (1-10)</Label>
              <Select value={tempRating} onValueChange={setTempRating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => (i + 1).toString()).map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2">
            {activity.chanting_logs.some(l => l.slot === selectedSlot) && (
              <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(selectedSlot)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handleSave} className="flex-1" disabled={addMutation.isPending || updateMutation.isPending}>
              Save Chanting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTimePicker} onOpenChange={setShowTimePicker}>
        <DialogContent className="sm:max-w-[400px] p-6 rounded-[28px]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-xl font-black">
              Target Finish Time
            </DialogTitle>
            <DialogDescription className="text-center">When did you finish your rounds?</DialogDescription>
          </DialogHeader>

          <TimeStepper hour={tempHour} minute={tempMinute} onChange={(h, m) => { setTempHour(h); setTempMinute(m); }} />

          <DialogFooter className="mt-8">
            <Button onClick={handleSaveTime} className="w-full h-12 rounded-xl font-bold text-lg">
              Set Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ChantingSection;