"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLogResponse, ChantingLogCreate, ChantingLogResponse, ChantingLogUpdate, ChantingSlot } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addChantingLog, updateChantingLog, deleteChantingLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Loader2, Zap, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ChantingSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const CHANTING_SLOTS: ChantingSlot[] = [
  "Before 6:30 am",
  "Before 8:30 am",
  "Before 10 am",
  "After 10 am",
];

const ChantingSection: React.FC<ChantingSectionProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [tempRounds, setTempRounds] = React.useState<Record<string, number>>({});
  const [tempRating, setTempRating] = React.useState<Record<string, number>>({});

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
    mutationFn: ({ id, data }: { id: string, data: ChantingLogUpdate }) => updateChantingLog(id, data),
    onSuccess: () => {
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error("Update failed", { description: error.message });
    },
    onSettled: () => setIsUpdating(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteChantingLog(id),
    onSuccess: () => {
      toast.success("Chanting slot deleted.");
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error("Delete failed", { description: error.message });
    },
  });

  const handleRoundsChange = (log: ChantingLogResponse, delta: number) => {
    if (readOnly || isUpdating) return;
    const newRounds = Math.max(1, Math.min(108, log.rounds + delta));
    if (newRounds !== log.rounds) {
      setIsUpdating(true);
      updateMutation.mutate({ id: log.id, data: { rounds: newRounds } });
    }
  };

  const handleRatingUpdate = (log: ChantingLogResponse, newRating: number) => {
    if (readOnly || isUpdating) return;
    setIsUpdating(true);
    updateMutation.mutate({ id: log.id, data: { rating: newRating } });
  };

  const handleAddSlot = (slot: ChantingSlot) => {
    if (readOnly || addMutation.isPending) return;
    addMutation.mutate({ slot, rounds: 16, rating: null });
  };

  const totalRounds = activity.chanting_logs.reduce((sum, log) => sum + log.rounds, 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Chanting
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Total: <span className="text-primary font-bold">{totalRounds}</span> Rounds
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CHANTING_SLOTS.map((slot) => {
            const log = activity.chanting_logs.find(l => l.slot === slot);
            const isFilled = !!log;

            if (isFilled) {
              return (
                <div key={slot} className="relative p-3 border rounded-lg bg-muted/30 flex flex-col items-center justify-center space-y-1">
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 text-red-400 hover:text-red-600"
                      onClick={() => deleteMutation.mutate(log.id)}
                      disabled={deleteMutation.isPending || isUpdating}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="flex items-center justify-center w-full">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRoundsChange(log, -1)}
                      disabled={readOnly || isUpdating || log.rounds <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-3xl font-bold text-primary mx-2">{log.rounds}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRoundsChange(log, 1)}
                      disabled={readOnly || isUpdating || log.rounds >= 108}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground text-center">{slot}</span>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-2 h-7 text-xs gap-1">
                        <Star className={cn("h-3 w-3", log.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                        {log.rating ? `${log.rating}/10` : 'Rate'}
                      </Button>
                    </PopoverTrigger>
                    {!readOnly && (
                      <PopoverContent className="w-64 p-4">
                        <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                          Quality Rating: {log.rating || 'N/A'}
                        </Label>
                        <Slider
                          defaultValue={[log.rating || 5]}
                          max={10}
                          step={1}
                          onValueChange={(value) => setTempRating({ ...tempRating, [log.id]: value[0] })}
                          onValueCommit={(value) => handleRatingUpdate(log, value[0])}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>1 (Poor)</span>
                          <span>10 (Excellent)</span>
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                </div>
              );
            } else {
              return (
                <Button
                  key={slot}
                  variant="outline"
                  className="flex flex-col h-20 p-2 items-center justify-center space-y-1 opacity-50 hover:opacity-100"
                  onClick={() => handleAddSlot(slot)}
                  disabled={readOnly || addMutation.isPending}
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-xs text-center">{slot}</span>
                </Button>
              );
            }
          })}
        </div>
        {(addMutation.isPending || isUpdating) && (
          <div className="flex items-center justify-center text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving changes...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChantingSection;