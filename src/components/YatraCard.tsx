"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, IndianRupee, Pencil, ClipboardCheck, Check } from "lucide-react";
import { Yatra } from "@/types/yatra";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EditYatraDialog from "./EditYatraDialog";
import YatraRegistrationDialog from "./YatraRegistrationDialog";

interface YatraCardProps {
  yatra: Yatra;
  showAdminControls?: boolean;
  isRegistered?: boolean; // New prop
}

const YatraCard: React.FC<YatraCardProps> = ({ yatra, showAdminControls = false, isRegistered = false }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = React.useState(false);

  // Filter out zero fees and map keys for display
  const feeEntries = Object.entries(yatra.registration_fees)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => {
      return { key, value };
    });

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-semibold flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          {yatra.name}
        </CardTitle>
        {showAdminControls && (
          <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
            <span className="sr-only">Edit yatra</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 grid gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          <p>
            {format(new Date(yatra.date_start), "PPP")} - {format(new Date(yatra.date_end), "PPP")}
          </p>
        </div>
        
        <div className="space-y-2 pt-2 border-t">
          <h4 className="font-medium flex items-center gap-1 text-base">
            <IndianRupee className="h-4 w-4" /> Registration Fees:
          </h4>
          {feeEntries.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {feeEntries.map((fee) => (
                <Badge key={fee.key} variant="secondary" className="text-sm px-3 py-1">
                  {fee.key}: ₹{fee.value}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No fees specified.</p>
          )}
        </div>

        {!showAdminControls && (
          <div className="pt-4">
            {isRegistered ? (
              <Button className="w-full flex items-center gap-2 bg-green-500 hover:bg-green-600" disabled>
                <Check className="h-4 w-4" />
                Registered
              </Button>
            ) : (
              <Button 
                className="w-full flex items-center gap-2" 
                onClick={() => setIsRegisterDialogOpen(true)}
              >
                <ClipboardCheck className="h-4 w-4" />
                Register Now
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <EditYatraDialog
        yatra={yatra}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <YatraRegistrationDialog
        yatra={yatra}
        isOpen={isRegisterDialogOpen}
        onOpenChange={setIsRegisterDialogOpen}
      />
    </Card>
  );
};

export default YatraCard;