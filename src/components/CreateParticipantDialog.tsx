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
import { Participant } from "@/types/participant";
import { API_BASE_URL } from "@/config/api";

interface DevoteeFriend {
  id: string;
  name: string;
}

interface CreateParticipantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreationSuccess: (newParticipant: Participant) => void;
}

const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val), {
      message: "Phone number must be 10 digits",
    }),
  address: z.string().optional(),
  age: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().int().min(0, "Age cannot be negative").nullable().optional(),
  ),
  devotee_friend: z.string().optional(), // This will be the name of the devotee friend
  gender: z.enum(["Male", "Female", "Other"], {
    required_error: "Gender is required",
  }),
  chanting_rounds: z.preprocess( // New field
    (val) => (val === "" ? null : Number(val)),
    z.number().int().min(0, "Chanting rounds cannot be negative").nullable().optional(),
  ),
});

const fetchDevoteeFriends = async (): Promise<DevoteeFriend[]> => {
  const response = await fetch(`${API_BASE_URL}/register/devoteefriends`);
  if (!response.ok) {
    throw new Error("Failed to fetch devotee friends");
  }
  return response.json();
};

const createParticipant = async (
  data: z.infer<typeof formSchema>,
): Promise<Participant> => {
  const response = await fetch(`${API_BASE_URL}/register/participant`, { // Updated endpoint
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to create participant");
  }
  return response.json();
};

const CreateParticipantDialog: React.FC<CreateParticipantDialogProps> = ({
  isOpen,
  onOpenChange,
  onCreationSuccess,
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
      full_name: "",
      phone: "",
      address: "",
      age: undefined,
      devotee_friend: "None",
      gender: "Male", // Default gender
      chanting_rounds: undefined, // Default for new field
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => createParticipant(data),
    onSuccess: (data) => {
      toast.success("Participant created successfully!");
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["participantsSearch"] });
      queryClient.invalidateQueries({ queryKey: ["allParticipants"] }); // Invalidate all participants list
      queryClient.invalidateQueries({ queryKey: ["allAttendedPrograms"] }); // Invalidate attended programs too
      onOpenChange(false);
      form.reset();
      onCreationSuccess(data); // Pass the new participant data back
    },
    onError: (error: Error) => {
      toast.error("Failed to create participant", {
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
          <DialogTitle>Add New Participant</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new participant.
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
                    <Input
                      type="number"
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
            <FormField // New FormField for chanting_rounds
              control={form.control}
              name="chanting_rounds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chanting Rounds</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      min="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Adding..." : "Add Participant"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateParticipantDialog;