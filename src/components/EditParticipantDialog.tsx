"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";
import { Participant } from "@/types/participant"; // Import Participant type

interface DevoteeFriend {
  id: string;
  name: string;
}

interface EditParticipantDialogProps {
  participant: Participant;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateSuccess?: (updatedParticipant: Participant) => void; // New prop
}

const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  age: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().int().min(0, "Age cannot be negative").nullable().optional(),
  ),
  devotee_friend: z.string().optional(), // This will be the name of the devotee friend
  gender: z.enum(["Male", "Female", "Other"]).optional(),
});

const fetchDevoteeFriends = async (): Promise<DevoteeFriend[]> => {
  const response = await fetch("https://das-backend-o43a.onrender.com/register/devoteefriends");
  if (!response.ok) {
    throw new Error("Failed to fetch devotee friends");
  }
  return response.json();
};

const updateParticipant = async (
  participantId: string,
  data: z.infer<typeof formSchema>,
): Promise<Participant> => { // Specify return type
  const response = await fetch(
    `https://das-backend-o43a.onrender.com/participants/${participantId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to update participant");
  }
  return response.json();
};

const EditParticipantDialog: React.FC<EditParticipantDialogProps> = ({
  participant,
  isOpen,
  onOpenChange,
  onUpdateSuccess, // Destructure new prop
}) => {
  const queryClient = useQueryClient();

  const { data: devoteeFriends, isLoading: isLoadingFriends } = useQuery<
    DevoteeFriend[],
    Error
  >({
    queryKey: ["devoteeFriends"],
    queryFn: fetchDevoteeFriends,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: participant.full_name,
      phone: participant.phone || "",
      address: participant.address || "",
      age: participant.age || undefined,
      devotee_friend: participant.devotee_friend_name || "None",
      gender: (participant.gender as "Male" | "Female" | "Other") || "Male",
    },
  });

  React.useEffect(() => {
    if (participant) {
      form.reset({
        full_name: participant.full_name,
        phone: participant.phone || "",
        address: participant.address || "",
        age: participant.age || undefined,
        devotee_friend: participant.devotee_friend_name || "None",
        gender: (participant.gender as "Male" | "Female" | "Other") || "Male",
      });
    }
  }, [participant, form]);

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) =>
      updateParticipant(participant.id, data),
    onSuccess: (data) => { // data here is the updated participant
      toast.success("Participant updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["participantsSearch"] }); // Invalidate search queries
      onOpenChange(false); // Close dialog on success
      if (onUpdateSuccess) {
        onUpdateSuccess(data); // Call the success callback with updated data
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to update participant", {
        description: error.message,
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Participant</DialogTitle>
          <DialogDescription>
            Make changes to {participant.full_name}'s profile here. Click save
            when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
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
            <FormField
              control={form.control}
              name="devotee_friend"
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
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditParticipantDialog;