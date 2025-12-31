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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const RegistrationFeeSchema = z.object({
  option_name: z.string().min(1, "Option name is required"),
  amount: z.preprocess((val) => (val === "" ? 0 : Number(val)), z.number().int().min(0)),
  child_amount: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().int().min(0).optional()),
  child_condition_by_age: z.preprocess((val) => (val === "" || val === null ? undefined : Number(val)), z.number().int().min(0).optional()),
});

const formSchema = z.object({
  name: z.string().min(1, "Yatra name is required"),
  date_start: z.date({ required_error: "Start date is required" }),
  date_end: z.date({ required_error: "End date is required" }),
  registration_fees: z.array(RegistrationFeeSchema).min(1, "At least one registration fee is required"),
  can_add_members: z.boolean().default(false),
  status: z.enum(["Open", "Closed"]).default("Open"),
}).refine((data) => data.date_end >= data.date_start, {
  message: "End date cannot be before start date.",
  path: ["date_end"],
});

const CreateYatraDialog: React.FC<CreateYatraDialogProps> = ({ isOpen, onOpenChange }) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date_start: undefined,
      date_end: undefined,
      registration_fees: [{ option_name: "Standard", amount: 0 }],
      can_add_members: false,
      status: "Open",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "registration_fees",
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
      toast.error("Failed to create yatra", { description: error.message });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const yatraData: YatraCreate = {
      ...values,
      date_start: format(values.date_start, "yyyy-MM-dd"),
      date_end: format(values.date_end, "yyyy-MM-dd"),
    };
    mutation.mutate(yatraData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Yatra</DialogTitle>
          <DialogDescription>Configure trip details and multiple fee options.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yatra Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
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
                          <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                          <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="can_add_members"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 pt-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Allow Family</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Registration Fee Options</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ option_name: "", amount: 0 })}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Option
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid gap-4 p-4 border rounded-lg relative bg-muted/20">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)} disabled={fields.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`registration_fees.${index}.option_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Standard" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`registration_fees.${index}.amount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (Adult) ₹</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`registration_fees.${index}.child_amount`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Child Amount (Optional) ₹</FormLabel>
                          <FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`registration_fees.${index}.child_condition_by_age`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Child Age Limit (Optional)</FormLabel>
                          <FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
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