"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLogResponse, BookLogResponse } from "@/types/sadhana";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBookLog } from "@/utils/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BookOpen, PlusCircle, Loader2, Trash2, Pencil } from "lucide-react";
import AddBookLogDialog from "./AddBookLogDialog";

interface BookReadingSectionProps {
  activity: ActivityLogResponse;
  readOnly: boolean;
}

const BookReadingSection: React.FC<BookReadingSectionProps> = ({ activity, readOnly }) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [logToEdit, setLogToEdit] = React.useState<BookLogResponse | null>(null);

  const totalReadingTime = activity.book_reading_logs.reduce((sum, log) => sum + log.reading_time, 0);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["activityLog", activity.today_date] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBookLog(id),
    onSuccess: () => {
      toast.success("Book log deleted.");
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast.error("Delete failed", { description: error.message });
    },
  });

  const handleAdd = () => {
    setLogToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (log: BookLogResponse) => {
    setLogToEdit(log);
    setIsDialogOpen(true);
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
        return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Book Reading
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Total: <span className="text-primary font-bold">{formatDuration(totalReadingTime)}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!readOnly && (
            <Button 
              variant="outline" 
              className="w-full gap-2" 
              onClick={handleAdd}
              disabled={deleteMutation.isPending}
            >
              <PlusCircle className="h-4 w-4" /> Add Book Log
            </Button>
          )}

          {activity.book_reading_logs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No books recorded today.
            </div>
          ) : (
            <div className="space-y-3">
              {activity.book_reading_logs.map((log) => (
                <div key={log.id} className="p-3 border rounded-lg bg-muted/30 flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-semibold truncate">{log.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {log.chapter_name || "No chapter specified"}
                    </p>
                    <p className="text-sm font-bold text-primary mt-1">
                      {formatDuration(log.reading_time)}
                    </p>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary/70 hover:text-primary"
                        onClick={() => handleEdit(log)}
                        disabled={deleteMutation.isPending}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-400 hover:text-red-600"
                        onClick={() => deleteMutation.mutate(log.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddBookLogDialog
        activityId={activity.id}
        logToEdit={logToEdit}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
};

export default BookReadingSection;