"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
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
import { parseISO, isValid, differenceInYears, format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, User as UserIcon } from "lucide-react";
import DOBInput from "@/components/DOBInput";

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

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  initiated_name: z.string().optional().or(z.literal('')),
  phone: z.string()
    .min(10, "Phone must be 10 digits")
    .max(10, "Phone must be 10 digits"),
  address: z.string().optional(),
  place_name: z.string().optional().or(z.literal('')),
  age: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().int().min(0, "Age cannot be negative").nullable().optional(),
  ),
  dob: z.date().nullable().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  profession_type: z.string().optional(),
  profession_other: z.string().optional(),
  chanting_rounds: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().int().min(0, "Chanting rounds cannot be negative").nullable().optional(),
  ),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
});

const ProfilePage = () => {
  const { user, updateUser, token } = useAuth();

  const getInitialDob = (dobString: string | null | undefined) => {
    if (!dobString) return null;
    const date = parseISO(dobString);
    return isValid(date) ? date : null;
  };

  const getProfessionInitialValues = (prof: string | null | undefined) => {
    if (!prof) return { type: "Student", other: "" };
    if (PROFESSIONS.includes(prof)) return { type: prof, other: "" };
    return { type: "Other", other: prof };
  };

  const profInit = getProfessionInitialValues(user?.profession);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      initiated_name: user?.initiated_name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      place_name: user?.place_name || "",
      age: user?.age || undefined,
      dob: getInitialDob(user?.dob),
      gender: (user?.gender as "Male" | "Female" | "Other") || "Male",
      profession_type: profInit.type,
      profession_other: profInit.other,
      chanting_rounds: user?.chanting_rounds || undefined,
      email: user?.email || "",
    },
  });

  const dobValue = form.watch("dob");
  const professionType = form.watch("profession_type");

  React.useEffect(() => {
    if (dobValue) {
      const age = differenceInYears(new Date(), dobValue);
      form.setValue("age", age, { shouldValidate: true });
    }
  }, [dobValue, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof profileSchema>) => {
      const profession = values.profession_type === "Other" 
        ? values.profession_other 
        : values.profession_type;

      const payload = {
        full_name: values.full_name,
        initiated_name: values.initiated_name || null,
        phone: values.phone,
        address: values.address,
        place_name: values.place_name || null,
        age: values.age,
        dob: values.dob ? format(values.dob, "yyyy-MM-dd") : null,
        gender: values.gender,
        email: values.email,
        profession: profession || null,
        chanting_rounds: values.chanting_rounds,
      };
      
      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: (data) => {
      updateUser(data);
      toast.success("Profile updated successfully!");
    },
    onError: (error: Error) => {
      toast.error("Update failed", { description: error.message });
    },
  });

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    mutation.mutate(values);
  };

  return (
    <div className="container mx-auto p-6 sm:p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
          <UserIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Profile</h1>
          <p className="text-gray-500">Manage your account settings and personal information.</p>
        </div>
      </div>

      <Card className="shadow-lg border-primary/5">
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>Update your profile information here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Full Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="initiated_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initiated Name (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Arjuna Dasa" />
                      </FormControl>
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
                      <FormControl>
                        <Input {...field} type="tel" placeholder="10 digit number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age (Calculated)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            readOnly
                            className="bg-muted cursor-not-allowed"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
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
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Professional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="profession_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profession</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select profession" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROFESSIONS.map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
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
                          <FormControl>
                            <Input {...field} placeholder="Enter your profession" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="place_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workplace / Institution</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Where do you work/study?" />
                        </FormControl>
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
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                            min="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Residential address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6 border-t flex justify-end">
                <Button type="submit" disabled={mutation.isPending} className="w-full md:w-auto px-8">
                  {mutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;