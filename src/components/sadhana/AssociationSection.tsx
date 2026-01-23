"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ActivityLogResponse, AssociationLogCreate, AssociationLogUpdate, AssociationType } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAssociationLog, updateAssociationLog, deleteAssociationLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Headphones, Users, Mic, Activity, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import DurationPicker from "./DurationPicker";

interface AssociationSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const ASSOCIATION_CONFIG: { type: AssociationType, label: string, icon: React.ElementType }[] = [
  { type: "PRABHUPADA", label: "Srila Prabhupada", icon: Headphones },
  { type: "GURU", label: "Guru Maharaja", icon: Headphones },
  { type: "OTHER", label: "Other Devotees", icon: Users },
  { type: "PREACHING", label: "Preaching", icon: Mic },
  { type: "OTHER_ACTIVITIES", label: "Other", icon: Activity },
];

const AssociationSection: React.FC<AssociationSectionProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = React.useState<AssociationType | null>(null);
  const [duration, setDuration] = React.useState(30);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["activityLog"] });
    setSelectedType(null);
  };

  const addMutation = useMutation({
    mutationFn: (data: AssociationLogCreate) => addAssociationLog(activity.id, data),
    onSuccess: () => { toast.success("Added."); invalidateQueries(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ type, data }: { type: string, data: AssociationLogUpdate }) => updateAssociationLog(activity.id, type, data),
    onSuccess: () => { toast.success("Updated."); invalidateQueries(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (type: string) => deleteAssociationLog(activity.id, type),
    onSuccess: () => { toast.success("Deleted."); invalidateQueries(); },
  });

  const handleOpenDialog = (type: AssociationType) => {
    const log = activity.association_logs.find(l => l.type === type);
    setDuration(log?.duration || 30);
    setSelectedType(type);
  };

  const handleSave = () => {
    if (!selectedType) return;
    const log = activity.association_logs.find(l => l.type === selectedType);
    if (log) {
      updateMutation.mutate({ type: selectedType, data: { duration } });
    } else {
      addMutation.mutate({ type: selectedType, duration });
    }
  };

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} mins`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Shravan
        </CardTitle>
        <CardDescription>Time spent in hearing and service.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {ASSOCIATION_CONFIG.map(({ type, label, icon: Icon }) => {
          const log = activity.association_logs.find(l => l.type === type);
          const isFilled = !!log;

          return (
            <Card
              key={type}
              className={cn(
                "border shadow-none transition-all active:scale-95 cursor-pointer",
                isFilled ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-muted/10 border-dashed"
              )}
              onClick={() => !readOnly && handleOpenDialog(type)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Icon className={cn("h-6 w-6", isFilled ? "text-primary" : "text-muted-foreground")} />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{label}</p>
                  <p className="text-sm font-black">
                    {isFilled ? formatTime(log.duration) : "0"}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>

      <Dialog open={!!selectedType} onOpenChange={() => setSelectedType(null)}>
        <DialogContent className="sm:max-w-[425px] p-6 rounded-[28px]">
          <DialogHeader>
            <DialogTitle>Duration of Shravan</DialogTitle>
            <DialogDescription>Use presets or the stepper to set your time.</DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <DurationPicker value={duration} onChange={setDuration} />
          </div>

          <DialogFooter className="flex flex-row gap-2">
            {activity.association_logs.some(l => l.type === selectedType) && (
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-red-500 hover:bg-red-50" onClick={() => deleteMutation.mutate(selectedType!)}>
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button onClick={handleSave} className="flex-1 h-12 rounded-xl font-bold" disabled={addMutation.isPending || updateMutation.isPending}>
              {(addMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Save Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AssociationSection;