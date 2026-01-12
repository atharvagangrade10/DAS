"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLogResponse, AssociationLogCreate, AssociationLogResponse, AssociationLogUpdate, AssociationType } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAssociationLog, updateAssociationLog, deleteAssociationLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Users, Trash2, Mic, Headphones, Book, Star, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface AssociationSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const ASSOCIATION_CONFIG: { type: AssociationType, label: string, icon: React.ElementType }[] = [
  { type: "PRABHUPADA", label: "Prabhupada", icon: Star },
  { type: "GURU", label: "Guru", icon: Book },
  { type: "OTHER", label: "Other Devotees", icon: Users },
  { type: "PREACHING", label: "Preaching", icon: Mic },
  { type: "OTHER_ACTIVITIES", label: "Other Activities", icon: Activity },
];

const AssociationSection: React.FC<AssociationSectionProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [tempDuration, setTempDuration] = React.useState<Record<string, number>>({});

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["activityLog", activity.today_date] });
  };

  const addMutation = useMutation({
    mutationFn: (data: AssociationLogCreate) => addAssociationLog(activity.id, data),
    onSuccess: () => {
      toast.success("Association added.");
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error("Failed to add association", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ type, data }: { type: string, data: AssociationLogUpdate }) => updateAssociationLog(activity.id, type, data),
    onSuccess: () => {
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error("Update failed", { description: error.message });
    },
    onSettled: () => setIsUpdating(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (type: string) => deleteAssociationLog(activity.id, type),
    onSuccess: () => {
      toast.success("Association deleted.");
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error("Delete failed", { description: error.message });
    },
  });

  const handleDurationUpdate = (log: AssociationLogResponse, newDuration: number) => {
    if (readOnly || isUpdating) return;
    setIsUpdating(true);
    updateMutation.mutate({ type: log.type, data: { duration: newDuration } });
  };

  const handleAddSlot = (type: AssociationType) => {
    if (readOnly || addMutation.isPending) return;
    addMutation.mutate({ type, duration: 30 });
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Association
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {ASSOCIATION_CONFIG.map(({ type, label, icon: Icon }) => {
            const log = activity.association_logs.find(l => l.type === type);
            const isFilled = !!log;

            if (isFilled) {
              return (
                <div key={type} className="relative p-3 border rounded-lg bg-muted/30 flex flex-col items-center justify-center space-y-1">
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 text-red-400 hover:text-red-600"
                      onClick={() => deleteMutation.mutate(log.type)}
                      disabled={deleteMutation.isPending || isUpdating}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="flex items-center justify-center w-full">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex flex-col h-16 w-full p-2">
                          <div className="flex items-center gap-2 text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-lg font-bold mt-1">{formatDuration(log.duration)}</span>
                        </Button>
                      </PopoverTrigger>
                      {!readOnly && (
                        <PopoverContent className="w-64 p-4">
                          <Label className="text-sm font-medium mb-2 block">Duration (Minutes)</Label>
                          <Input
                            type="number"
                            value={tempDuration[log.type] ?? log.duration}
                            onChange={(e) => setTempDuration({ ...tempDuration, [log.type]: Number(e.target.value) })}
                            min={0}
                            max={1440}
                          />
                          <Button 
                            size="sm" 
                            className="w-full mt-3" 
                            onClick={() => handleDurationUpdate(log, tempDuration[log.type] ?? log.duration)}
                            disabled={updateMutation.isPending}
                          >
                            Save
                          </Button>
                        </PopoverContent>
                      )}
                    </Popover>
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center font-medium leading-tight mt-1">{label}</span>
                </div>
              );
            } else {
              return (
                <Button
                  key={type}
                  variant="outline"
                  className="flex flex-col h-24 p-2 items-center justify-center space-y-1 opacity-50 hover:opacity-100 transition-opacity"
                  onClick={() => handleAddSlot(type)}
                  disabled={readOnly || addMutation.isPending}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-[10px] text-center font-medium leading-tight">{label}</span>
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

export default AssociationSection;