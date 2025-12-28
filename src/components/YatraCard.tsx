"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, IndianRupee, Pencil, ClipboardCheck, Check, Baby } from "lucide-react";
import { Yatra } from "@/types/yatra";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EditYatraDialog from "./EditYatraDialog";
import YatraRegistrationDialog from "./YatraRegistrationDialog";

interface YatraCardProps {
  yatra: Yatra;
  showAdminControls?: boolean;
  isRegistered?: boolean;
}

const YatraCard: React.FC<YatraCardProps> = ({ yatra, showAdminControls = false, isRegistered = false }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = React.useState(false);

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
        
        <div className="space-y-3 pt-2 border-t">
          <h4 className="font-medium flex items-center gap-1 text-base">
            <IndianRupee className="h-4 w-4" /> Registration Fees:
          </h4>
          <div className="flex flex-wrap gap-2">
            {yatra.registration_fees.map((fee) => (
              <TooltipProvider key={fee.option_name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-sm px-3 py-1 cursor-default">
                      {fee.option_name}: ₹{fee.amount}
                      {fee.child_amount !== null && fee.child_amount !== undefined && (
                        <span className="ml-1 text-[10px] opacity-70">(C: ₹{fee.child_amount})</span>
                      )}
                    </Badge>
                  </TooltipTrigger>
                  {fee.child_amount !== undefined && (
                    <TooltipContent>
                      <p className="flex items-center gap-1">
                        <Baby className="h-3 w-3" /> 
                        Child Price: ₹{fee.child_amount} 
                        {fee.child_condition_by_age && ` (Free if ≤ ${fee.child_condition_by_age} years)`}
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
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

      <EditYatraDialog yatra={yatra} isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
      <YatraRegistrationDialog yatra={yatra} isOpen={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen} />
    </Card>
  );
};

export default YatraCard;