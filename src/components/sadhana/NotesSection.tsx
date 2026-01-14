"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateActivityLog } from "@/utils/api";
import { ActivityLogResponse } from "@/types/sadhana";
import { toast } from "sonner";
import { Loader2, StickyNote, Save } from "lucide-react";

interface NotesSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const NotesSection: React.FC<NotesSectionProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = React.useState(activity.notes_of_day || "");

  // Update local state when activity data changes (e.g. on date change)
  React.useEffect(() => {
    setNotes(activity.notes_of_day || "");
  }, [activity.notes_of_day]);

  const mutation = useMutation({
    mutationFn: (newNotes: string) => updateActivityLog(activity.id, { notes_of_day: newNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      toast.success("Notes saved.");
    },
    onError: (error: Error) => {
      toast.error("Failed to save notes", { description: error.message });
    },
  });

  const handleSave = () => {
    mutation.mutate(notes);
  };

  const hasChanged = notes !== (activity.notes_of_day || "");

  return (
    <Card className="border-none shadow-lg overflow-hidden">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-primary" />
              Notes of the Day
            </CardTitle>
            <CardDescription>Reflections, realizations, or events.</CardDescription>
          </div>
          {!readOnly && hasChanged && (
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={mutation.isPending}
              className="gap-2 bg-primary text-primary-foreground"
            >
              {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Textarea
          placeholder={readOnly ? "No notes recorded for this day." : "Type your realizations here..."}
          className="min-h-[120px] resize-none border-none bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl p-4 text-base"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          readOnly={readOnly}
        />
      </CardContent>
    </Card>
  );
};

export default NotesSection;