"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, IndianRupee, Pencil, ClipboardCheck, Check, Baby, ThumbsUp } from "lucide-react";
import { Yatra } from "@/types/yatra";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EditYatraDialog from "./EditYatraDialog";
import YatraRegistrationDialog from "./YatraRegistrationDialog";
import { useQuery } from "@tanstack/react-query";
import { fetchPaymentHistory } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

interface YatraCardProps {
  yatra: Yatra;
  showAdminControls?: boolean;
  isRegistered?: boolean;
}

const YatraCard: React.FC<YatraCardProps> = ({ yatra, showAdminControls = false, isRegistered = false }) => {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = React.useState(false);

  // Fetch payment history to check registration status
  const { data: paymentHistory, isLoading: isLoadingHistory } = useQuery<PaymentRecord[], Error>({
    queryKey: ["paymentHistory", user?.user_id],
    queryFn: () => fetchPaymentHistory(user!.user_id),
    enabled: !!user?.user_id,
  });

  // Determine if the user is registered for this yatra
  const isRegisteredForYatra = React.useMemo(() => {
    if (!paymentHistory) return false;
    return paymentHistory.some(p => 
      p.yatra_id === yatra.id && 
      (p.status.toLowerCase() === 'completed' || p.status.toLowerCase() === 'success' || p.status.toLowerCase() === 'paid')
    );
  }, [paymentHistory, yatra.id]);

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
          <div className="grid gap-3">
            {yatra.registration_fees.map((fee) => (
              <Card key={fee.option_name} className="p-4 border">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {fee.option_name}
                    </Badge>
                    <div className="text-lg font-bold">
                      ₹{fee.amount}
                    </div>
                  </div>
                  {yatra.can_add_members && fee.child_amount !== undefined && (
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Baby className="h-4 w-4" />
                        Child: ₹{fee.child_amount}
                      </div>
                      {fee.child_condition_by_age && (
                        <div className="text-xs text-muted-foreground">
                          Free for children till {fee.child_condition_by_age} years
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {!showAdminControls && (
          <div className="pt-4">
            {isRegisteredForYatra ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="w-full flex items-center gap-2" variant="outline" disabled>
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400 font-medium">Registered</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You have successfully registered for this trip.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button 
                className="w-full flex items-center gap-2" 
                onClick={() => setIsRegisterDialogOpen(true)}
                disabled={isLoadingHistory}
              >
                <ClipboardCheck className="h-4 w-4" />
                Register
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