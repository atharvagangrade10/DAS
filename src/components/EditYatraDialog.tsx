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
import { Yatra, YatraUpdate } from "@/types/yatra";
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { updateYatra } from "@/utils/api";

interface EditYatraDialogProps {
  yatra: Yatra;
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

const EditYatraDialog: React.FC<EditYatraDialogProps> = ({
  yatra,
  isOpen,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();

  // Map the dictionary registration_fees to the array format used by the form
  const initialFees = React.useMemo(() => {
    return Object.entries(yatra.registration_fees).map(([category_name, fee_amount]) => ({
      category_name,
      fee_amount,
    }));
  }, [yatra.registration_fees]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: yatra.name,
      date_start: parseISO(yatra.date_start),
      date_end: parseISO(yatra.date_end),
      fees: initialFees.length > 0 ? initialFees : [{ category_name: "Standard", fee_amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fees",
  });

  const mutation = useMutation({
    mutationFn: (data: YatraUpdate) => updateYatra(yatra.id, data),
    onSuccess: () => {
      toast.success("Yatra updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["yatras"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to update yatra", {
        description: error.message,
      });
    },
  });

  // Re-sync form values if yatra prop changes
  React.useEffect(() => {
    if (yatra) {
      const fees = Object.entries(yatra.registration_fees).map(([category_name, fee_amount]) => ({
        category_name,
        fee_amount,
      }));
      form.reset({
        name: yatra.name,
        date_start: parseISO(yatra.date_start),
        date_end: parseISO(yatra.date_end),
        fees: fees.length > 0 ? fees : [{ category_name: "Standard", fee_amount: 0 }],
      });
    }
  }, [yatra, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const registration_fees = values.fees.reduce((acc, fee) => {
      acc[fee.category_name] = fee.fee_amount;
      return acc;
    }, {} as Record<string, number>);

    const yatraData: YatraUpdate = {
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
          <DialogTitle>Edit Yatra</DialogTitle>
          <DialogDescription>
            Modify the details for {yatra.name}.
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
                    disabled={fields.length === 1}
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
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Yatra"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditYatraDialog;