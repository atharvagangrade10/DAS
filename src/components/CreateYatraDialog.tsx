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
import { YatraCreate } from "@/types/yatra";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createYatra } from "@/utils/api";

interface CreateYatraDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Yatra name is required"),
  date_start: z.date({ required_error: "Start date is required" }),
  date_end: z.date({ required_error: "End date is required" }),
  fee_category_1: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().int().min(0, "Fee must be non-negative").optional().default(0),
  ),
  fee_category_2: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().int().min(0, "Fee must be non-negative").optional().default(0),
  ),
  fee_category_3: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().int().min(0, "Fee must be non-negative").optional().default(0),
  ),
}).refine((data) => data.date_end >= data.date_start, {
  message: "End date cannot be before start date.",
  path: ["date_end"],
});

const CreateYatraDialog: React.FC<CreateYatraDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date_start: undefined,
      date_end: undefined,
      fee_category_1: 0,
      fee_category_2: 0,
      fee_category_3: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: YatraCreate) => createYatra(data),
    onSuccess: () => {
      toast.success("Yatra created successfully!");
      queryClient.invalidateQueries({ queryKey: ["yatras"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error("Failed to create yatra", {
        description: error.message,
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const yatraData: YatraCreate = {
      name: values.name,
      date_start: format(values.date_start, "yyyy-MM-dd"),
      date_end: format(values.date_end, "yyyy-MM-dd"),
      registration_fees: {
        additionalProp1: values.fee_category_1 || 0,
        additionalProp2: values.fee_category_2 || 0,
        additionalProp3: values.fee_category_3 || 0,
      },
    };
    mutation.mutate(yatraData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Yatra (Trip)</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new Yatra.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yatra Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
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
                name="date_end"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
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
            </div>
            <div className="space-y-2 pt-2">
              <FormLabel>Registration Fees (INR)</FormLabel>
              <FormField
                control={form.control}
                name="fee_category_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-normal text-muted-foreground">Category 1 Fee (e.g., Standard)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        min="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fee_category_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-normal text-muted-foreground">Category 2 Fee (e.g., Student)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        min="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fee_category_3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-normal text-muted-foreground">Category 3 Fee (e.g., Early Bird)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        min="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Yatra"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateYatraDialog;