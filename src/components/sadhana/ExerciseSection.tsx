"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ActivityLogResponse, ActivityLogUpdate } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateActivityLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dumbbell, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import DurationPicker from "./DurationPicker";

interface ExerciseSectionProps {
    activity: ActivityLogResponse;
    readOnly: boolean;
}

const ExerciseSection: React.FC<ExerciseSectionProps> = ({ activity, readOnly }) => {
    const queryClient = useQueryClient();
    const [open, setOpen] = React.useState(false);
    const [duration, setDuration] = React.useState(0);

    const invalidateQueries = () => {
        queryClient.invalidateQueries({ queryKey: ["activityLog"] });
        setOpen(false);
    };

    const updateMutation = useMutation({
        mutationFn: (data: ActivityLogUpdate) => updateActivityLog(activity.id, data),
        onSuccess: () => { toast.success("Updated exercise time."); invalidateQueries(); },
    });

    const handleOpenDialog = () => {
        setDuration(activity.exercise_time || 0);
        setOpen(true);
    };

    const handleSave = () => {
        updateMutation.mutate({ exercise_time: duration });
    };

    const formatTime = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m} mins`;
    };

    const isFilled = (activity.exercise_time || 0) > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    Exercise
                </CardTitle>
                <CardDescription>Keep the body fit for service.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <Card
                    className={cn(
                        "border shadow-none transition-all active:scale-95 cursor-pointer max-w-sm",
                        isFilled ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-muted/10 border-dashed"
                    )}
                    onClick={() => !readOnly && handleOpenDialog()}
                >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <Dumbbell className={cn("h-6 w-6", isFilled ? "text-primary" : "text-muted-foreground")} />
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Workout Duration</p>
                            <p className="text-sm font-black">
                                {formatTime(activity.exercise_time || 0)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </CardContent>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px] p-6 rounded-[28px]">
                    <DialogHeader>
                        <DialogTitle>Exercise Duration</DialogTitle>
                        <DialogDescription>How long did you exercise today?</DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <DurationPicker value={duration} onChange={setDuration} />
                    </div>

                    <DialogFooter>
                        <Button onClick={handleSave} className="w-full h-12 rounded-xl font-bold" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            Save Time
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default ExerciseSection;
