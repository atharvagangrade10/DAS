"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/config/api";
import { Loader2, AlertTriangle } from "lucide-react";
import DOBInput from "./DOBInput";
import PhotoUpload from "./PhotoUpload";

const mandatorySchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  address: z.string().min(1, "Residential address is required"),
  dob: z.date({ required_error: "Date of birth is required" }),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Gender is required" }),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  profile_photo_url: z.string().min(1, "Profile photo is required"),
});

interface CompleteProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CompleteProfileDialog: React.FC<CompleteProfileDialogProps> = ({ isOpen, onOpenChange }) => {
  const { user, token, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof mandatorySchema>>({
    resolver: zodResolver(mandatorySchema),
    defaultValues: {
      full_name: user?.full_name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      dob: user?.dob && isValid(parseISO(user.dob)) ? parseISO(user.dob) : undefined,
      gender: (user?.gender as any) || "Male",
      email: user?.email || "",
      profile_photo_url: user?.profile_photo_url || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof mandatorySchema>) => {
      if (!user?.user_id) throw new Error("User ID not found.");

      const payload = {
        ...user,
        full_name: values.full_name,
        phone: values.phone,
        address: values.address,
        dob: format(values.dob, "yyyy-MM-dd"),
        gender: values.gender,
        email: values.email,
        profile_photo_url: values.profile_photo_url,
        participant_id: user.user_id,
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
      toast.success("Profile completed successfully!");
      
      // Invalidate the query used by Index.tsx to check profile completeness
      queryClient.invalidateQueries({ queryKey: ["latestParticipantDetails", user?.user_id] });
      
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Update failed", { description: error.message });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(val) => {
        if (!val) {
            toast.warning("Please complete your profile details to continue.");
            return;
        }
        onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Complete Your Profile</DialogTitle>
          </div>
          <DialogDescription>
            Mandatory details including your profile photo are missing. Please provide them to continue.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4 py-4">
            <div className="flex flex-col items-center mb-4">
              <FormField
                control={form.control}
                name="profile_photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PhotoUpload 
                        value={field.value} 
                        onChange={field.onChange} 
                        label="Profile Photo *"
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
                    <Input {...field} />
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
                    <Input {...field} type="email" />
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
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Residential Address <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save and Continue
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteProfileDialog;