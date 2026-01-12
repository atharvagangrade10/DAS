"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ActivityLogResponse, AssociationLogCreate, AssociationLogUpdate, AssociationType } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAssociationLog, updateAssociationLog, deleteAssociationLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Headphones, Users, Mic, Activity, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  const [tempDuration, setTempDuration] = React.useState("30");

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
    setTempDuration((log?.duration || 30).toString());
    setSelectedType(type);
  };

  const handleSave = () => {
    if (!selectedType) return;
    const duration = parseInt(tempDuration);
    if (isNaN(duration) || duration < 0) {
        toast.error("Invalid duration");
        return;
    }
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
            Association
        </CardTitle>
        <CardDescription>Time spent in spiritual hearing and service.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {ASSOCIATION_CONFIG.map(({ type, label, icon: Icon }) => {
          const log = activity.association_logs.find(l => l.type === type);
          const isFilled = !!log;

          return (
            <Card 
              key={type}
              className={cn(
                "border shadow-none transition-all hover:border-primary/40 cursor-pointer",
                isFilled ? "bg-primary/5 border-primary/20" : "bg-muted/20"
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Association Time</DialogTitle>
            <DialogDescription>How many minutes did you spend in this activity?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Duration (Minutes)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    type="number" 
                    className="pl-10" 
                    value={tempDuration} 
                    onChange={e => setTempDuration(e.target.value)} 
                    placeholder="e.g. 60"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2">
            {activity.association_logs.some(l => l.type === selectedType) && (
                <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(selectedType!)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
            <Button onClick={handleSave} className="flex-1" disabled={addMutation.isPending || updateMutation.isPending}>
              Save Association
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AssociationSection;