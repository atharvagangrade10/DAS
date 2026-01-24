"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateActivityLog } from "@/utils/api";
import { ActivityLogResponse } from "@/types/sadhana";
import { toast } from "sonner";
import { Loader2, StickyNote } from "lucide-react";

interface NotesSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const NotesSection: React.FC<NotesSectionProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = React.useState(activity.notes_of_day || "");
  const [isSaving, setIsSaving] = React.useState(false);

  // Sync with incoming props if ID changes, trusting local state while editing same ID
  const [lastActivityId, setLastActivityId] = React.useState(activity.id);
  if (activity.id !== lastActivityId) {
    setLastActivityId(activity.id);
    setNotes(activity.notes_of_day || "");
  }

  const mutation = useMutation({
    mutationFn: (newNotes: string) => updateActivityLog(activity.id, {
      // Send required fields along with the note to prevent 422 errors
      sleep_at: activity.sleep_at,
      wakeup_at: activity.wakeup_at,
      no_meat: activity.no_meat,
      no_intoxication: activity.no_intoxication,
      no_illicit_sex: activity.no_illicit_sex,
      no_gambling: activity.no_gambling,
      only_prasadam: activity.only_prasadam,
      mangla_attended: activity.mangla_attended,
      narshima_attended: activity.narshima_attended,
      tulsi_arti_attended: activity.tulsi_arti_attended,
      darshan_arti_attended: activity.darshan_arti_attended,
      guru_puja_attended: activity.guru_puja_attended,
      sandhya_arti_attended: activity.sandhya_arti_attended,
      notes_of_day: newNotes
    }),
    onMutate: () => setIsSaving(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      setIsSaving(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to save notes", { description: error.message });
      setIsSaving(false);
    },
  });

  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      mutation.mutate(newNotes);
    }, 1000);
  };

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
          <div className="h-4">
            {isSaving && (
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/60 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Textarea
          placeholder={readOnly ? "No notes recorded for this day." : "Type your realizations here..."}
          className="min-h-[120px] resize-none border-none bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl p-4 text-base"
          value={notes}
          onChange={handleNotesChange}
          readOnly={readOnly}
        />
      </CardContent>
    </Card>
  );
};

export default NotesSection;