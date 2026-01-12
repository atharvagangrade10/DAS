"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLogResponse, ChantingLogCreate, ChantingLogResponse, ChantingLogUpdate, ChantingSlot } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addChantingLog, updateChantingLog, deleteChantingLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Zap, Trash2, Star, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ScrollPicker from "./ScrollPicker";

interface ChantingSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const CHANTING_SLOT_CONFIG: { value: ChantingSlot, label: string }[] = [
  { value: "before_6_30_am", label: "Before 6:30 AM" },
  { value: "6_30_to_8_30_am", label: "6:30 - 8:30 AM" },
  { value: "8_30_to_10_am", label: "8:30 - 10:00 AM" },
  { value: "before_9_30_pm", label: "Before 9:30 PM" },
  { value: "after_9_30_pm", label: "After 9:30 PM" },
];

const ChantingSection: React.FC<ChantingSectionProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["activityLog", activity.today_date] });
  };

  const addMutation = useMutation({
    mutationFn: (data: ChantingLogCreate) => addChantingLog(activity.id, data),
    onSuccess: () => {
      toast.success("Chanting recorded.");
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error("Failed to record", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ slot, data }: { slot: string, data: ChantingLogUpdate }) => updateChantingLog(activity.id, slot, data),
    onSuccess: () => {
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error("Update failed", { description: error.message });
    },
    onSettled: () => setIsUpdating(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (slot: string) => deleteChantingLog(activity.id, slot),
    onSuccess: () => {
      toast.success("Deleted.");
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error("Delete failed", { description: error.message });
    },
  });

  const handleUpdate = (slot: string, data: ChantingLogUpdate) => {
    if (readOnly || isUpdating) return;
    setIsUpdating(true);
    updateMutation.mutate({ slot, data });
  };

  const totalRounds = activity.chanting_logs.reduce((sum, log) => sum + log.rounds, 0);

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="pb-3 bg-primary/5">
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="h-6 w-6 fill-primary" />
            Chanting
          </div>
          <div className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-bold">
            {totalRounds} Rounds
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {CHANTING_SLOT_CONFIG.map(({ value, label }) => {
            const log = activity.chanting_logs.find(l => l.slot === value);
            const isFilled = !!log;

            return (
              <div key={value} className={cn(
                "p-4 border rounded-xl flex items-center justify-between transition-all",
                isFilled ? "bg-card border-primary/20 shadow-sm" : "bg-muted/30 border-dashed opacity-60"
              )}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                  {isFilled ? (
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-primary">{log.rounds}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Rounds</span>
                      {log.rating && (
                         <div className="ml-2 flex items-center gap-0.5 text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            <Star className="h-2.5 w-2.5 fill-yellow-500" />
                            {log.rating}
                         </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm font-medium mt-1">Not Recorded</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isFilled ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="secondary" size="sm" className="h-10 px-4 rounded-full gap-2 font-bold">
                          <Edit2 className="h-4 w-4" />
                          Set
                        </Button>
                      </PopoverTrigger>
                      {!readOnly && (
                        <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
                          <div className="p-6 space-y-8 bg-background">
                            <ScrollPicker
                              label="Select Rounds"
                              min={1}
                              max={64}
                              value={log.rounds}
                              onChange={(val) => handleUpdate(log.slot, { rounds: val })}
                            />
                            
                            <ScrollPicker
                              label="Quality Rating"
                              min={1}
                              max={10}
                              value={log.rating || 5}
                              onChange={(val) => handleUpdate(log.slot, { rating: val })}
                            />

                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="w-full h-12 rounded-xl font-bold" 
                              onClick={() => deleteMutation.mutate(log.slot)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Record
                            </Button>
                          </div>
                        </PopoverContent>
                      )}
                    </Popover>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-10 px-4 rounded-full border-primary/30 text-primary font-bold hover:bg-primary/5"
                      onClick={() => addMutation.mutate({ slot: value, rounds: 16, rating: 8 })}
                      disabled={readOnly || addMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {(addMutation.isPending || isUpdating) && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-bottom-4">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> 
            Updating Sadhana...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChantingSection;