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
import { Loader2, ArrowRight, Smartphone } from "lucide-react";
import { createAccountCheck, createParticipantPublic } from "@/utils/api";
import DOBInput from "@/components/DOBInput";
import PhotoUpload from "@/components/PhotoUpload";
import { Participant } from "@/types/participant";

const PROFESSIONS = ["Student", "Employee", "Teacher", "Doctor", "Business", "Housewife", "Retired", "Other"];

const registrationSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  initiated_name: z.string().optional().or(z.literal('')),
  phone: z.string().min(1, "Phone number is required").regex(/^\d{10}$/, "Phone number must be 10 digits"),
  address: z.string().min(1, "Address is required"),
  place_name: z.string().optional().or(z.literal('')),
  age: z.preprocess((val) => (val === "" ? null : Number(val)), z.number().int().min(0).nullable()),
  dob: z.date({ required_error: "Date of birth is required" }),
  gender: z.enum(["Male", "Female", "Other"]),
  profession_type: z.string().optional(),
  profession_other: z.string().optional(),
  chanting_rounds: z.preprocess((val) => (val === "" ? null : Number(val)), z.number().int().min(0).nullable()),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showFullForm, setShowFullForm] = React.useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = React.useState(false);

  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
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

  const handlePhoneCheck = async () => {
    const phone = form.getValues("phone");
    if (!/^\d{10}$/.test(phone)) {
      form.setError("phone", { message: "Phone number must be 10 digits" });
      return;
    }

    setIsCheckingPhone(true);
    try {
      const response = await createAccountCheck(phone);

      if (response.status === "Login") {
        toast.info("Account already exists. Please log in.");
        navigate("/login");
        return;
      }

      if (response.status === "SetPassword") {
        navigate(`/public/set-password?participantId=${response.participant_id}`);
        return;
      }

      if (response.status === "Register") {
        // Explicitly set the value to ensure it's preserved in the form state
        form.setValue("phone", phone);
        setShowFullForm(true);
      }
    } catch (error: any) {
      toast.error("Verification failed", { description: error.message });
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const accountMutation = useMutation({
    mutationFn: async (values: z.infer<typeof registrationSchema>) => {
      const profession = values.profession_type === "Other" ? values.profession_other : values.profession_type;
      const participantData = {
        ...values,
        full_name: `${values.first_name} ${values.last_name}`,
        initiated_name: values.initiated_name || null,
        place_name: values.place_name || null,
        profession: profession || null,
        dob: values.dob ? format(values.dob, "yyyy-MM-dd") : null,
        date_joined: format(new Date(), "yyyy-MM-dd"),
        devotee_friend_name: "None",
      };
      const newParticipant = await createParticipantPublic(participantData);
      navigate(`/public/set-password?participantId=${newParticipant.id}`);
    },
    onError: (error: Error) => {
      toast.error("Registration failed", { description: error.message });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/Logo.png" alt="Logo" className="h-24 w-24" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">New Account Registration</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Create your participant profile to access DAS features.</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{showFullForm ? "Complete Your Profile" : "Verify Your Mobile"}</CardTitle>
            <CardDescription>
              {showFullForm 
                ? "Please fill in the remaining details to finish your registration." 
                : "Enter your 10-digit phone number to get started."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => accountMutation.mutate(v))} className="space-y-6">
                {!showFullForm ? (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Smartphone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="tel" 
                                autoComplete="tel"
                                placeholder="e.g. 9876543210" 
                                className="pl-10 text-lg py-6" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" onClick={handlePhoneCheck} className="w-full text-lg py-6" disabled={isCheckingPhone}>
                      {isCheckingPhone ? <Loader2 className="animate-spin mr-2" /> : "Next"}
                      {!isCheckingPhone && <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="First Name" autoComplete="given-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Last Name" autoComplete="family-name" />
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
                          <FormControl><Input {...field} autoComplete="off" /></FormControl>
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
                            <Input {...field} type="tel" placeholder="Phone Number" autoComplete="tel" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                      name="profession_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profession</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
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
                          <FormLabel>Residential Address <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} autoComplete="street-address" />
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
                          <FormControl><Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
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
                            <Input {...field} type="email" autoComplete="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full text-lg py-6" disabled={accountMutation.isPending}>
                      {accountMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Register and Set Password"}
                      {!accountMutation.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Log In
          </a>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;