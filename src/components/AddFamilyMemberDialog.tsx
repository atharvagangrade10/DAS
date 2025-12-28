"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format, differenceInYears } from "date-fns";
import DOBInput from "./DOBInput";

const PROFESSIONS = [
  "Student",
  "Employee",
  "Teacher",
  "Doctor",
  "Business",
  "Housewife",
  "Retired",
  "Other",
];

const familyMemberSchema = z.object({
  relation: z.enum(["Husband", "Wife", "Child", "Father", "Mother"]),
  full_name: z.string().min(1, "Full name is required"),
  initiated_name: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  address: z.string().min(1, "Address is required"),
  place_name: z.string().optional(),
  dob: z.date({ required_error: "Date of birth is required" }),
  age: z.number().optional(),
  gender: z.enum(["Male", "Female", "Other"]),
  profession_type: z.string().optional(),
  profession_other: z.string().optional(),
  chanting_rounds: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().int().min(0).optional(),
  ),
  email: z.string().email().optional().or(z.literal('')),
});

export type FamilyMemberData = z.infer<typeof familyMemberSchema> & {
  calculated_age: number;
};

interface AddFamilyMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (member: FamilyMemberData) => void;
  defaultAddress?: string;
}

const AddFamilyMemberDialog: React.FC<AddFamilyMemberDialogProps> = ({
  isOpen,
  onOpenChange,
  onAdd,
  defaultAddress = "",
}) => {
  const form = useForm<z.infer<typeof familyMemberSchema>>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      relation: "Child",
      full_name: "",
      initiated_name: "",
      phone: "",
      address: defaultAddress,
      place_name: "",
      gender: "Male",
      profession_type: "Student",
      profession_other: "",
      chanting_rounds: 0,
      email: "",
    },
  });

  const dobValue = form.watch("dob");
  const relationValue = form.watch("relation");
  const professionType = form.watch("profession_type");

  React.useEffect(() => {
    if (relationValue === "Husband" || relationValue === "Father") form.setValue("gender", "Male");
    if (relationValue === "Wife" || relationValue === "Mother") form.setValue("gender", "Female");
  }, [relationValue, form]);

  const onSubmit = (values: z.infer<typeof familyMemberSchema>) => {
    const calculated_age = values.dob ? differenceInYears(new Date(), values.dob) : 0;
    onAdd({ ...values, calculated_age });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Enter the details for the family member you wish to register for this trip.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="relation"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Relation</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-wrap gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Husband" id="r-husband" />
                        <Label htmlFor="r-husband">Husband</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Wife" id="r-wife" />
                        <Label htmlFor="r-wife">Wife</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Child" id="r-child" />
                        <Label htmlFor="r-child">Child</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Father" id="r-father" />
                        <Label htmlFor="r-father">Father</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Mother" id="r-mother" />
                        <Label htmlFor="r-mother">Mother</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input {...field} type="tel" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <DOBInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chanting_rounds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chanting Rounds</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="profession_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profession</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Profession" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROFESSIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {professionType === "Other" && (
              <FormField
                control={form.control}
                name="profession_other"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Profession</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="w-full">Add to Trip</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFamilyMemberDialog;