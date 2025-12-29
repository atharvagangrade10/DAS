"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import PhotoUpload from "@/components/PhotoUpload";
import { Participant } from "@/types/participant";

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
  email: z.string().email("Invalid email address").min(1, "Email is required"), // Made mandatory
  profile_photo_url: z.string().nullable().optional(),
});

const ProfilePage = () => {
  const { user, updateUser, token } = useAuth();

  // Fetch participant details directly using user_id as participant_id
  const { data: participantData, isLoading: isFetching } = useQuery<Participant, Error>({
    queryKey: ["participant", user?.user_id],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/participants/${user?.user_id}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to find participant record");
      return response.json();
    },
    enabled: !!user?.user_id && !!token,
  });

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

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      initiated_name: "",
      phone: "",
      address: "",
      place_name: "",
      age: undefined,
      dob: null,
      gender: "Male",
      profession_type: "Student",
      profession_other: "",
      chanting_rounds: undefined,
      email: "",
      profile_photo_url: null,
    },
  });

  React.useEffect(() => {
    if (participantData) {
      const profInit = getProfessionInitialValues(participantData.profession);
      form.reset({
        full_name: participantData.full_name,
        initiated_name: participantData.initiated_name || "",
        phone: participantData.phone || "",
        address: participantData.address || "",
        place_name: participantData.place_name || "",
        age: participantData.age || undefined,
        dob: getInitialDob(participantData.dob),
        gender: (participantData.gender as "Male" | "Female" | "Other") || "Male",
        profession_type: profInit.type,
        profession_other: profInit.other,
        chanting_rounds: participantData.chanting_rounds || undefined,
        email: participantData.email, // Email is now mandatory
        profile_photo_url: participantData.profile_photo_url || null,
      });
    }
  }, [participantData, form]);

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
      if (!user?.user_id) throw new Error("User ID not found.");

      const profession = values.profession_type === "Other" 
        ? values.profession_other 
        : values.profession_type;

      const payload = {
        participant_id: user.user_id, // Include participant_id in the body
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
        devotee_friend: participantData?.devotee_friend_name || "None",
        profile_photo_url: values.profile_photo_url || null,
      };
      
      const response = await fetch(`${API_BASE_URL}/participants/${user.user_id}`, {
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
      updateUser({ ...user!, ...data });
      toast.success("Profile updated successfully!");
    },
    onError: (error: Error) => {
      toast.error("Update failed", { description: error.message });
    },
  });

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    mutation.mutate(values);
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your profile record...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 sm:p-8 max-w-2xl">
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
              <div className="flex flex-col items-center">
                <FormField
                  control={form.control}
                  name="profile_photo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PhotoUpload 
                          value={field.value} 
                          onChange={field.onChange} 
                          participantId={user?.user_id} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
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
                    <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="10 digit number" readOnly className="bg-muted cursor-not-allowed" />
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
                    <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <DOBInput value={field.value} onChange={field.onChange} label={<>Date of Birth <span className="text-red-500">*</span></> as any} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      <FormLabel>Gender <span className="text-red-500">*</span></FormLabel>
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

              <div className="space-y-6 pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Professional Details</h3>
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
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Residential address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6 border-t flex justify-end">
                <Button type="submit" disabled={mutation.isPending} className="w-full">
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