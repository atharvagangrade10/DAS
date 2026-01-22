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
import { Loader2, BookOpen, Check, ChevronsUpDown, Search } from "lucide-react";
import { toast } from "sonner";
import { BookLogCreate, BookLogResponse, BookLogUpdate } from "@/types/sadhana";
import { addBookLog, updateBookLog } from "@/utils/api";
import DurationPicker from "./DurationPicker";
import booksData from "./BooksName.json";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Book name is required"),
  reading_time: z.number().int().min(1, "At least 1 minute"),
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
  const [bookSearchOpen, setBookSearchOpen] = React.useState(false);
  const [chapterSearchOpen, setChapterSearchOpen] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: logToEdit?.name || "",
      reading_time: logToEdit?.reading_time || 30,
      chapter_name: logToEdit?.chapter_name || "",
    },
  });

  const selectedBookName = form.watch("name");
  const filteredChapters = React.useMemo(() => {
    const book = booksData.books.find((b) => b.name === selectedBookName);
    return book ? book.chapters : [];
  }, [selectedBookName]);

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
  }, [logToEdit, form, isOpen]);

  const addMutation = useMutation({
    mutationFn: (data: BookLogCreate) => addBookLog(activityId, data),
    onSuccess: () => {
      toast.success("Log added!");
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to add", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: BookLogUpdate) => updateBookLog(activityId, logToEdit!.name, data),
    onSuccess: () => {
      toast.success("Log updated!");
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to update", { description: error.message });
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6 rounded-[28px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {isEdit ? "Edit Reading" : "Log Reading"}
          </DialogTitle>
          <DialogDescription>Record your spiritual study.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Book Title</FormLabel>
                  <Popover open={bookSearchOpen} onOpenChange={setBookSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={bookSearchOpen}
                          className={cn(
                            "h-12 w-full justify-between rounded-xl px-4 font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? booksData.books.find((book) => book.name === field.value)?.name || field.value
                            : "Select a book..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      onWheel={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    >
                      <Command className="h-[300px] flex flex-col">
                        <CommandInput placeholder="Search book..." className="h-9 shrink-0" />
                        <CommandList className="flex-1 overflow-y-auto">
                          <CommandEmpty>No book found.</CommandEmpty>
                          <CommandGroup>
                            {booksData.books.map((book) => (
                              <CommandItem
                                value={book.name}
                                key={book.name}
                                onSelect={() => {
                                  form.setValue("name", book.name);
                                  form.setValue("chapter_name", ""); // Reset chapter when book changes
                                  setBookSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    book.name === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {book.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reading_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reading Duration</FormLabel>
                  <FormControl>
                    <DurationPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chapter_name"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chapter / Verse</FormLabel>
                  <Popover open={chapterSearchOpen} onOpenChange={setChapterSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={chapterSearchOpen}
                          className={cn(
                            "h-12 w-full justify-between rounded-xl px-4 font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={!selectedBookName}
                        >
                          {field.value || "Select chapter..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      onWheel={(e) => e.stopPropagation()}
                      onTouchMove={(e) => e.stopPropagation()}
                    >
                      <Command className="h-[300px] flex flex-col">
                        <CommandInput placeholder="Search chapter..." className="h-9 shrink-0" />
                        <CommandList className="flex-1 overflow-y-auto">
                          <CommandEmpty>No chapter found.</CommandEmpty>
                          <CommandGroup>
                            {filteredChapters.map((chapter) => (
                              <CommandItem
                                value={chapter}
                                key={chapter}
                                onSelect={() => {
                                  form.setValue("chapter_name", chapter);
                                  setChapterSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    chapter === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {chapter}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={addMutation.isPending || updateMutation.isPending}>
                {(addMutation.isPending || updateMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isEdit ? "Update Entry" : "Save Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBookLogDialog;