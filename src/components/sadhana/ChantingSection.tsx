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


interface ChantingSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const CHANTING_SLOT_CONFIG: { value: ChantingSlot, label: string }[] = [
  { value: "before_7_30_am", label: "Before 7:30 AM" },
  { value: "7_30_to_8_30_am", label: "7:30 - 8:30 AM" },
  { value: "8_30_to_10_am", label: "8:30 - 10:00 AM" },
  { value: "before_9_30_pm", label: "Before 9:30 PM" },
  { value: "after_9_30_pm", label: "Late Night" },
];

const ChantingSection: React.FC<ChantingSectionProps> = ({ activity, readOnly }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = React.useState<ChantingSlot | null>(null);
  const [tempRounds, setTempRounds] = React.useState("16");
  const [tempRating, setTempRating] = React.useState("8");

  const targetRounds = user?.chanting_rounds || 16;


  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["activityLog"] });
    setSelectedSlot(null);
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

  const handleOpenDialog = (slot: ChantingSlot) => {
    if (readOnly) return;
    const log = activity.chanting_logs.find(l => l.slot === slot);
    setTempRounds((log?.rounds || 16).toString());
    setTempRating((log?.rating || 8).toString());
    setSelectedSlot(slot);
  };

  const handleSave = () => {
    if (!selectedSlot) return;
    const log = activity.chanting_logs.find(l => l.slot === selectedSlot);
    const data = { rounds: parseInt(tempRounds), rating: parseInt(tempRating) };
    if (log) {
      updateMutation.mutate({ slot: selectedSlot, data });
    } else {
      addMutation.mutate({ slot: selectedSlot, ...data });
    }
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
          <div className="text-right">
            <span className="text-2xl font-black text-primary">{totalRounds}</span>
            <span className="text-sm font-bold text-muted-foreground ml-1">/ {targetRounds}</span>
          </div>
        </div>

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

      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Chanting</DialogTitle>
            <DialogDescription>Enter rounds and quality for the selected slot.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
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
              <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(selectedSlot!)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handleSave} className="flex-1" disabled={addMutation.isPending || updateMutation.isPending}>
              Save Chanting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ChantingSection;