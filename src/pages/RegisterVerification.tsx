"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowRight, Smartphone } from "lucide-react";
import { createAccountCheck } from "@/utils/api";

const verificationSchema = z.object({
  phone: z.string().min(1, "Phone number is required").regex(/^\d{10}$/, "Phone number must be 10 digits"),
});

const RegisterVerification = () => {
  const navigate = useNavigate();
  const [isCheckingPhone, setIsCheckingPhone] = React.useState(false);

  const form = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      phone: "",
    },
  });

  const handlePhoneCheck = async (values: z.infer<typeof verificationSchema>) => {
    setIsCheckingPhone(true);
    try {
      const response = await createAccountCheck(values.phone);

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
        navigate(`/register/full?phone=${values.phone}`);
      }
    } catch (error: any) {
      toast.error("Verification failed", { description: error.message });
    } finally {
      setIsCheckingPhone(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/Logo.png" alt="Logo" className="h-24 w-24" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">New Account</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Verify your mobile number to get started.</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Verify Your Mobile</CardTitle>
            <CardDescription>Enter your 10-digit phone number to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handlePhoneCheck)} className="space-y-6">
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
                <Button type="submit" className="w-full text-lg py-6" disabled={isCheckingPhone}>
                  {isCheckingPhone ? <Loader2 className="animate-spin mr-2" /> : "Next"}
                  {!isCheckingPhone && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
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

export default RegisterVerification;