"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createYatra } from "@/utils/api";

interface CreateYatraDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeeItemSchema = z.object({
  category_name: z.string().min(1, "Category name is required"),
  fee_amount: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().int().min(0, "Fee must be non-negative"),
  ),
});

const formSchema = z.object({
  name: z.string().min(1, "Yatra name is required"),
  date_start: z.date({ required_error: "Start date is required" }),
  date_end: z.date({ required_error: "End date is required" }),
  fees: z.array(FeeItemSchema).min(1, "At least one registration fee category is required."),
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
      fees: [{ category_name: "Standard", fee_amount: 0 }], // Initial default fee
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fees",
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
    const registration_fees = values.fees.reduce((acc, fee) => {
      // Use the category name as the key in the dictionary payload
      acc[fee.category_name] = fee.fee_amount;
      return acc;
    }, {} as Record<string, number>);

    const yatraData: YatraCreate = {
      name: values.name,
      date_start: format(values.date_start, "yyyy-MM-dd"),
      date_end: format(values.date_end, "yyyy-MM-dd"),
      registration_fees,
    };
    mutation.mutate(yatraData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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
            
            <div className="space-y-3 pt-2 border-t">
              <div className="flex justify-between items-center">
                <FormLabel className="text-base font-semibold">Registration Fees (INR)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ category_name: "", fee_amount: 0 })}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Category
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start border p-3 rounded-md">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name={`fees.${index}.category_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-normal text-muted-foreground">Category Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`fees.${index}.fee_amount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-normal text-muted-foreground">Fee Amount</FormLabel>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="mt-7 text-red-500 hover:text-red-700"
                    disabled={fields.length === 1} // Prevent deleting the last field
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove fee category</span>
                  </Button>
                </div>
              ))}
              <FormMessage>{form.formState.errors.fees?.message}</FormMessage>
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