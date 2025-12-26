"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ResetPasswordRequest } from '@/types/auth';

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  new_password: z.string().min(6, "New password must be at least 6 characters"),
  confirm_password: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

const ResetPasswordPage = () => {
  const { resetPassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialToken = searchParams.get('token') || '';

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: initialToken,
      new_password: "",
      confirm_password: "",
    },
  });

  const { isSubmitting } = form.formState;

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    const resetData: ResetPasswordRequest = {
      token: values.token,
      new_password: values.new_password,
    };
    try {
      await resetPassword(resetData);
      navigate('/login');
    } catch (e) {
      // Error handled by useAuth context
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Reset Password</CardTitle>
          <CardDescription>Enter the reset token and your new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reset Token</FormLabel>
                    <FormControl>
                      <Input placeholder="Paste your token here" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;