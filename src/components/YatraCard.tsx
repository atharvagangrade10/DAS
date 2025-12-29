"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, IndianRupee, Pencil, ClipboardCheck, ThumbsUp, Users, Eye, Baby, Search, Loader2 } from "lucide-react";
import { Yatra, PaymentRecord } from "@/types/yatra";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EditYatraDialog from "./EditYatraDialog";
import YatraRegistrationDialog from "./YatraRegistrationDialog";
import ParticipantDetailsDialog from "./ParticipantDetailsDialog";
import { useQuery } from "@tanstack/react-query";
import { fetchPaymentHistory } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { API_BASE_URL } from "@/config/api";

interface YatraCardProps {
  yatra: Yatra;
  showAdminControls?: boolean;
  isRegistered?: boolean;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('das_auth_token');
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

interface YatraParticipantResponse {
  participant_id: string;
  yatra_id: string;
  participant_info: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    age?: number;
    gender?: string;
    initiated_name?: string;
    profession?: string;
    address: string;
    profile_photo_url?: string;
  };
  is_registered: boolean;
  payment_status: string;
  payment_amount?: number;
  transaction_id?: string;
  registration_date?: string;
  created_at?: string;
}

const YatraCard: React.FC<YatraCardProps> = ({ yatra, showAdminControls = false, isRegistered = false }) => {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = React.useState(false);
  const [isRegisteredParticipantsDialogOpen, setIsRegisteredParticipantsDialogOpen] = React.useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = React.useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);

  // Fetch payment history to check registration status
  const { data: paymentHistory, isLoading: isLoadingHistory } = useQuery<PaymentRecord[], Error>({
    queryKey: ["paymentHistory", user?.user_id],
    queryFn: () => fetchPaymentHistory(user!.user_id),
    enabled: !!user?.user_id,
  });

  // Determine if the user is registered for this yatra
  const isRegisteredForYatra = React.useMemo(() => {
    if (isRegistered) return true; // Use prop if provided
    if (!paymentHistory) return false;
    return paymentHistory.some(p => 
      p.yatra_id === yatra.id && 
      (p.status.toLowerCase() === 'completed' || p.status.toLowerCase() === 'success' || p.status.toLowerCase() === 'paid')
    );
  }, [paymentHistory, yatra.id, isRegistered]);

  // Fetch registered participants for this yatra
  const { data: registeredParticipants, isLoading: isLoadingParticipants, refetch } = useQuery<YatraParticipantResponse[], Error>({
    queryKey: ["yatraParticipants", yatra.id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/yatra/yatra/${yatra.id}/participants`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch participants' }));
        throw new Error(errorData.detail || "Failed to fetch participants");
      }
      return response.json();
    },
    enabled: false, 
  });

  // Trigger refetch when dialog opens
  React.useEffect(() => {
    if (isRegisteredParticipantsDialogOpen) {
      refetch();
    }
  }, [isRegisteredParticipantsDialogOpen, refetch]);

  const handleViewProfile = (participantId: string) => {
    setSelectedParticipantId(participantId);
    setIsDetailsDialogOpen(true);
  };

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
          <div className="pt-4 space-y-3">
            {isRegisteredForYatra ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      className="w-full flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30" 
                      variant="outline"
                      onClick={() => setIsRegisteredParticipantsDialogOpen(true)}
                    >
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Registered</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to view trip participants</p>
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

        {showAdminControls && (
          <div className="pt-4">
            <Button 
              className="w-full flex items-center gap-2" 
              variant="outline"
              onClick={() => setIsRegisteredParticipantsDialogOpen(true)}
            >
              <Users className="h-4 w-4" />
              Registered Participants
            </Button>
          </div>
        )}
      </CardContent>

      <EditYatraDialog yatra={yatra} isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
      <YatraRegistrationDialog yatra={yatra} isOpen={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen} />
      
      <RegisteredParticipantsDialog
        isOpen={isRegisteredParticipantsDialogOpen}
        onOpenChange={setIsRegisteredParticipantsDialogOpen}
        participants={registeredParticipants || []}
        isLoading={isLoadingParticipants}
        onViewProfile={handleViewProfile}
      />

      <ParticipantDetailsDialog
        participantId={selectedParticipantId}
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </Card>
  );
};

interface RegisteredParticipantsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participants: YatraParticipantResponse[];
  isLoading: boolean;
  onViewProfile: (participantId: string) => void;
}

const RegisteredParticipantsDialog: React.FC<RegisteredParticipantsDialogProps> = ({
  isOpen,
  onOpenChange,
  participants,
  isLoading,
  onViewProfile,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredParticipants = React.useMemo(() => {
    if (!searchQuery) return participants;
    const lowerQuery = searchQuery.toLowerCase();
    return participants.filter(p => 
      p.participant_info.full_name.toLowerCase().includes(lowerQuery) ||
      p.participant_info.phone.includes(searchQuery)
    );
  }, [participants, searchQuery]);

  const statusCounts = React.useMemo(() => {
    const counts = {
      completed: 0,
      pending: 0,
      failed: 0,
    };

    participants.forEach(p => {
      const status = p.payment_status.toLowerCase();
      if (status === 'success' || status === 'paid' || status === 'completed') {
        counts.completed++;
      } else if (status === 'pending') {
        counts.pending++;
      } else {
        counts.failed++;
      }
    });
    return counts;
  }, [participants]);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "success" || s === "paid" || s === "completed") {
      return <Badge className="bg-green-500 hover:bg-green-500 text-white text-[10px]">Success</Badge>;
    }
    if (s === "pending") {
      return <Badge variant="secondary" className="text-[10px]">Pending</Badge>;
    }
    return <Badge variant="destructive" className="text-[10px]">Failed</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Registered Participants
          </DialogTitle>
          <DialogDescription>
            List of participants registered for this yatra.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4 grid grid-cols-3 gap-3 text-center border-b">
          <Card className="p-2 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Completed</p>
            <p className="text-xl font-bold text-green-600">{statusCounts.completed}</p>
          </Card>
          <Card className="p-2 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Pending</p>
            <p className="text-xl font-bold text-amber-600">{statusCounts.pending}</p>
          </Card>
          <Card className="p-2 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Failed</p>
            <p className="text-xl font-bold text-red-600">{statusCounts.failed}</p>
          </Card>
        </div>

        <div className="px-6 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 pt-2 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : filteredParticipants.length > 0 ? (
            filteredParticipants.map((participant) => (
              <Card key={participant.participant_id} className="p-4 border">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{participant.participant_info.full_name}</h4>
                      {getStatusBadge(participant.payment_status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{participant.participant_info.phone}</p>
                    {participant.registration_date && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Reg: {format(new Date(participant.registration_date), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewProfile(participant.participant_id)}
                    className="flex items-center gap-1 shrink-0"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No participants match your search." : "No participants registered yet."}
            </div>
          )}
        </div>
        
        <DialogFooter className="p-6 pt-2 border-t bg-muted/20">
          <Button onClick={() => onOpenChange(false)} className="w-full">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default YatraCard;