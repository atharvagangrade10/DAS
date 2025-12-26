"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
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
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/config/api";
import { Loader2 } from "lucide-react";

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().min(10, "Phone must be 10 digits").max(10, "Phone must be 10 digits"),
});

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const { user, updateUser, token } = useAuth();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      phone: user?.phone || "",
    },
  });

  React.useEffect(() => {
    if (user && isOpen) {
      form.reset({
        full_name: user.full_name,
        phone: user.phone,
      });
    }
  }, [user, isOpen, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof profileSchema>) => {
      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: (data) => {
      updateUser(data);
      toast.success("Profile updated successfully!");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Update failed", { description: error.message });
    },
  });

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
          <DialogDescription>
            Update your account information below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending} className="w-full">
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;