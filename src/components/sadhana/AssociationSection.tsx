"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityLogResponse, AssociationLogCreate, AssociationLogUpdate, AssociationType } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addAssociationLog, updateAssociationLog, deleteAssociationLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Headphones, Star, Book, Users, Mic, Activity, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ScrollPicker from "./ScrollPicker";

interface AssociationSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const ASSOCIATION_CONFIG: { type: AssociationType, label: string, icon: React.ElementType }[] = [
  { type: "PRABHUPADA", label: "Prabhupada", icon: Headphones },
  { type: "GURU", label: "Guru Maharaja", icon: Headphones },
  { type: "OTHER", label: "Other Devotees", icon: Users },
  { type: "PREACHING", label: "Preaching", icon: Mic },
  { type: "OTHER_ACTIVITIES", label: "Other", icon: Activity },
];

const AssociationSection: React.FC<AssociationSectionProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = React.useState<AssociationType | null>(null);
  const [tempDuration, setTempDuration] = React.useState(30);

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
    onSuccess: () => invalidateQueries(),
  });

  const deleteMutation = useMutation({
    mutationFn: (type: string) => deleteAssociationLog(activity.id, type),
    onSuccess: () => { toast.success("Deleted."); invalidateQueries(); },
  });

  const handleOpenDialog = (type: AssociationType) => {
    const log = activity.association_logs.find(l => l.type === type);
    setTempDuration(log?.duration || 30);
    setSelectedType(type);
  };

  const handleSave = () => {
    if (!selectedType) return;
    const log = activity.association_logs.find(l => l.type === selectedType);
    if (log) {
        updateMutation.mutate({ type: selectedType, data: { duration: tempDuration } });
    } else {
        addMutation.mutate({ type: selectedType, duration: tempDuration });
    }
  };

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 px-1">Association</h3>
      <div className="grid grid-cols-2 gap-3">
        {ASSOCIATION_CONFIG.slice(0, 4).map(({ type, label, icon: Icon }) => {
          const log = activity.association_logs.find(l => l.type === type);
          const isFilled = !!log;

          return (
            <Card 
              key={type}
              className={cn(
                "border-none shadow-sm transition-all active:scale-95",
                isFilled ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/30"
              )}
              onClick={() => !readOnly && handleOpenDialog(type)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center relative",
                    isFilled ? "bg-primary/10 text-primary" : "bg-background/50 text-muted-foreground"
                )}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
                    <p className="text-base font-black text-primary">
                        {isFilled ? formatTime(log.duration) : "00:00"}
                    </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedType} onOpenChange={() => setSelectedType(null)}>
        <DialogContent className="sm:max-w-[400px] p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black">Association Time</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <ScrollPicker label="Duration (Minutes)" min={0} max={480} step={5} value={tempDuration} onChange={setTempDuration} />
          </div>
          <DialogFooter className="flex-row gap-3 sm:justify-center">
            <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setSelectedType(null)}>Cancel</Button>
            <Button className="flex-1 rounded-2xl h-12 font-bold" onClick={handleSave} disabled={addMutation.isPending || updateMutation.isPending}>
              {(addMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin h-5 w-5" /> : "Save"}
            </Button>
            {activity.association_logs.some(l => l.type === selectedType) && (
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(selectedType!)}>
                    <Trash2 className="h-5 w-5" />
                </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AssociationSection;