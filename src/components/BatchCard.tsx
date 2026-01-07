"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CalendarDays, Repeat } from "lucide-react";
import { Batch, BatchRecursionEnum } from "@/types/batch";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteBatch } from "@/utils/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BatchCardProps {
  batch: Batch;
}

const DAYS_MAP = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const BatchCard: React.FC<BatchCardProps> = ({ batch }) => {
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteBatch(batch.id),
    onSuccess: () => {
      toast.success("Class deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete class", { description: error.message });
    },
  });

  const getRecurrenceText = () => {
    if (batch.recursion_type === BatchRecursionEnum.daily) {
      return "Daily";
    }
    const days = batch.days_of_week
      .sort((a, b) => a - b)
      .map((d) => DAYS_MAP[d])
      .join(", ");
    return `Weekly on ${days}`;
  };

  return (
    <Card className="flex flex-col h-full border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-1">
          <Badge className="w-fit bg-primary text-white">Class</Badge>
          <CardTitle className="text-2xl font-semibold mt-1">{batch.name}</CardTitle>
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" disabled>
            <Pencil className="h-5 w-5 text-gray-400" />
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the recurring class{" "}
                  <span className="font-semibold">{batch.name}</span> and all its attendance data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteMutation.mutate()} 
                  disabled={deleteMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1 grid gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {batch.description || "Recurring spiritual class."}
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Repeat className="h-4 w-4 text-primary" />
            <span className="font-medium">{getRecurrenceText()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>Starts: {format(parseISO(batch.start_date), "PPP")}</span>
          </div>
        </div>
        {!batch.is_active && (
          <Badge variant="outline" className="w-fit text-red-500 border-red-200">Inactive</Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchCard;