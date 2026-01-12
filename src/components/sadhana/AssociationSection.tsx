"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLogResponse, AssociationLogCreate, AssociationLogResponse, AssociationLogUpdate, AssociationType } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAssociationLog, updateAssociationLog, deleteAssociationLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Users, Trash2, Star, Book, Mic, Activity, Clock, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface AssociationSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const ASSOCIATION_CONFIG: { type: AssociationType, label: string, icon: React.ElementType }[] = [
  { type: "PRABHUPADA", label: "Prabhupada", icon: Star },
  { type: "GURU", label: "Guru", icon: Book },
  { type: "OTHER", label: "Devotees", icon: Users },
  { type: "PREACHING", label: "Preaching", icon: Mic },
  { type: "OTHER_ACTIVITIES", label: "Other", icon: Activity },
];

const AssociationSection: React.FC<AssociationSectionProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["activityLog", activity.today_date] });
  };

  const addMutation = useMutation({
    mutationFn: (data: AssociationLogCreate) => addAssociationLog(activity.id, data),
    onSuccess: () => {
      toast.success("Association recorded.");
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error("Failed to add", { description: error.message });
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
      toast.success("Record deleted.");
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error("Delete failed", { description: error.message });
    },
  });

  const handleDurationUpdate = (type: string, duration: number) => {
    if (readOnly || isUpdating) return;
    setIsUpdating(true);
    updateMutation.mutate({ type, data: { duration } });
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="pb-3 bg-primary/5">
        <CardTitle className="text-xl font-semibold flex items-center gap-2 text-primary">
          <Users className="h-6 w-6" />
          Association & Hearning
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-3">
          {ASSOCIATION_CONFIG.map(({ type, label, icon: Icon }) => {
            const log = activity.association_logs.find(l => l.type === type);
            const isFilled = !!log;

            return (
              <div key={type} className={cn(
                "p-4 border rounded-xl flex items-center justify-between transition-all",
                isFilled ? "bg-card border-primary/20 shadow-sm" : "bg-muted/30 border-dashed opacity-60"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center",
                    isFilled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold">
                      {isFilled ? formatDuration(log.duration) : "0m"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isFilled ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="secondary" size="sm" className="h-10 px-4 rounded-full gap-2">
                          <Edit2 className="h-4 w-4" />
                          Set
                        </Button>
                      </PopoverTrigger>
                      {!readOnly && (
                        <PopoverContent className="w-80 p-6 space-y-6" align="end">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-bold">Duration: {formatDuration(log.duration)}</Label>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <Slider
                              value={[log.duration]}
                              max={480} // 8 hours max for slider
                              min={0}
                              step={5}
                              onValueChange={(val) => handleDurationUpdate(log.type, val[0])}
                            />
                            <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">Slide to adjust minutes</p>
                          </div>
                          
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="w-full" 
                            onClick={() => deleteMutation.mutate(log.type)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </PopoverContent>
                      )}
                    </Popover>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-10 px-4 rounded-full border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => addMutation.mutate({ type, duration: 30 })}
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
      </CardContent>
    </Card>
  );
};

export default AssociationSection;