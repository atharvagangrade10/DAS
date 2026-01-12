"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityLogResponse, ChantingLogCreate, ChantingLogUpdate, ChantingSlot } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addChantingLog, updateChantingLog, deleteChantingLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ScrollPicker from "./ScrollPicker";

interface ChantingSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const CHANTING_SLOT_CONFIG: { value: ChantingSlot, label: string }[] = [
  { value: "before_6_30_am", label: "Before 6:30 am" },
  { value: "6_30_to_8_30_am", label: "Before 8:30 am" },
  { value: "8_30_to_10_am", label: "Before 10 am" },
  { value: "before_9_30_pm", label: "Evening" },
  { value: "after_9_30_pm", label: "Night" },
];

const ChantingSection: React.FC<ChantingSectionProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = React.useState<ChantingSlot | null>(null);
  const [tempRounds, setTempRounds] = React.useState(16);
  const [tempRating, setTempRating] = React.useState(8);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["activityLog"] });
    setSelectedSlot(null);
  };

  const addMutation = useMutation({
    mutationFn: (data: ChantingLogCreate) => addChantingLog(activity.id, data),
    onSuccess: () => { toast.success("Recorded."); invalidateQueries(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ slot, data }: { slot: string, data: ChantingLogUpdate }) => updateChantingLog(activity.id, slot, data),
    onSuccess: () => invalidateQueries(),
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (slot: string) => deleteChantingLog(activity.id, slot),
    onSuccess: () => { toast.success("Deleted."); invalidateQueries(); },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleOpenDialog = (slot: ChantingSlot) => {
    const log = activity.chanting_logs.find(l => l.slot === slot);
    setTempRounds(log?.rounds || 16);
    setTempRating(log?.rating || 8);
    setSelectedSlot(slot);
  };

  const handleSave = () => {
    if (!selectedSlot) return;
    const log = activity.chanting_logs.find(l => l.slot === selectedSlot);
    const data = { rounds: tempRounds, rating: tempRating };
    if (log) {
        updateMutation.mutate({ slot: selectedSlot, data });
    } else {
        addMutation.mutate({ slot: selectedSlot, ...data });
    }
  };

  const totalRounds = activity.chanting_logs.reduce((sum, log) => sum + log.rounds, 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Chanting</h3>
          <p className="text-xs font-bold text-primary">Total: {totalRounds} Rounds</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CHANTING_SLOT_CONFIG.map(({ value, label }) => {
          const log = activity.chanting_logs.find(l => l.slot === value);
          const isFilled = !!log;

          return (
            <Card 
              key={value}
              className={cn(
                "border-none shadow-sm transition-all active:scale-95",
                isFilled ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/30"
              )}
              onClick={() => !readOnly && handleOpenDialog(value)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center relative",
                    isFilled ? "bg-primary/10 text-primary" : "bg-background/50 text-muted-foreground"
                )}>
                    <Zap className={cn("h-6 w-6", isFilled && "fill-primary")} />
                    {isFilled && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                            <Star className="h-3 w-3 text-white fill-white" />
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
                    <p className="text-base font-black text-primary">
                        {isFilled ? `${log.rounds} Rounds` : "tap to enter"}
                    </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="sm:max-w-[400px] p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black">Chanting</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-10">
            <ScrollPicker label="Count of Rounds" min={0} max={108} value={tempRounds} onChange={setTempRounds} />
            <div className="space-y-2">
                <div className="flex justify-between px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Poor</span>
                    <span>Bliss</span>
                </div>
                <ScrollPicker label="Chanting Quality Rating" min={1} max={10} value={tempRating} onChange={setTempRating} />
            </div>
          </div>
          <DialogFooter className="flex-row gap-3 sm:justify-center">
            <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setSelectedSlot(null)}>Cancel</Button>
            <Button className="flex-1 rounded-2xl h-12 font-bold" onClick={handleSave} disabled={addMutation.isPending || updateMutation.isPending}>
              {(addMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin h-5 w-5" /> : "Save"}
            </Button>
            {activity.chanting_logs.some(l => l.slot === selectedSlot) && (
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(selectedSlot!)}>
                    <Trash2 className="h-5 w-5" />
                </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ChantingSection;