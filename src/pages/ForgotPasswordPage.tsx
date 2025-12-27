"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { forgotPassword } from '@/utils/api';

const forgotPasswordSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
});

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: { phone: string }) => forgotPassword(data.phone),
    onSuccess: (data) => {
      toast.success("Password reset initiated!", {
        description: "Please check your console for the reset token (simulated).",
      });
      console.log("Password Reset Token (SIMULATED):", data.token);
      
      // In a real app, the token would be sent via email/SMS. 
      // Here we navigate directly, passing the token (simulated flow).
      // NOTE: The backend is expected to handle token delivery. We simulate receiving it here.
      navigate(`/reset-password?token=${data.token}`);
    },
    onError: (error: Error) => {
      toast.error("Reset failed", { description: error.message });
    },
  });

  const onSubmit = (values: z.infer<typeof forgotPasswordSchema>) => {
    mutation.mutate(values);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Lock className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-3xl font-bold">Forgot Password</CardTitle>
          <CardDescription>Enter your registered 10-digit phone number to receive a password reset token.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 9876543210" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Request Reset Token"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <div className="p-4 border-t text-center text-sm bg-gray-50 dark:bg-gray-800 rounded-b-xl">
          Remember your password?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;