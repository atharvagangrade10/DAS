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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format, differenceInYears, parseISO, isValid } from "date-fns";
import { Loader2, Users, UserPlus, Zap } from "lucide-react";
import { toast } from "sonner";
import DOBInput from "./DOBInput";
import { createParticipantPublic, searchParticipantPublic, fetchParticipantById, updateParticipant } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { Participant, RelatedParticipant } from "@/types/participant";

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

const familyMemberSchema = z.object({
  relation: z.enum(["Husband", "Wife", "Child", "Father", "Mother"]),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  initiated_name: z.string().optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  address: z.string().min(1, "Address is required"),
  place_name: z.string().optional().or(z.literal('')),
  dob: z.date({ required_error: "Date of birth is required" }),
  gender: z.enum(["Male", "Female", "Other"]),
  profession_type: z.string().optional(),
  profession_other: z.string().optional(),
  chanting_rounds: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().int().min(0).optional(),
  ),
  email: z.string().email("Invalid email address").min(1, "Email is required"), // Made mandatory
});

export type FamilyMemberData = z.infer<typeof familyMemberSchema> & {
  calculated_age: number;
  full_name: string;
  participant_id?: string;
};

interface AddFamilyMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (member: FamilyMemberData) => void;
  defaultAddress?: string;
}

const getInverseRelation = (relation: string, currentUserGender: string): string => {
  switch (relation) {
    case "Husband": return "Wife";
    case "Wife": return "Husband";
    case "Child": return currentUserGender === "Female" ? "Mother" : "Father";
    case "Father":
    case "Mother":
      return currentUserGender === "Female" ? "Daughter" : "Son";
    default: return "Relative";
  }
};

