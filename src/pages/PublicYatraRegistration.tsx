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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, differenceInYears } from "date-fns";
import { toast } from "sonner";
import { Loader2, ArrowRight, CheckCircle2, MapPin, Calendar, IndianRupee, Lock } from "lucide-react";
import { searchParticipantPublic, upsertParticipantPublic, fetchYatrasPublic } from "@/utils/api";
import DOBInput from "@/components/DOBInput";
import { Yatra } from "@/types/yatra";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/config/api";

const PROFESSIONS = ["Student", "Employee", "Teacher", "Doctor", "Business", "Housewife", "Retired", "Other"];

const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  initiated_name: z.string().optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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

const PublicYatraRegistration = () => {
  const [step, setStep] = React.useState(1);
  const targetYatraName = "Maheshwar New Year Trip";

  const { data: yatras, isLoading: isLoadingYatra } = useQuery<Yatra[]>({
    queryKey: ["yatrasPublic"],
    queryFn: fetchYatrasPublic,
  });

  const selectedYatra = yatras?.find(y => y.name === targetYatraName);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      initiated_name: "",
      phone: "",
      password: "",
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

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // 1. Check if participant exists
      const existing = await searchParticipantPublic(values.phone);
      const matched = existing.find(p => p.phone === values.phone);
      
      const profession = values.profession_type === "Other" ? values.profession_other : values.profession_type;
      
      const payload = {
        ...values,
        initiated_name: values.initiated_name || null,
        place_name: values.place_name || null,
        dob: values.dob ? format(values.dob, "yyyy-MM-dd") : null,
        profession: profession || null,
        devotee_friend: "None",
      };

      if (matched) {
        // 2. If exists, attempt login to get token
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: values.full_name, // Backend might require full_name for matching
            phone: values.phone,
            password: values.password,
          }),
        });

        if (!loginResponse.ok) {
          const errorData = await loginResponse.json();
          throw new Error(errorData.detail || "Authentication failed. Please check your name, phone, and password.");
        }

        const authData = await loginResponse.json();
        const token = authData.access_token;

        // 3. Update with token
        const updateResponse = await fetch(`${API_BASE_URL}/participants/${matched.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.detail || "Failed to update participant details.");
        }
        return updateResponse.json();
      } else {
        // 4. Create new participant
        return await upsertParticipantPublic(payload);
      }
    },
    onSuccess: () => {
      setStep(2);
      toast.success("Registration processed successfully!");
    },
    onError: (error: Error) => {
      toast.error("Error processing registration", { description: error.message });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

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
                If you have registered before, please use your existing phone and password to update your details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input {...field} placeholder="Full Name (as registered)" /></FormControl>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (10 digits)</FormLabel>
                          <FormControl><Input {...field} type="tel" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input {...field} type="password" placeholder="••••••" />
                              <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
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

                  <Button type="submit" className="w-full text-lg py-6" disabled={mutation.isPending}>
                    {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : "Confirm and View Trip Details"}
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-green-100 flex flex-col items-center text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
          <p className="text-gray-600 mb-8">Your information has been successfully verified and updated.</p>
          
          <div className="w-full space-y-6 text-left">
            <h3 className="text-xl font-bold flex items-center gap-2 text-primary border-b pb-2">
              <MapPin className="h-5 w-5" /> Trip Details: {targetYatraName}
            </h3>
            
            {isLoadingYatra ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : selectedYatra ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-lg">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>
                    {format(new Date(selectedYatra.date_start), "PPP")} - {format(new Date(selectedYatra.date_end), "PPP")}
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" /> Registration Fees:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedYatra.registration_fees).map(([category, amount]) => (
                      <Badge key={category} variant="outline" className="text-sm px-3 py-1 bg-primary/5 border-primary/20">
                        {category}: ₹{amount}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
                  <strong>Note:</strong> Please contact your Devotee Friend or the organizing committee to complete your payment and confirm your seat.
                </div>
              </div>
            ) : (
              <p className="text-red-500 font-medium">Trip details currently unavailable. Please check back later.</p>
            )}
          </div>

          <Button variant="outline" className="mt-10" onClick={() => window.location.reload()}>
            Back to Start
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicYatraRegistration;