"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsAndConditionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsAndConditionsDialog: React.FC<TermsAndConditionsDialogProps> = ({ isOpen, onOpenChange }) => {
  const termsText = `
By submitting this form, I acknowledge that my participation in this spiritual retreat/journey is voluntary, and I assume all associated risks.

The organizers, their representatives, and affiliates shall not be liable for any injuries, medical conditions, accidents, fatalities, or any other losses arising from my participation, whether foreseeable or unforeseeable.

I expressly waive all claims against them and accept full responsibility for my well-being.

If I am under 18, I confirm that my parent/guardian has granted consent.

Registration fee is non-refundable. If someone cancels, the fee will be considered as a donation to the temple.
पंजीकरण शुल्क वापस नहीं किया जाएगा। रद्द करने पर शुल्क मंदिर को दान माना जाएगा।
  `;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>Terms and Conditions</AlertDialogTitle>
          <AlertDialogDescription>
            Please read the following terms carefully before proceeding with registration.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ScrollArea className="flex-1 h-64 p-4 border rounded-md bg-muted/50 whitespace-pre-wrap text-sm text-foreground">
          {termsText.trim()}
        </ScrollArea>
        <div className="flex justify-end pt-4">
          <AlertDialogAction onClick={() => onOpenChange(false)}>Close</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TermsAndConditionsDialog;