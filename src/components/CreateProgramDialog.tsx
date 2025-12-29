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
import { toast } from "sonner";
import { ProgramCreate, Program } from "@/types/program";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/config/api";

interface CreateProgramDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  program_name: z.string().min(1, "Program name is required"),
  description: z.string().optional(),
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date({ required_error: "End date is required" }),
  num_sessions: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().min(1, "Number of sessions must be at least 1").optional(),
  ).refine(val => val !== undefined, { message: "Number of sessions is required" }),
}).refine((data) => data.end_date >= data.start_date, {
  message: "End date cannot be before start date.",
  path: ["end_date"],
});

const getAuthHeaders = () => {
  const token = localStorage.getItem('das_auth_token');
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const createProgram = async (programData: ProgramCreate): Promise<Program> => {
  const response = await fetch(`${API_BASE_URL}/program/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(programData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create program' }));
    throw new Error(errorData.detail || "Failed to create program");
  }
  return response.json();
};

const CreateProgramDialog: React.FC<CreateProgramDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      program_name: "",
      description: "",
      start_date: undefined,
      end_date: undefined,
      num_sessions: 1,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ProgramCreate) => createProgram(data),
    onSuccess: () => {
      toast.success("Program created successfully!");
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error("Failed to create program", {
        description: error.message,
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const programData: ProgramCreate = {
      program_name: values.program_name,
      description: values.description || "",
      start_date: format(values.start_date, "yyyy-MM-dd"),
      end_date: format(values.end_date, "yyyy-MM-dd"),
      num_sessions: values.num_sessions!,
    };
    mutation.mutate(programData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Program</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new program.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="program_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date <span className="text-red-500">*</span></FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="num_sessions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Sessions <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      min="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating..." : "Create Program"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProgramDialog;