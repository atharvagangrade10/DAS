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
import { Link, useNavigate } from 'react-router-dom';
import { RegisterRequest } from '@/types/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { fetchDevoteeFriends } from '@/utils/api';

interface DevoteeFriend {
  id: string;
  name: string;
}

const registerSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().min(10, "Phone must be 10 digits").max(10, "Phone must be 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  address: z.string().optional(),
  age: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().int().min(0, "Age cannot be negative").nullable().optional(),
  ),
  gender: z.enum(["Male", "Female", "Other"], {
    required_error: "Gender is required",
  }),
  devotee_friend_name: z.string().optional(),
  chanting_rounds: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().int().min(0, "Chanting rounds cannot be negative").nullable().optional(),
  ),
});

const RegisterPage = () => {
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: devoteeFriends, isLoading: isLoadingFriends } = useQuery<
    DevoteeFriend[],
    Error
  >({
    queryKey: ["devoteeFriends"],
    queryFn: fetchDevoteeFriends,
  });

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      password: "",
      email: "",
      address: "",
      age: undefined,
      gender: "Male",
      devotee_friend_name: "None",
      chanting_rounds: undefined,
    },
  });

  const { isSubmitting } = form.formState;

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    const registerData: RegisterRequest = {
      ...values,
      age: values.age === null ? 0 : values.age,
      chanting_rounds: values.chanting_rounds === null ? 0 : values.chanting_rounds,
      email: values.email || "",
      address: values.address || "",
      devotee_friend_name: values.devotee_friend_name || "None",
    };
    
    try {
      await registerUser(registerData);
      navigate('/login');
    } catch (e) {
      // Error handled by useAuth context
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>Register a new participant account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Full Name" {...field} />
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
                    <FormLabel>Phone Number (10 digits)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 7649090511" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
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
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 25"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
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
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="devotee_friend_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Devotee Friend</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingFriends}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a devotee friend" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          {devoteeFriends?.map((friend) => (
                            <SelectItem key={friend.id} value={friend.name}>
                              {friend.name}
                            </SelectItem>
                          ))}
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
                      <FormLabel>Chanting Rounds (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 16"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;