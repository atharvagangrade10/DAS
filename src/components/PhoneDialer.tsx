"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Import cn utility
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components

interface PhoneDialerProps {
  phoneNumber: string;
  participantName?: string;
}

const PhoneDialer: React.FC<PhoneDialerProps> = ({ phoneNumber, participantName }) => {
  const handleDial = () => {
    if (phoneNumber && !isPhoneNumberInvalid) {
      window.open(`tel:${phoneNumber}`);
      toast.info(`Attempting to dial ${phoneNumber}`, {
        description: participantName ? `for ${participantName}` : "",
      });
    } else if (isPhoneNumberInvalid) {
      toast.error("Invalid phone number, cannot dial.");
    } else {
      toast.error("No phone number available to dial.");
    }
  };

  // A phone number is considered valid if it's 10 digits long.
  // An empty string is also considered "valid" in the sense that it's not an invalid format,
  // but it means no number is provided.
  const isPhoneNumberInvalid = phoneNumber && !/^\d{10}$/.test(phoneNumber);
  const canDial = phoneNumber && !isPhoneNumberInvalid;

  return (
    <div className="flex items-center space-x-2">
      <span className={cn(
        "text-sm",
        isPhoneNumberInvalid ? "text-red-500 dark:text-red-400" : "text-gray-700 dark:text-gray-300"
      )}>
        {phoneNumber || "N/A"}
      </span>
      {phoneNumber && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDial}
              disabled={!canDial}
              className={cn(
                "flex items-center gap-1",
                canDial
                  ? "text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900"
                  : "text-gray-400 border-gray-300 dark:text-gray-600 dark:border-gray-700 cursor-not-allowed"
              )}
            >
              <Phone className="h-4 w-4" />
              Dial
            </Button>
          </TooltipTrigger>
          {!canDial && isPhoneNumberInvalid && (
            <TooltipContent>
              <p>Invalid phone number format (must be 10 digits).</p>
            </TooltipContent>
          )}
          {!canDial && !phoneNumber && (
            <TooltipContent>
              <p>No phone number available.</p>
            </TooltipContent>
          )}
        </Tooltip>
      )}
    </div>
  );
};

export default PhoneDialer;