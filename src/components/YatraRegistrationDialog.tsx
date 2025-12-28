"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Yatra } from "@/types/yatra";
import { toast } from "sonner";
import { ShieldCheck, CreditCard, Loader2, Plus, UserPlus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import useRazorpay from "@/hooks/use-razorpay";
import { createRazorpayInvoice, createParticipantPublic } from "@/utils/api";
import { useMutation } from "@tanstack/react-query";

interface FamilyMember {
  full_name: string;
  relation: "Husband" | "Wife" | "Child";
  phone: string;
  gender: "Male" | "Female";
}

interface YatraRegistrationDialogProps {
  yatra: Yatra;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const YatraRegistrationDialog: React.FC<YatraRegistrationDialogProps> = ({
  yatra,
  isOpen,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const { isRazorpayReady, displayRazorpay } = useRazorpay();
  
  const [hasConsented, setHasConsented] = React.useState(false);
  const [selectedFeeKey, setSelectedFeeKey] = React.useState<string>("");
  const [members, setMembers] = React.useState<FamilyMember[]>([]);
  const [newMember, setNewMember] = React.useState<FamilyMember>({
    full_name: "",
    relation: "Wife",
    phone: "",
    gender: "Female"
  });

  const availableFees = Object.entries(yatra.registration_fees).filter(([, value]) => value > 0);

  React.useEffect(() => {
    if (availableFees.length > 0 && !selectedFeeKey) {
      setSelectedFeeKey(availableFees[0][0]);
    }
  }, [availableFees, selectedFeeKey]);

  const baseFee = availableFees.find(([key]) => key === selectedFeeKey)?.[1] || 0;
  const membersTotal = members.reduce((sum, m) => sum + (yatra.member_prices?.[m.relation] || 0), 0);
  const totalAmount = baseFee + membersTotal;

  const invoiceMutation = useMutation({
    mutationFn: async () => {
      if (!user?.user_id) throw new Error("User ID is missing.");
      
      // Register family members as participants first
      for (const m of members) {
        await createParticipantPublic({
          full_name: m.full_name,
          phone: m.phone,
          gender: m.gender,
          address: user.address || "Family Member",
          date_joined: new Date().toISOString().split('T')[0],
          devotee_friend_name: user.devotee_friend_name || "None",
        });
      }

      return createRazorpayInvoice({
        yatra_id: yatra.id,
        fee_category: selectedFeeKey,
        amount: totalAmount,
        participant_id: user.user_id,
      });
    },
    onSuccess: (invoice) => {
      displayRazorpay({
        yatraId: yatra.id,
        invoice,
        onSuccess: (response) => {
          toast.success("Registration successful!");
          onOpenChange(false);
        },
        onFailure: (error) => {
          toast.error("Payment failed", { description: error.description });
        },
      });
    },
    onError: (error: Error) => {
      toast.error("Registration failed", { description: error.message });
    },
  });

  const addMember = () => {
    if (!newMember.full_name || !newMember.phone) {
      toast.error("Member name and phone are required.");
      return;
    }
    setMembers([...members, { ...newMember }]);
    setNewMember({ full_name: "", relation: "Wife", phone: "", gender: "Female" });
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Trip Registration: {yatra.name}
          </DialogTitle>
          <DialogDescription>Review costs and add family members if applicable.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Base Registration Plan</Label>
            <RadioGroup value={selectedFeeKey} onValueChange={setSelectedFeeKey} className="grid gap-2">
              {availableFees.map(([key, value]) => (
                <div key={key} className="flex items-center space-x-3 rounded-md border p-3 hover:bg-muted/50">
                  <RadioGroupItem value={key} id={key} />
                  <Label htmlFor={key} className="flex flex-1 items-center justify-between">
                    <span>{key}</span>
                    <span className="font-bold">₹{value}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {yatra.can_add_members && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Add Family Members</h4>
              </div>

              <div className="grid gap-3 p-3 border rounded-lg bg-muted/20">
                <RadioGroup 
                  value={newMember.relation} 
                  onValueChange={(val: any) => setNewMember({ ...newMember, relation: val, gender: val === "Husband" ? "Male" : "Female" })} 
                  className="flex gap-4"
                >
                  {["Husband", "Wife", "Child"].map((rel) => (
                    <div key={rel} className="flex items-center space-x-2">
                      <RadioGroupItem value={rel} id={`rel-${rel}`} />
                      <Label htmlFor={`rel-${rel}`} className="text-sm">{rel}</Label>
                    </div>
                  ))}
                </RadioGroup>
                
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    placeholder="Full Name" 
                    value={newMember.full_name} 
                    onChange={e => setNewMember({ ...newMember, full_name: e.target.value })} 
                  />
                  <Input 
                    placeholder="Phone" 
                    value={newMember.phone} 
                    onChange={e => setNewMember({ ...newMember, phone: e.target.value })} 
                  />
                </div>
                
                <Button variant="outline" size="sm" onClick={addMember} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add Member (₹{yatra.member_prices?.[newMember.relation] || 0})
                </Button>
              </div>

              {members.length > 0 && (
                <div className="space-y-2">
                  {members.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted">
                      <div className="text-sm">
                        <span className="font-medium">{m.full_name}</span>
                        <span className="text-muted-foreground ml-2">({m.relation})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold">₹{yatra.member_prices?.[m.relation] || 0}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeMember(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Payable</span>
              <span>₹{totalAmount}</span>
            </div>
          </div>

          <div className="flex items-top space-x-2">
            <Checkbox id="consent" checked={hasConsented} onCheckedChange={(c) => setHasConsented(c as boolean)} />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="consent" className="text-sm font-medium">I agree to the terms and conditions</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => invoiceMutation.mutate()} disabled={!hasConsented || invoiceMutation.isPending || !isRazorpayReady} className="w-full">
            {invoiceMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Pay ₹{totalAmount}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default YatraRegistrationDialog;