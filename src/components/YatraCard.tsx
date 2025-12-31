"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, IndianRupee, Pencil, ClipboardCheck, ThumbsUp, Users, Eye, Baby, Search, Loader2, BarChart3, CheckCircle2, Clock, AlertCircle, User } from "lucide-react";
import { Yatra, PaymentRecord } from "@/types/yatra";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EditYatraDialog from "./EditYatraDialog";
import YatraRegistrationDialog from "./YatraRegistrationDialog";
import ParticipantDetailsDialog from "./ParticipantDetailsDialog";
import YatraStatsDialog, { StatusStats } from "./YatraStatsDialog";
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
  registration_option?: string;
  is_child?: boolean;
  adult_count?: number;
  child_count?: number;
}

interface YatraParticipantsApiResponse {
  participants: YatraParticipantResponse[];
  adult_count: number;
  child_count: number;
  total_count: number;
  stats_by_status: StatusStats[];
}

const YatraCard: React.FC<YatraCardProps> = ({ yatra, showAdminControls = false, isRegistered = false }) => {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = React.useState(false);
  const [isRegisteredParticipantsDialogOpen, setIsRegisteredParticipantsDialogOpen] = React.useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = React.useState(false);
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
    if (isRegistered) return true;
    if (!paymentHistory) return false;
    return paymentHistory.some(p => 
      p.yatra_id === yatra.id && 
      (p.status.toLowerCase() === 'completed' || p.status.toLowerCase() === 'success' || p.status.toLowerCase() === 'paid')
    );
  }, [paymentHistory, yatra.id, isRegistered]);

  // Fetch registered participants for statistics
  const { data: apiResponse, isLoading: isLoadingParticipants, refetch } = useQuery<YatraParticipantsApiResponse, Error>({
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
    enabled: showAdminControls,
  });

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
        <div className="flex gap-1">
          {showAdminControls && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setIsStatsDialogOpen(true)}>
                      <BarChart3 className="h-5 w-5 text-primary hover:text-primary/80" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Stats</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                      <Pencil className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit Yatra</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
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
          <div className="grid gap-2">
            {yatra.registration_fees.map((fee) => (
              <div key={fee.option_name} className="flex items-center justify-between p-2 px-3 rounded-md border bg-background/50">
                <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                  {fee.option_name}
                </Badge>
                <div className="font-bold text-base">
                  ₹{fee.amount}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!showAdminControls && (
          <div className="pt-4 space-y-3">
            {isRegisteredForYatra ? (
              <Button 
                className="w-full flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30" 
                variant="outline"
                onClick={() => setIsRegisteredParticipantsDialogOpen(true)}
              >
                <ThumbsUp className="h-4 w-4 text-green-500" />
                <span className="font-medium">Registered (View List)</span>
              </Button>
            ) : (
              <Button 
                className="w-full flex items-center gap-2" 
                onClick={() => setIsRegisterDialogOpen(true)}
                disabled={isLoadingHistory}
              >
                <ClipboardCheck className="h-4 w-4" />
                Register Now
              </Button>
            )}
          </div>
        )}

        {showAdminControls && (
          <div className="pt-4">
            <Button 
              className="w-full flex items-center justify-center gap-2" 
              variant="outline"
              onClick={() => setIsRegisteredParticipantsDialogOpen(true)}
            >
              <Users className="h-4 w-4" />
              Manage Participants
            </Button>
          </div>
        )}
      </CardContent>

      <EditYatraDialog yatra={yatra} isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
      <YatraRegistrationDialog yatra={yatra} isOpen={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen} />
      
      <RegisteredParticipantsDialog
        isOpen={isRegisteredParticipantsDialogOpen}
        onOpenChange={setIsRegisteredParticipantsDialogOpen}
        participants={apiResponse?.participants || []}
        isLoading={isLoadingParticipants}
        onViewProfile={handleViewProfile}
        statsByStatus={apiResponse?.stats_by_status || []}
      />

      <YatraStatsDialog
        isOpen={isStatsDialogOpen}
        onOpenChange={setIsStatsDialogOpen}
        yatraName={yatra.name}
        totalAdults={apiResponse?.adult_count || 0}
        totalChildren={apiResponse?.child_count || 0}
        totalCount={apiResponse?.total_count || 0}
        statsByStatus={apiResponse?.stats_by_status || []}
      />

      <ParticipantDetailsDialog
        participantId={selectedParticipantId}
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </Card>
  );
};

interface ProcessedYatraParticipantResponse extends YatraParticipantResponse {
  isMainRegistrant: boolean;
}

interface RegisteredParticipantsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participants: YatraParticipantResponse[];
  isLoading: boolean;
  onViewProfile: (participantId: string) => void;
  statsByStatus: StatusStats[];
}

