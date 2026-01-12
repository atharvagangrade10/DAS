"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLogResponse, ChantingLogCreate, ChantingLogResponse, ChantingLogUpdate, ChantingSlot } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addChantingLog, updateChantingLog, deleteChantingLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Loader2, Zap, Trash2, Star, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

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
      toast.success("Chanting slot added.");
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error("Failed to add slot", { description: error.message });
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
      toast.success("Chanting slot deleted.");
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
            {totalRounds} Rounds Total
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
                "p-4 border rounded-xl transition-all",
                isFilled ? "bg-card border-primary/20 shadow-sm" : "bg-muted/30 border-dashed opacity-60"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                    {isFilled ? (
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-2xl font-black text-primary">{log.rounds}</span>
                         <span className="text-xs text-muted-foreground font-medium">Rounds</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium mt-1">Not Recorded</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isFilled ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="secondary" size="sm" className="h-10 px-4 rounded-full gap-2">
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                        </PopoverTrigger>
                        {!readOnly && (
                          <PopoverContent className="w-80 p-6 space-y-6" align="end">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <Label className="text-base font-bold">Rounds: {log.rounds}</Label>
                                <div className="flex gap-1">
                                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleUpdate(log.slot, { rounds: Math.max(1, log.rounds - 1) })}>
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleUpdate(log.slot, { rounds: Math.min(108, log.rounds + 1) })}>
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                              </div>
                              <Slider
                                value={[log.rounds]}
                                max={108}
                                min={1}
                                step={1}
                                onValueChange={(val) => handleUpdate(log.slot, { rounds: val[0] })}
                              />
                            </div>

                            <div className="space-y-4">
                              <Label className="text-base font-bold flex items-center gap-2">
                                <Star className={cn("h-4 w-4", log.rating ? "fill-yellow-400 text-yellow-400" : "")} />
                                Quality Rating: {log.rating || 5}/10
                              </Label>
                              <Slider
                                value={[log.rating || 5]}
                                max={10}
                                min={1}
                                step={1}
                                onValueChange={(val) => handleUpdate(log.slot, { rating: val[0] })}
                              />
                            </div>

                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="w-full mt-4" 
                              onClick={() => deleteMutation.mutate(log.slot)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Log
                            </Button>
                          </PopoverContent>
                        )}
                      </Popover>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 px-4 rounded-full border-primary/30 text-primary hover:bg-primary/5"
                        onClick={() => addMutation.mutate({ slot: value, rounds: 16, rating: null })}
                        disabled={readOnly || addMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Record
                      </Button>
                    )}
                  </div>
                </div>

                {isFilled && (
                   <div className="flex items-center gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "h-1.5 flex-1 rounded-full",
                            i < (log.rating || 0) ? "bg-yellow-400" : "bg-muted"
                          )} 
                        />
                      ))}
                   </div>
                )}
              </div>
            );
          })}
        </div>
        {(addMutation.isPending || isUpdating) && (
          <div className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm animate-bounce">
            <Loader2 className="h-4 w-4 animate-spin" /> 
            Syncing...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChantingSection;