"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityLogResponse, ChantingLogCreate, ChantingLogUpdate, ChantingSlot } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addChantingLog, updateChantingLog, deleteChantingLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Trash2, Star, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ScrollPicker from "./ScrollPicker";

interface ChantingSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const CHANTING_SLOT_CONFIG: { value: ChantingSlot, label: string }[] = [
  { value: "before_6_30_am", label: "Before 6:30 AM" },
  { value: "6_30_to_8_30_am", label: "Before 8:30 AM" },
  { value: "8_30_to_10_am", label: "Before 10:00 AM" },
  { value: "before_9_30_pm", label: "Evening Slot" },
  { value: "after_9_30_pm", label: "Late Night" },
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
    onSuccess: () => { toast.success("Rounds recorded."); invalidateQueries(); },
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
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
          <h3 className="text-base font-black uppercase tracking-widest text-primary/60">Chanting</h3>
          <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <p className="text-xs font-black text-primary uppercase tracking-tighter">Total: {totalRounds} Rounds</p>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CHANTING_SLOT_CONFIG.map(({ value, label }) => {
          const log = activity.chanting_logs.find(l => l.slot === value);
          const isFilled = !!log;

          return (
            <Card 
              key={value}
              className={cn(
                "border-none shadow-md transition-all active:scale-95 cursor-pointer relative overflow-hidden",
                isFilled ? "bg-white ring-2 ring-primary/20" : "bg-muted/40 border-2 border-dashed border-primary/5"
              )}
              onClick={() => handleOpenDialog(value)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center transition-colors",
                    isFilled ? "bg-primary text-primary-foreground shadow-lg" : "bg-white/50 text-muted-foreground border shadow-inner"
                )}>
                    {isFilled ? <Zap className="h-7 w-7 fill-white" /> : <Plus className="h-6 w-6 opacity-30" />}
                </div>
                
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">{label}</p>
                    <p className={cn(
                        "text-lg font-black leading-tight",
                        isFilled ? "text-primary" : "text-muted-foreground/40 italic"
                    )}>
                        {isFilled ? `${log.rounds} Rounds` : "Enter Data"}
                    </p>
                </div>

                {isFilled && log.rating && (
                    <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-[10px] font-black text-yellow-600">{log.rating}/10</span>
                    </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="sm:max-w-[450px] p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border-none shadow-2xl overflow-hidden">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-center text-2xl font-black tracking-tight">Daily Chanting</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-10 py-4">
            <ScrollPicker label="Rounds Chanted" min={0} max={64} value={tempRounds} onChange={setTempRounds} />
            
            <div className="space-y-4 px-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <span>Poor</span>
                    <span>Excellent</span>
                </div>
                <ScrollPicker label="Chanting Quality" min={1} max={10} value={tempRating} onChange={setTempRating} />
            </div>
          </div>

          <DialogFooter className="mt-8 flex flex-row gap-3 sm:gap-4">
            {activity.chanting_logs.some(l => l.slot === selectedSlot) && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-14 w-14 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0" 
                    onClick={() => deleteMutation.mutate(selectedSlot!)}
                >
                    <Trash2 className="h-6 w-6" />
                </Button>
            )}
            <Button 
                className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg" 
                onClick={handleSave} 
                disabled={addMutation.isPending || updateMutation.isPending}
            >
              {(addMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin h-5 w-5" /> : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ChantingSection;