const RegisteredParticipantsDialog: React.FC<RegisteredParticipantsDialogProps> = ({
  isOpen,
  onOpenChange,
  participants,
  isLoading,
  onViewProfile,
  statsByStatus,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const processedParticipants = React.useMemo(() => {
    if (!participants || participants.length === 0) return [];

    const sortedList = [...participants].sort((a, b) => {
        const dateA = a.registration_date ? new Date(a.registration_date).getTime() : 0;
        const dateB = b.registration_date ? new Date(b.registration_date).getTime() : 0;
        return dateA - dateB;
    });

    const seenTransactionIds = new Set<string>();
    
    return sortedList.map(p => {
        const txId = p.transaction_id || p.participant_id; 
        const isMainRegistrant = !!txId && !seenTransactionIds.has(txId);
        if (isMainRegistrant) {
            seenTransactionIds.add(txId);
        }
        return {
            ...p,
            isMainRegistrant: isMainRegistrant
        } as ProcessedYatraParticipantResponse;
    });
  }, [participants]);

  const filteredParticipantsWithMainTag = React.useMemo(() => {
    if (!searchQuery) return processedParticipants;
    const lowerQuery = searchQuery.toLowerCase();
    return processedParticipants.filter(p => 
      p.participant_info.full_name.toLowerCase().includes(lowerQuery) ||
      p.participant_info.phone.includes(searchQuery)
    );
  }, [processedParticipants, searchQuery]);

  const { statusCounts, totalCompletedAmount } = React.useMemo(() => {
    let totalCompletedAmount = 0;
    const counts = {
      completed: 0,
      pending: 0,
      failed: 0,
      mainCompletedCount: 0,
    };

    if (statsByStatus && statsByStatus.length > 0) {
      statsByStatus.forEach(stat => {
        const s = stat.status.toLowerCase();
        if (s === 'completed' || s === 'success' || s === 'paid') {
          counts.completed = stat.total_count;
        } else if (s === 'pending') {
          counts.pending = stat.total_count;
        } else if (s === 'failed') {
          counts.failed = stat.total_count;
        }
      });
    }

    processedParticipants.forEach(p => {
      const status = p.payment_status.toLowerCase();
      if (status === 'success' || status === 'paid' || status === 'completed') {
        if (p.isMainRegistrant) {
          totalCompletedAmount += p.payment_amount || 0;
          counts.mainCompletedCount++;
        }
      }
    });
    
    return { statusCounts: counts, totalCompletedAmount };
  }, [processedParticipants, statsByStatus]);

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

        <div className="px-6 pb-4 grid grid-cols-4 gap-3 text-center border-b">
          <Card className="p-2 shadow-sm">
            <p className="text-[9px] font-medium text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-green-600">{statusCounts.completed}</p>
          </Card>
          <Card className="p-2 shadow-sm">
            <p className="text-[9px] font-medium text-muted-foreground">Main</p>
            <p className="text-lg font-bold text-primary">{statusCounts.mainCompletedCount}</p>
          </Card>
          <Card className="p-2 shadow-sm">
            <p className="text-[9px] font-medium text-muted-foreground">Wait</p>
            <p className="text-lg font-bold text-amber-600">{statusCounts.pending}</p>
          </Card>
          <Card className="p-2 shadow-sm">
            <p className="text-[9px] font-medium text-muted-foreground">Fail</p>
            <p className="text-lg font-bold text-red-600">{statusCounts.failed}</p>
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
          ) : filteredParticipantsWithMainTag.length > 0 ? (
            filteredParticipantsWithMainTag.map((participant) => (
              <Card key={participant.participant_id} className="p-4 border">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{participant.participant_info.full_name}</h4>
                      {participant.isMainRegistrant && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">Main</Badge>
                      )}
                      {participant.is_child && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5">Child</Badge>
                      )}
                      {getStatusBadge(participant.payment_status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{participant.participant_info.phone}</p>
                    
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-400">
                        <User className="h-3 w-3 text-blue-500" />
                        <span>Adults: {participant.adult_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-400">
                        <Baby className="h-3 w-3 text-pink-500" />
                        <span>Child: {participant.child_count || 0}</span>
                      </div>
                    </div>

                    {participant.registration_option && (
                      <p className="text-[10px] text-primary font-bold mt-1.5 uppercase tracking-tight">
                        Plan: {participant.registration_option}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-lg font-bold flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {participant.payment_amount || 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewProfile(participant.participant_info.id)}
                      className="flex items-center gap-1 shrink-0 h-8 px-2 text-xs"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No participants match your search." : "No participants registered yet."}
            </div>
          )}
        </div>
        
        <DialogFooter className="p-6 pt-2 border-t bg-muted/20 flex flex-col items-stretch gap-2">
          <div className="flex justify-between items-center text-lg font-bold text-green-700 dark:text-green-400">
            <span>Total Received (Completed)</span>
            <span className="flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {totalCompletedAmount}
            </span>
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default YatraCard;