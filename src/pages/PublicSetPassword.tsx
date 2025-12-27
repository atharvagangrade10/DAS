"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { setPasswordPublic } from "@/utils/api";

const passwordSchema = z.object({
    sec_p: z.string().min(6, "Password must be at least 6 characters"),
    sec_v: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.sec_p === data.sec_v, {
    message: "Passwords do not match",
    path: ["sec_v"],
});

const PublicSetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    // Get participantId from navigation state
    const participantId = location.state?.participantId;

    React.useEffect(() => {
        if (!participantId) {
            toast.error("Invalid session. Please register again.");
            navigate("/yatra/maheswar-yatra-new-year");
        }
    }, [participantId, navigate]);

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            sec_p: "",
            sec_v: "",
        },
    });

    const passwordMutation = useMutation({
        mutationFn: async (values: z.infer<typeof passwordSchema>) => {
            if (!participantId) throw new Error("Participant ID is missing");
            await setPasswordPublic(participantId, values.sec_p);
        },
        onSuccess: () => {
            toast.success("Password set successfully! Please log in.");
            navigate("/login");
        },
        onError: (error: Error) => {
            toast.error("Failed to set password", { description: error.message });
        },
    });

    if (!participantId) return null;

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
                            <form
                                onSubmit={passwordForm.handleSubmit((v) => passwordMutation.mutate(v))}
                                className="space-y-6"
                            >
                                <FormField
                                    control={passwordForm.control}
                                    name="sec_p"
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
                                    name="sec_v"
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

export default PublicSetPassword;
