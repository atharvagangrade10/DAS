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
import { format, differenceInYears } from "date-fns";
import { toast } from "sonner";
import { Participant } from "@/types/participant";
import { API_BASE_URL } from "@/config/api";
import DOBInput from "./DOBInput";

interface DevoteeFriend {
  id: string;
  name: string;
}

interface CreateParticipantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreationSuccess: (newParticipant: Participant) => void;
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
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
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
  gender: z.enum(["Male", "Female", "Other"], {
    required_error: "Gender is required",
  }),
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

const createParticipant = async (
  data: any,
): Promise<Participant> => {
  const response = await fetch(`${API_BASE_URL}/register/participant`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create participant' }));
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

  const { data: devoteeFriends } = useQuery<
    DevoteeFriend[],
    Error
  >({
    queryKey: ["devoteeFriends"],
    queryFn: fetchDevoteeFriends,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      initiated_name: "",
      phone: "",
      address: "",
      place_name: "",
      age: undefined,
      dob: null,
      devotee_friend: "None",
      gender: "Male",
      profession_type: "Student",
      profession_other: "",
      chanting_rounds: undefined,
      email: "",
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

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof formSchema>) => {
      const profession = values.profession_type === "Other" 
        ? values.profession_other 
        : values.profession_type;

      const payload = {
        full_name: `${values.first_name} ${values.last_name}`,
        first_name: values.first_name,
        last_name: values.last_name,
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
      return createParticipant(payload);
    },
    onSuccess: (data) => {
      toast.success("Participant created successfully!");
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["participantsSearch"] });
      queryClient.invalidateQueries({ queryKey: ["allParticipants"] });
      onOpenChange(false);
      form.reset();
      onCreationSuccess(data);
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Participant</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new participant.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="initiated_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initiated Name (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Arjuna Dasa" />
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
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a devotee friend" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
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