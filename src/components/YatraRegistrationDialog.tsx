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
import { Yatra } from "@/types/yatra";
import { toast } from "sonner";
import { ShieldCheck, CreditCard, Loader2, UserPlus, Trash2, Baby } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import useRazorpay from "@/hooks/use-razorpay";
import { createRazorpayInvoice } from "@/utils/api";
import { useMutation } from "@tanstack/react-query";
import AddFamilyMemberDialog, { FamilyMemberData } from "./AddFamilyMemberDialog";
import TermsAndConditionsDialog from "./TermsAndConditionsDialog";

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
  const [selectedOptionName, setSelectedOptionName] = React.useState<string>("");
  const [members, setMembers] = React.useState<FamilyMemberData[]>([]);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = React.useState(false);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = React.useState(false);

  const selectedOption = yatra.registration_fees.find(f => f.option_name === selectedOptionName) || yatra.registration_fees[0];

  React.useEffect(() => {
    if (yatra.registration_fees.length > 0 && !selectedOptionName) {
      setSelectedOptionName(yatra.registration_fees[0].option_name);
    }
  }, [yatra.registration_fees, selectedOptionName]);

  const calculateMemberPrice = (member: FamilyMemberData) => {
    // Use the member's selected fee option if available, otherwise fall back to the main selected option
    const feeOption = member.selected_fee_option 
      ? yatra.registration_fees.find(f => f.option_name === member.selected_fee_option)
      : selectedOption;

    if (!feeOption) return selectedOption.amount;

    if (member.relation === "Child") {
      const age = member.calculated_age;
      const ageLimit = feeOption.child_condition_by_age;
      const childPrice = feeOption.child_amount ?? feeOption.amount;

      if (ageLimit !== undefined && ageLimit !== null) {
        return age > ageLimit ? childPrice : 0;
      }
      return childPrice;
    }
    return feeOption.amount;
  };

  const baseFee = selectedOption.amount;
  const membersTotal = members.reduce((sum, m) => sum + calculateMemberPrice(m), 0);
  const totalAmount = baseFee + membersTotal;

  const invoiceMutation = useMutation({
    mutationFn: async () => {
      if (!user?.user_id) throw new Error("User ID is missing.");
      
      // Participant creation for family members is now handled in AddFamilyMemberDialog
      // when they are first added to the local members list.

      return createRazorpayInvoice({
        yatra_id: yatra.id,
        fee_category: selectedOption.option_name,
        amount: totalAmount,
        participant_id: user.user_id,
      });
    },
    onSuccess: (invoice) => {
      displayRazorpay({
        yatraId: yatra.id,
        invoice,
        onSuccess: () => {
          toast.success("Registration successful!");
          onOpenChange(false);
          setMembers([]);
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

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Trip Registration: {yatra.name}
            </DialogTitle>
            <DialogDescription>Select your plan and add family members.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Your Plan</Label>
              <RadioGroup value={selectedOptionName} onValueChange={setSelectedOptionName}>
                <div className="grid gap-3">
                  {yatra.registration_fees.map((option) => (
                    <div key={option.option_name} className="flex items-center space-x-3 rounded-md border p-4 hover:bg-muted/50">
                      <RadioGroupItem value={option.option_name} id={option.option_name} />
                      <Label htmlFor={option.option_name} className="flex flex-1 items-center justify-between">
                        <div>
                          <span className="font-medium text-lg">{option.option_name}</span>
                          {yatra.can_add_members && option.child_amount !== undefined && (
                            <div className="mt-1 text-sm text-green-600 dark:text-green-400">
                              <span className="flex items-center gap-2">
                                <Baby className="h-4 w-4" />
                                Child: ₹{option.child_amount}
                              </span>
                              {option.child_condition_by_age && (
                                <span className="text-xs text-muted-foreground">
                                  Free for children till {option.child_condition_by_age} years
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xl">₹{option.amount}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {yatra.can_add_members && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Family Members</h4>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsAddMemberDialogOpen(true)}
                    className="border-foreground text-foreground dark:border-foreground dark:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Add Member
                  </Button>
                </div>

                {members.length > 0 && (
                  <div className="space-y-2">
                    {members.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                        <div className="text-sm">
                          <span className="font-bold">{m.full_name}</span>
                          <div className="text-xs text-muted-foreground">
                            {m.relation} • {m.calculated_age} yrs • {m.phone}
                          </div>
                          {m.selected_fee_option && (
                            <div className="text-xs text-primary font-medium">
                              Plan: {m.selected_fee_option}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-bold ${calculateMemberPrice(m) === 0 ? "text-green-600" : ""}`}>
                            {calculateMemberPrice(m) === 0 ? "FREE" : `₹${calculateMemberPrice(m)}`}
                          </span>
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
                <Label htmlFor="consent" className="text-sm font-medium">
                  I agree to the <Button variant="link" type="button" className="h-auto p-0 text-sm underline" onClick={() => setIsTermsDialogOpen(true)}>Terms and Conditions</Button>
                </Label>
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

        <AddFamilyMemberDialog
          isOpen={isAddMemberDialogOpen}
          onOpenChange={setIsAddMemberDialogOpen}
          onAdd={(member) => setMembers([...members, member])}
          defaultAddress={user?.address}
          availableFeeOptions={yatra.registration_fees} // Pass fee options to AddFamilyMemberDialog
        />
      </Dialog>
      
      <TermsAndConditionsDialog
        isOpen={isTermsDialogOpen}
        onOpenChange={setIsTermsDialogOpen}
      />
    </>
  );
};

export default YatraRegistrationDialog;