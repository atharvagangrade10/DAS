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
import { ShieldCheck, CreditCard, Loader2 } from "lucide-react";

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
  const [hasConsented, setHasConsented] = React.useState(false);
  const [selectedFeeKey, setSelectedFeeKey] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Filter out zero fees
  const availableFees = Object.entries(yatra.registration_fees).filter(
    ([, value]) => value > 0
  );

  React.useEffect(() => {
    if (availableFees.length > 0 && !selectedFeeKey) {
      setSelectedFeeKey(availableFees[0][0]);
    }
  }, [availableFees, selectedFeeKey]);

  const handleRegister = async () => {
    if (!hasConsented) {
      toast.error("Please provide your consent to proceed.");
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Registration initiated!", {
      description: `You have selected the "${selectedFeeKey}" category for ${yatra.name}. Redirecting to payment...`,
    });
    
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Register for {yatra.name}
          </DialogTitle>
          <DialogDescription>
            Please review the terms and select your registration category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Category</Label>
            <RadioGroup
              value={selectedFeeKey}
              onValueChange={setSelectedFeeKey}
              className="grid gap-3"
            >
              {availableFees.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedFeeKey(key)}
                >
                  <RadioGroupItem value={key} id={key} />
                  <Label
                    htmlFor={key}
                    className="flex flex-1 items-center justify-between cursor-pointer"
                  >
                    <span className="font-medium">{key}</span>
                    <span className="font-bold">₹{value}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <h4 className="font-semibold">Terms & Conditions</h4>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>Registration is non-refundable 7 days prior to departure.</li>
              <li>Participants must follow the spiritual guidelines provided.</li>
              <li>Travel insurance is recommended but not included.</li>
            </ul>
          </div>

          <div className="flex items-top space-x-2">
            <Checkbox
              id="consent"
              checked={hasConsented}
              onCheckedChange={(checked) => setHasConsented(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="consent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the terms and conditions
              </Label>
              <p className="text-sm text-muted-foreground">
                By checking this, you agree to the spiritual and logistical guidelines of the Yatra.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRegister}
            disabled={!hasConsented || isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Proceed to Pay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default YatraRegistrationDialog;