const AddFamilyMemberDialog: React.FC<AddFamilyMemberDialogProps> = ({
  isOpen,
  onOpenChange,
  onAdd,
  defaultAddress = "",
}) => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [profileRelationships, setProfileRelationships] = React.useState<RelatedParticipant[]>([]);

  const { data: relatedParticipants, isLoading: isLoadingRelated } = useQuery<Participant[]>({
    queryKey: ["relatedParticipants", user?.user_id],
    queryFn: async () => {
      const mainParticipant = await fetchParticipantById(user!.user_id);
      const links = mainParticipant.related_participant_ids || [];
      setProfileRelationships(links);
      
      if (links.length === 0) return [];
      
      const promises = links.map(rel => fetchParticipantById(rel.participant_id));
      return Promise.all(promises);
    },
    enabled: isOpen && !!user?.user_id,
  });

  const form = useForm<z.infer<typeof familyMemberSchema>>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      relation: "Child",
      first_name: "",
      last_name: "",
      initiated_name: "",
      phone: "",
      address: defaultAddress, // Use defaultAddress here
      place_name: "",
      gender: "Male",
      profession_type: "Student",
      profession_other: "",
      chanting_rounds: 0,
      email: "",
    },
  });

  const dobValue = form.watch("dob");
  const relationValue = form.watch("relation");
  const professionType = form.watch("profession_type");

  React.useEffect(() => {
    if (relationValue === "Husband" || relationValue === "Father") form.setValue("gender", "Male");
    if (relationValue === "Wife" || relationValue === "Mother") form.setValue("gender", "Female");
  }, [relationValue, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof familyMemberSchema>) => {
      if (!user?.user_id) throw new Error("Authentication required.");

      const calculated_age = values.dob ? differenceInYears(new Date(), values.dob) : 0;
      const full_name = `${values.first_name} ${values.last_name}`;
      
      let memberId: string | undefined;

      const existing = await searchParticipantPublic(values.phone);
      if (existing && existing.length > 0) {
        memberId = existing[0].id || (existing[0] as any).participant_id || (existing[0] as any).user_id;
      } else {
        const profession = values.profession_type === "Other" ? values.profession_other : values.profession_type;
        const response = await createParticipantPublic({
          full_name,
          first_name: values.first_name,
          last_name: values.last_name,
          initiated_name: values.initiated_name || null,
          phone: values.phone,
          gender: values.gender,
          dob: format(values.dob, "yyyy-MM-dd"),
          age: calculated_age,
          address: values.address,
          profession: profession || null,
          place_name: values.place_name || null,
          chanting_rounds: values.chanting_rounds,
          email: values.email, // Email is now mandatory
          date_joined: format(new Date(), "yyyy-MM-dd"),
          devotee_friend_name: user?.devotee_friend_name || "None",
        });
        memberId = response.id || (response as any).participant_id;
      }

      if (!memberId) throw new Error("Could not determine participant ID.");

      const currentUserProfile = await fetchParticipantById(user.user_id);
      const currentUserLinks = currentUserProfile.related_participant_ids || [];
      
      if (!currentUserLinks.some(l => l.participant_id === memberId)) {
        const updatedCurrentUser = await updateParticipant(user.user_id, {
          ...currentUserProfile,
          related_participant_ids: [
            ...currentUserLinks, 
            { relation: values.relation, participant_id: memberId }
          ]
        });
        updateUser({ ...user, related_participant_ids: updatedCurrentUser.related_participant_ids });
      }

      const memberProfile = await fetchParticipantById(memberId);
      const memberLinks = memberProfile.related_participant_ids || [];
      const inverseRelation = getInverseRelation(values.relation, user.gender || "Male");
      
      if (!memberLinks.some(l => l.participant_id === user.user_id)) {
        await updateParticipant(memberId, {
          ...memberProfile,
          related_participant_ids: [
            ...memberLinks, 
            { relation: inverseRelation, participant_id: user.user_id }
          ]
        });
      }

      return { ...values, calculated_age, full_name, participant_id: memberId };
    },
    onSuccess: (data) => {
      onAdd(data as FamilyMemberData);
      form.reset({
        relation: "Child",
        first_name: "",
        last_name: "",
        initiated_name: "",
        phone: "",
        address: defaultAddress, // Reset address to defaultAddress
        place_name: "",
        gender: "Male",
        profession_type: "Student",
        profession_other: "",
        chanting_rounds: 0,
        email: "",
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["relatedParticipants", user?.user_id] });
      toast.success("Family member linked and added!");
    },
    onError: (error: Error) => {
      toast.error("Linking failed", { description: error.message });
    },
  });

  const handleQuickAdd = (p: Participant) => {
    const relInfo = profileRelationships.find(r => r.participant_id === p.id);
    const dobDate = p.dob ? parseISO(p.dob) : null;
    const calculated_age = dobDate && isValid(dobDate) ? differenceInYears(new Date(), dobDate) : (p.age || 0);
    
    const validRelations = ["Husband", "Wife", "Child", "Father", "Mother"];
    const relation = validRelations.includes(relInfo?.relation || "") 
      ? (relInfo!.relation as any) 
      : "Child";

    const memberData: FamilyMemberData = {
      relation,
      first_name: p.first_name || p.full_name.split(' ')[0],
      last_name: p.last_name || p.full_name.split(' ').slice(1).join(' '),
      initiated_name: p.initiated_name || "",
      phone: p.phone,
      address: p.address,
      place_name: p.place_name || "",
      dob: dobDate && isValid(dobDate) ? dobDate : new Date(),
      gender: (p.gender as any) || "Male",
      profession_type: p.profession || "Student",
      profession_other: "",
      chanting_rounds: p.chanting_rounds || 0,
      email: p.email, // Email is now mandatory
      calculated_age,
      full_name: p.full_name,
      participant_id: p.id,
    };

    onAdd(memberData);
    onOpenChange(false);
    toast.success(`${p.full_name} added to trip!`);
  };

  const onSubmit = (values: z.infer<typeof familyMemberSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Register a new relative or select from your linked members.
          </DialogDescription>
        </DialogHeader>

        {isLoadingRelated ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : relatedParticipants && relatedParticipants.length > 0 && (
          <div className="space-y-3 mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <Label className="flex items-center gap-2 font-bold text-primary">
              <Zap className="h-4 w-4 fill-primary" />
              Quick Add Linked Member
            </Label>
            <div className="space-y-2">
              {relatedParticipants.map((p) => {
                const rel = profileRelationships.find(r => r.participant_id === p.id)?.relation || "Relative";
                return (
                  <div key={p.id} className="flex flex-col p-3 rounded bg-background border text-sm gap-2">
                    <div>
                      <span className="font-semibold">{p.full_name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({rel})</span>
                    </div>
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => handleQuickAdd(p)}>
                      Add to Trip
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Separator className="flex-1" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest text-center">OR REGISTER NEW</span>
              <Separator className="flex-1" />
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="relation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relation <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["Husband", "Wife", "Child", "Father", "Mother"].map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl><Input {...field} /></FormControl>
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
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                  <FormControl><Input {...field} type="tel" /></FormControl>
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
                      <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
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
              name="chanting_rounds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chanting Rounds</FormLabel>
                  <FormControl><Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profession_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profession</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Profession" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROFESSIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
                    <FormControl><Input {...field} /></FormControl>
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
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                  <FormControl><Input {...field} /></FormControl>
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
                  <FormControl><Input {...field} type="email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                Register and Add
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFamilyMemberDialog;