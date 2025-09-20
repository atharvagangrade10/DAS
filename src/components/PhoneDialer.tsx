"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Import cn utility

interface PhoneDialerProps {
  phoneNumber: string;
  participantName?: string;
}

const PhoneDialer: React.FC<PhoneDialerProps> = ({ phoneNumber, participantName }) => {
  const handleDial = () => {
    if (phoneNumber) {
      // In a real application, this would initiate a call via a softphone or a browser's tel: protocol.
      // For now, we'll just log it and show a toast.
      window.open(`tel:${phoneNumber}`);
      toast.info(`Attempting to dial ${phoneNumber}`, {
        description: participantName ? `for ${participantName}` : "",
      });
    } else {
      toast.error("No phone number available to dial.");
    }
  };

  const isPhoneNumberInvalid = phoneNumber && phoneNumber.length !== 10;

  return (
    <div className="flex items-center space-x-2">
      <span className={cn(
        "text-sm",
        isPhoneNumberInvalid ? "text-red-500 dark:text-red-400" : "text-gray-700 dark:text-gray-300"
      )}>
        {phoneNumber || "N/A"}
      </span>
      {phoneNumber && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDial}
          className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900"
        >
          <Phone className="h-4 w-4" />
          Dial
        </Button>
      )}
    </div>
  );
};

export default PhoneDialer;