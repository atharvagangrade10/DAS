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
import { parseISO, isValid, differenceInYears, format } from "date-fns";
import { toast } from "sonner";
import { Participant } from "@/types/participant";
import { API_BASE_URL } from "@/config/api";
import DOBInput from "./DOBInput";

interface DevoteeFriend {
  id: string;
  name: string;
}

interface EditParticipantDialogProps {
  participant: Participant;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateSuccess?: (updatedParticipant: Participant) => void;
}

const PROFESSIONS = [
  "Student",
  "Employee",
  "Teacher",
  "Doctor",
  "Business",
  "Housewife",
  "Retired",
  "Other",
];

const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  initiated_name: z.string().optional().or(z.literal('')),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val), {
      message: "Phone number must be 10 digits",
    }),
  address: z.string().optional(),
  place_name: z.string().optional().or(z.literal('')),
  age: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().int().min(0, "Age cannot be negative").nullable().optional(),
  ),
  dob: z.date().nullable().optional(),
  devotee_friend: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  profession_type: z.string().optional(),
  profession_other: z.string().optional(),
  chanting_rounds: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().int().min(0, "Chanting rounds cannot be negative").nullable().optional(),
  ),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
});

const getAuthHeaders = () => {
  const token = localStorage.getItem('das_auth_token');
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const fetchDevoteeFriends = async (): Promise<DevoteeFriend[]> => {
  const response = await fetch(`${API_BASE_URL}/register/devoteefriends`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch devotee friends' }));
    throw new Error(errorData.detail || "Failed to fetch devotee friends");
  }
  return response.json();
};

const updateParticipant = async (
  participantId: string,
  data: any,
): Promise<Participant> => {
  const response = await fetch(
    `${API_BASE_URL}/participants/${participantId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to update participant' }));
    throw new Error(errorData.detail || "Failed to update participant");
  }
  return response.json();
};

const EditParticipantDialog: React.FC<EditParticipantDialogProps> = ({
  participant,
  isOpen,
  onOpenChange,
  onUpdateSuccess,
}) => {
  const queryClient = useQueryClient();

  const { data: devoteeFriends, isLoading: isLoadingFriends } = useQuery<
    DevoteeFriend[],
    Error
  >({
    queryKey: ["devoteeFriends"],
    queryFn: fetchDevoteeFriends,
  });

  const getInitialDob = (dobString: string | null | undefined) => {
    if (!dobString) return null;
    const date = parseISO(dobString);
    return isValid(date) ? date : null;
  };

  const getProfessionInitialValues = (prof: string | null | undefined) => {
    if (!prof) return { type: "Student", other: "" };
    if (PROFESSIONS.includes(prof)) return { type: prof, other: "" };
    return { type: "Other", other: prof };
  };

  const profInit = getProfessionInitialValues(participant.profession);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: participant.full_name,
      initiated_name: participant.initiated_name || "",
      phone: participant.phone || "",
      address: participant.address || "",
      place_name: participant.place_name || "",
      age: participant.age || undefined,
      dob: getInitialDob(participant.dob),
      devotee_friend: participant.devotee_friend_name || "None",
      gender: (participant.gender as "Male" | "Female" | "Other") || "Male",
      profession_type: profInit.type,
      profession_other: profInit.other,
      chanting_rounds: participant.chanting_rounds || undefined,
      email: participant.email || "",
    },
  });

  const dobValue = form.watch("dob");
  const professionType = form.watch("profession_type");

  React.useEffect(() => {
    if (dobValue) {
      const age = differenceInYears(new Date(), dobValue);
      form.setValue("age", age, { shouldValidate: true });
    }
  }, [dobValue, form]);

  React.useEffect(() => {
    if (participant) {
      const pInit = getProfessionInitialValues(participant.profession);
      form.reset({
        full_name: participant.full_name,
        initiated_name: participant.initiated_name || "",
        phone: participant.phone || "",
        address: participant.address || "",
        place_name: participant.place_name || "",
        age: participant.age || undefined,
        dob: getInitialDob(participant.dob),
        devotee_friend: participant.devotee_friend_name || "None",
        gender: (participant.gender as "Male" | "Female" | "Other") || "Male",
        profession_type: pInit.type,
        profession_other: pInit.other,
        chanting_rounds: participant.chanting_rounds || undefined,
        email: participant.email || "",
      });
    }
  }, [participant, form]);

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => {
      const profession = values.profession_type === "Other" 
        ? values.profession_other 
        : values.profession_type;

      const payload = {
        full_name: values.full_name,
        initiated_name: values.initiated_name || null,
        phone: values.phone,
        address: values.address,
        place_name: values.place_name || null,
        age: values.age,
        dob: values.dob ? format(values.dob, "yyyy-MM-dd") : null,
        gender: values.gender,
        email: values.email,
        profession: profession || null,
        devotee_friend: values.devotee_friend,
        chanting_rounds: values.chanting_rounds,
      };
      return updateParticipant(participant.id, payload);
    },
    onSuccess: (data) => {
      toast.success("Participant updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["participantsSearch"] });
      queryClient.invalidateQueries({ queryKey: ["allParticipants"] });
      onOpenChange(false);
      if (onUpdateSuccess) {
        onUpdateSuccess(data);
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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
              name="initiated_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initiated Name (Optional)</FormLabel>
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
            
            <div className="space-y-4">
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
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age (Calculated)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        readOnly
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <div className="space-y-4 border p-3 rounded-md bg-muted/20">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">Professional Details</h3>
              <FormField
                control={form.control}
                name="profession_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profession</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select profession" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROFESSIONS.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
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
                      <FormControl>
                        <Input {...field} placeholder="Enter your profession" />
                      </FormControl>
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
                    <FormControl>
                      <Input {...field} placeholder="Where do you work/study?" />
                    </FormControl>
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
                  <FormLabel>Residential Address</FormLabel>
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
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
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
            <FormField
              control={form.control}
              name="chanting_rounds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chanting Rounds</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
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