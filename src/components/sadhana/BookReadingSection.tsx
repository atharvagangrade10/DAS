"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityLogResponse, BookLogResponse } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBookLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCORE_RULES } from "@/utils/scoreUtils";
import AddBookLogDialog from "./AddBookLogDialog";

interface BookReadingSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const DEFAULT_BOOKS = ["BHAGAVAD GITA", "SRIMAD BHAGAVATAM"];

const BookReadingSection: React.FC<BookReadingSectionProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [logToEdit, setLogToEdit] = React.useState<BookLogResponse | null>(null);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["activityLog"] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBookLog(activity.id, id),
    onSuccess: () => { toast.success("Deleted."); invalidateQueries(); },
  });

  const handleAdd = () => { setLogToEdit(null); setIsDialogOpen(true); };
  const handleEdit = (log: BookLogResponse) => { setLogToEdit(log); setIsDialogOpen(true); };

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Book Reading</h3>
        {!readOnly && (
          <Button onClick={handleAdd} size="sm" className="hidden sm:flex rounded-full font-bold h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Books
          </Button>
        )}
      </div>

      {!readOnly && (
        <Button onClick={handleAdd} variant="outline" className="w-full sm:hidden rounded-full border-dashed border-2 font-bold text-primary mb-2">
          <Plus className="h-4 w-4 mr-2" />
          Add Books
        </Button>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {activity.book_reading_logs.length === 0 ? (
          <Card className="col-span-full border-dashed bg-muted/20 py-10 flex flex-col items-center justify-center text-muted-foreground">
            <BookOpen className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">No books logged</p>
          </Card>
        ) : (
          activity.book_reading_logs.map((log) => (
            <Card
              key={log.id || log.name}
              className="border-none shadow-sm transition-all active:scale-95 bg-primary/5 ring-1 ring-primary/20"
              onClick={() => !readOnly && handleEdit(log)}
            >
              <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center space-y-2">
                <div className="w-full aspect-[3/4] bg-primary/10 rounded-xl flex flex-col items-center justify-center p-3 relative">
                  <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-primary opacity-20 mb-2" />
                  <span className="text-[9px] sm:text-[10px] font-black text-primary leading-tight uppercase line-clamp-3">{log.name}</span>
                  {log.chapter_name && (
                    <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground leading-tight uppercase line-clamp-2 mt-1 px-1">
                      {log.chapter_name}
                    </span>
                  )}
                  {!readOnly && (
                    <Button
                      variant="ghost" size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 sm:h-7 sm:w-7 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-md"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(log.id || log.name); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Duration</p>
                  <p className="text-sm sm:text-base font-black text-primary">{formatTime(log.reading_time)}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AddBookLogDialog
        activityId={activity.id}
        logToEdit={logToEdit}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </section>
  );
};

export default BookReadingSection;