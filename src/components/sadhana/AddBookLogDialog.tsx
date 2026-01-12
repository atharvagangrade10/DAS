"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { BookLogCreate, BookLogResponse, BookLogUpdate } from "@/types/sadhana";
import { addBookLog, updateBookLog } from "@/utils/api";

const formSchema = z.object({
  name: z.string().min(1, "Book name is required"),
  reading_time: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().int().min(1, "Reading time must be at least 1 minute").max(1440, "Max 1440 minutes (24 hours)"),
  ),
  chapter_name: z.string().optional().or(z.literal('')),
});

interface AddBookLogDialogProps {
  activityId: string;
  logToEdit: BookLogResponse | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddBookLogDialog: React.FC<AddBookLogDialogProps> = ({
  activityId,
  logToEdit,
  isOpen,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const isEdit = !!logToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: logToEdit?.name || "",
      reading_time: logToEdit?.reading_time || 30,
      chapter_name: logToEdit?.chapter_name || "",
    },
  });

  React.useEffect(() => {
    if (logToEdit) {
      form.reset({
        name: logToEdit.name,
        reading_time: logToEdit.reading_time,
        chapter_name: logToEdit.chapter_name || "",
      });
    } else {
      form.reset({
        name: "",
        reading_time: 30,
        chapter_name: "",
      });
    }
  }, [logToEdit, form]);

  const addMutation = useMutation({
    mutationFn: (data: BookLogCreate) => addBookLog(activityId, data),
    onSuccess: () => {
      toast.success("Book log added successfully!");
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to add book log", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BookLogUpdate) => updateBookLog(logToEdit!.id, data),
    onSuccess: () => {
      toast.success("Book log updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to update book log", { description: error.message });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      name: values.name,
      reading_time: values.reading_time,
      chapter_name: values.chapter_name || null,
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      addMutation.mutate(payload);
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {isEdit ? "Edit Book Log" : "Add Book Reading"}
          </DialogTitle>
          <DialogDescription>
            Record the book you read and the time spent.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Bhagavad Gita As It Is" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reading_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reading Time (Minutes) <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      min="1"
                      max="1440"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chapter_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chapter/Section (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Chapter 1: Observing the Armies" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEdit ? "Save Changes" : "Add Log"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookLogDialog;