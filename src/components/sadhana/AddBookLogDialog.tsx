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
import { Loader2, BookOpen, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { BookLogCreate, BookLogResponse, BookLogUpdate } from "@/types/sadhana";
import { addBookLog, updateBookLog } from "@/utils/api";
import DurationPicker from "./DurationPicker";
import booksDataFile from "./BooksName.json"; // Import raw json
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// --- Types for Local Helper ---
interface SectionDef {
  name: string;
  chapters: string[];
}
interface BookDef {
  name: string;
  chapters?: string[];
  sections?: SectionDef[];
}

const booksData = booksDataFile as { books: BookDef[] };

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
  const [sectionSearchOpen, setSectionSearchOpen] = React.useState(false);
  const [chapterSearchOpen, setChapterSearchOpen] = React.useState(false);

  // We need local state for "Section" just for browsing, not saved to backend 
  // (unless we decide to prepend it to chapter_name, but we assume chapter strings are unique enough or user just logs chapter)
  const [selectedSection, setSelectedSection] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      reading_time: 30,
      chapter_name: "",
    },
  });

  const selectedBookName = form.watch("name");

  // Reset form when dialog opens or log changes
  React.useEffect(() => {
    if (isOpen) {
      if (logToEdit) {
        let rawChapterName = logToEdit.chapter_name || "";
        let foundSectionName: string | null = null;

        // Smart Parse: Check if current book has sections
        const book = booksData.books.find(b => b.name === logToEdit.name);

        if (book && book.sections && rawChapterName) {
          // Try 1: Check if stored name is composite "Section - Chapter"
          for (const section of book.sections) {
            const prefix = `${section.name} - `;
            if (rawChapterName.startsWith(prefix)) {
              foundSectionName = section.name;
              rawChapterName = rawChapterName.substring(prefix.length); // Strip prefix for form
              break;
            }
            // Try 2: Maybe stored name is JUST the section name (if chapter was empty)
            if (rawChapterName === section.name) {
              foundSectionName = section.name;
              rawChapterName = "";
              break;
            }
            // Try 3: Legacy/Fallback - checks if raw chapter exists in a section directly
            if (section.chapters.includes(rawChapterName)) {
              foundSectionName = section.name;
              break;
            }
          }
        }

        setSelectedSection(foundSectionName);
        form.reset({
          name: logToEdit.name,
          reading_time: logToEdit.reading_time,
          chapter_name: rawChapterName,
        });

      } else {
        form.reset({
          name: "",
          reading_time: 30,
          chapter_name: "",
        });
        setSelectedSection(null);
      }
    }
  }, [logToEdit, isOpen, form]);

  // Derived Data
  const currentBook = React.useMemo(() =>
    booksData.books.find((b) => b.name === selectedBookName),
    [selectedBookName]);

  const hasSections = !!currentBook?.sections;

  const currentSections = React.useMemo(() =>
    currentBook?.sections || [],
    [currentBook]);

  const filteredChapters = React.useMemo(() => {
    if (!currentBook) return [];

    if (currentBook.chapters) {
      return currentBook.chapters;
    }

    if (currentBook.sections) {
      if (!selectedSection) return [];
      const sec = currentBook.sections.find(s => s.name === selectedSection);
      return sec ? sec.chapters : [];
    }

    return [];
  }, [currentBook, selectedSection]);


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
    let finalChapter = values.chapter_name;

    // Construct Composite Name if Section exists
    if (selectedSection) {
      if (values.chapter_name) {
        finalChapter = `${selectedSection} - ${values.chapter_name}`;
      } else {
        // If only section is selected but no chapter
        finalChapter = selectedSection;
      }
    }

    const payload = {
      name: values.name,
      reading_time: values.reading_time,
      chapter_name: finalChapter || null,
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

            {/* Book Selection */}
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
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
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
                                  form.setValue("chapter_name", "");
                                  setSelectedSection(null);
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

            {/* Time Picker */}
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

            {/* Section / Canto Selection (Conditional) */}
            {hasSections && (
              <FormItem className="flex flex-col">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Section / Canto</FormLabel>
                <Popover open={sectionSearchOpen} onOpenChange={setSectionSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sectionSearchOpen}
                      className={cn(
                        "h-12 w-full justify-between rounded-xl px-4 font-normal",
                        !selectedSection && "text-muted-foreground"
                      )}
                      disabled={!selectedBookName}
                    >
                      {selectedSection || "Select section..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command className="h-[300px] flex flex-col">
                      <CommandInput placeholder="Search section..." className="h-9 shrink-0" />
                      <CommandList className="flex-1 overflow-y-auto">
                        <CommandEmpty>No section found.</CommandEmpty>
                        <CommandGroup>
                          {currentSections.map((sec) => (
                            <CommandItem
                              value={sec.name}
                              key={sec.name}
                              onSelect={() => {
                                setSelectedSection(sec.name);
                                form.setValue("chapter_name", ""); // Clear chapter when section changes
                                setSectionSearchOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  sec.name === selectedSection ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {sec.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}

            {/* Chapter Selection */}
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
                          // Disable if no book, or (if book has sections) no section selected
                          disabled={!selectedBookName || (hasSections && !selectedSection)}
                        >
                          {field.value || "Select chapter..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command className="h-[300px] flex flex-col">
                        <CommandInput placeholder="Search chapter..." className="h-9 shrink-0" />
                        <CommandList className="flex-1 overflow-y-auto">
                          <CommandEmpty>
                            {hasSections && !selectedSection ? "Select a section first." : "No chapter found."}
                          </CommandEmpty>
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