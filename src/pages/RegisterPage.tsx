"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, differenceInYears } from "date-fns";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { createAccountCheck, createParticipantPublic } from "@/utils/api";
import DOBInput from "@/components/DOBInput";

const PROFESSIONS = ["Student", "Employee", "Teacher", "Doctor", "Business", "Housewife", "Retired", "Other"];

const registrationSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  initiated_name: z.string().optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  address: z.string().min(1, "Address is required"),
  place_name: z.string().optional().or(z.literal('')),
  age: z.preprocess((val) => (val === "" ? null : Number(val)), z.number().int().min(0).nullable()),
  dob: z.date({ required_error: "Date of birth is required" }),
  gender: z.enum(["Male", "Female", "Other"]),
  profession_type: z.string().optional(),
  profession_other: z.string().optional(),
  chanting_rounds: z.preprocess((val) => (val === "" ? null : Number(val)), z.number().int().min(0).nullable()),
  email: z.string().email().optional().or(z.literal('')),
});

const RegisterPage = () => {
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      full_name: "",
      initiated_name: "",
      phone: "",
      address: "",
      place_name: "",
      age: undefined,
      dob: undefined,
      gender: "Male",
      profession_type: "Student",
      profession_other: "",
      chanting_rounds: 0,
      email: "",
    },
  });

  const dobValue = form.watch("dob");
  const professionType = form.watch("profession_type");

  React.useEffect(() => {
    if (dobValue) {
      const age = differenceInYears(new Date(), dobValue);
      form.setValue("age", age);
    }
  }, [dobValue, form]);

  const accountMutation = useMutation({
    mutationFn: async (values: z.infer<typeof registrationSchema>) => {
      const response = await createAccountCheck(values.phone);

      if (response.status === "Login") {
        toast.info("Account already exists. Please log in.");
        navigate("/login");
        return;
      }

      if (response.status === "SetPassword") {
        navigate("/public/set-password", { state: { participantId: response.participant_id } });
        return;
      }

      if (response.status === "Register") {
        const profession = values.profession_type === "Other" ? values.profession_other : values.profession_type;
        const participantData = {
          ...values,
          initiated_name: values.initiated_name || null,
          place_name: values.place_name || null,
          profession: profession || null,
          dob: values.dob ? format(values.dob, "yyyy-MM-dd") : null,
          date_joined: format(new Date(), "yyyy-MM-dd"),
          devotee_friend_name: "None",
        };
        const newParticipant = await createParticipantPublic(participantData);
        navigate("/public/set-password", { state: { participantId: newParticipant.id } });
      }
    },
    onError: (error: Error) => {
      toast.error("Process failed", { description: error.message });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-12 px-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">New Account Registration</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Create your participant profile to access DAS features.</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Participant Information</CardTitle>
            <CardDescription>
              Fill in your details. Your phone number will be your unique identifier.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => accountMutation.mutate(v))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input {...field} placeholder="Full Name" autoComplete="name" /></FormControl>
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
                        <FormControl><Input {...field} autoComplete="additional-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (10 digits)</FormLabel>
                      <FormControl><Input {...field} type="tel" placeholder="e.g. 9876543210" autoComplete="tel" /></FormControl>
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
                          <DOBInput value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
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
                        <FormControl><Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
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
                  name="place_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workplace / Institution</FormLabel>
                      <FormControl><Input {...field} autoComplete="organization" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Residential Address</FormLabel>
                      <FormControl><Input {...field} autoComplete="street-address" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl><Input {...field} type="email" autoComplete="email" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full text-lg py-6" disabled={accountMutation.isPending}>
                  {accountMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Register and Set Password"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;