"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import { Loader2, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import { createAccountCheck, createParticipantPublic, setPasswordPublic } from "@/utils/api";
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

const passwordSchema = z.object({
  new_password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

const PublicYatraRegistration = () => {
  const navigate = useNavigate();
  // Steps: 1 (Registration Form), 2 (Set Password)
  const [step, setStep] = React.useState(1);
  const [participantId, setParticipantId] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const targetYatraName = "Maheshwar New Year Trip";

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

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
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
        setParticipantId(response.participant_id);
        setStep(2);
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
        setParticipantId(newParticipant.id);
        setStep(2);
      }
    },
    onError: (error: Error) => {
      toast.error("Process failed", { description: error.message });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (values: z.infer<typeof passwordSchema>) => {
      if (!participantId) throw new Error("Participant ID is missing");
      await setPasswordPublic(participantId, values.new_password);
    },
    onSuccess: () => {
      toast.success("Password set successfully! Please log in.");
      navigate("/login");
    },
    onError: (error: Error) => {
      toast.error("Failed to set password", { description: error.message });
    },
  });

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Registration</h1>
            <p className="text-gray-600 text-lg">{targetYatraName}</p>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Participant Information</CardTitle>
              <CardDescription>
                Fill in your details to get started with the trip registration.
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
                          <FormControl><Input {...field} placeholder="Full Name" /></FormControl>
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
                          <FormControl><Input {...field} /></FormControl>
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
                        <FormControl><Input {...field} type="tel" placeholder="e.g. 9876543210" /></FormControl>
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
                        <FormControl><Input {...field} /></FormControl>
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
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full text-lg py-6" disabled={accountMutation.isPending}>
                    {accountMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Confirm and View Trip Details"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Set Password
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-3xl font-extrabold text-gray-900 mt-4">Secure Your Account</h1>
          <p className="text-gray-600 mt-2">Create a password to access your dashboard later.</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Set Password</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit((v) => passwordMutation.mutate(v))} className="space-y-6">
                {/* 
                   Browser autofill often looks for a username field before the password field.
                   By providing a hidden but present field, we guide it correctly.
                */}
                <div style={{ display: 'none' }}>
                  <input type="text" name="username" autoComplete="username" value={form.getValues("phone")} readOnly />
                </div>
                
                <FormField
                  control={passwordForm.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="••••••••"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Set Password and Login"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicYatraRegistration;