"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, IndianRupee, Pencil, ClipboardCheck, ThumbsUp, Users, Eye, Baby, Search, Loader2, BarChart3, CheckCircle2, Clock, AlertCircle, User, CreditCard, Lock, FileText, Download } from "lucide-react";
import { Yatra, PaymentRecord, ReceiptResponse } from "@/types/yatra";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EditYatraDialog from "./EditYatraDialog";
import YatraRegistrationDialog from "./YatraRegistrationDialog";
import ParticipantDetailsDialog from "./ParticipantDetailsDialog";
import YatraStatsDialog, { StatusStats } from "./YatraStatsDialog";
import ReceiptDialog from "./ReceiptDialog";
import { useQuery } from "@tanstack/react-query";
import { fetchPaymentHistory, fetchYatraReceipt } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { API_BASE_URL } from "@/config/api";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface YatraParticipant {
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
  registration_option?: string;
  is_child?: boolean;
}

interface YatraGroup {
  order_id: string;
  payment_status: string;
  payment_amount: number;
  transaction_id: string | null;
  payment_date: string;
  participants: YatraParticipant[];
  adult_count: number;
  child_count: number;
  total_count: number;
}

interface YatraParticipantsApiResponse {
  groups: YatraGroup[];
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
  
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = React.useState(false);
  const [receiptData, setReceiptData] = React.useState<ReceiptResponse | null>(null);
  const [isFetchingReceipt, setIsFetchingReceipt] = React.useState(false);

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

  // Fetch registered participants for statistics and PDF
  const { data: apiResponse, isLoading: isLoadingParticipants } = useQuery<YatraParticipantsApiResponse, Error>({
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
    enabled: showAdminControls || isRegisteredForYatra,
  });

  const handleViewProfile = (participantId: string) => {
    setSelectedParticipantId(participantId);
    setIsDetailsDialogOpen(true);
  };

  const handleRegisteredButtonClick = async () => {
    if (showAdminControls) {
      setIsRegisteredParticipantsDialogOpen(true);
      return;
    }

    try {
      setIsFetchingReceipt(true);
      const data = await fetchYatraReceipt(yatra.id, user!.user_id);
      setReceiptData(data);
      setIsReceiptDialogOpen(true);
    } catch (error: any) {
      toast.error("Failed to load receipt", { description: error.message });
    } finally {
      setIsFetchingReceipt(false);
    }
  };

  const handleDownloadBoardingList = () => {
    if (!apiResponse || !apiResponse.groups) {
      toast.error("No participant data available to download.");
      return;
    }

    try {
      const doc = new jsPDF();
      const title = `Boarding List: ${yatra.name}`;
      const dateStr = `Trip Dates: ${format(new Date(yatra.date_start), "PPP")} - ${format(new Date(yatra.date_end), "PPP")}`;
      
      const tableData: any[] = [];
      let globalIndex = 1;

      // Grouped logic - exactly like the UI ledger
      apiResponse.groups.forEach(group => {
        const s = group.payment_status.toLowerCase();
        // Only include confirmed registrations
        if (s === 'completed' || s === 'success' || s === 'paid') {
          // Add a visual separator row for the transaction group
          tableData.push([
            { 
              content: `Transaction: ${group.transaction_id || group.order_id} | Amount: Rs. ${group.payment_amount} | Date: ${group.payment_date ? format(parseISO(group.payment_date), "MMM dd") : 'N/A'}`, 
              colSpan: 6, 
              styles: { 
                fillColor: [240, 240, 240], 
                fontStyle: 'bold', 
                textColor: [50, 50, 50],
                halign: 'left'
              } 
            }
          ]);

          group.participants.forEach(p => {
            tableData.push([
              globalIndex++,
              p.participant_info.full_name,
              p.participant_info.phone,
              p.is_child ? "Child" : "Adult",
              p.registration_option || "Standard",
              "[ ]" // Verification Checkbox
            ]);
          });
        }
      });

      if (tableData.length === 0) {
        toast.info("No confirmed participants found to export.");
        return;
      }

      doc.setFontSize(18);
      doc.text(title, 14, 20);
      doc.setFontSize(11);
      doc.text(dateStr, 14, 28);
      doc.text(`Generated on: ${format(new Date(), "PPP p")}`, 14, 34);

      autoTable(doc, {
        startY: 40,
        head: [['#', 'Full Name', 'Phone Number', 'Type', 'Plan', 'Verify']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 10 },
          5: { cellWidth: 20, halign: 'center' }
        },
        margin: { top: 40 },
        didParseCell: function (data) {
           // If it's a group header row (the one with the Rs. text), it has no index in column 0
           if (typeof data.cell.raw === 'object' && data.cell.raw.colSpan) {
              data.cell.styles.fillColor = [230, 235, 245];
           }
        }
      });

      doc.save(`Boarding_List_${yatra.name.replace(/\s+/g, "_")}.pdf`);
      toast.success("Boarding list downloaded successfully!");
    } catch (error) {
      console.error("PDF Error:", error);
      toast.error("Failed to generate boarding list PDF.");
    }
  };

  const isClosed = yatra.status === "Closed";

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow overflow-hidden relative">
      {isClosed && (
        <div className="absolute top-0 right-0 p-2 z-10">
          <Badge variant="destructive" className="flex items-center gap-1 font-bold shadow-sm">
            <Lock className="h-3 w-3" /> Closed
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-semibold flex items-center gap-2 pr-12">
          <MapPin className="h-6 w-6 text-primary" />
          {yatra.name}
        </CardTitle>
        <div className="flex gap-1">
          {showAdminControls && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleDownloadBoardingList} disabled={isLoadingParticipants}>
                      <FileText className="h-5 w-5 text-green-600 hover:text-green-700" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download Boarding List (PDF)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

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
                onClick={handleRegisteredButtonClick}
                disabled={isFetchingReceipt}
              >
                {isFetchingReceipt ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                )}
                <span className="font-medium">{isFetchingReceipt ? "Loading Receipt..." : "Registered (View Details)"}</span>
              </Button>
            ) : (
              <Button 
                className="w-full flex items-center gap-2" 
                onClick={() => setIsRegisterDialogOpen(true)}
                disabled={isLoadingHistory || isClosed}
              >
                {isClosed ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Registration Closed
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="h-4 w-4" />
                    Register Now
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {showAdminControls && (
          <div className="pt-4">
            <Button 
              className="w-full flex items-center justify-center gap-2" 
              variant="outline"
              onClick={handleRegisteredButtonClick}
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
        groups={apiResponse?.groups || []}
        isLoading={isLoadingParticipants}
        onViewProfile={handleViewProfile}
        summaryStats={{
            adults: apiResponse?.adult_count || 0,
            children: apiResponse?.child_count || 0,
            total: apiResponse?.total_count || 0
        }}
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

      <ReceiptDialog
        isOpen={isReceiptDialogOpen}
        onOpenChange={setIsReceiptDialogOpen}
        receiptData={receiptData}
      />
    </Card>
  );
};

interface RegisteredParticipantsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groups: YatraGroup[];
  isLoading: boolean;
  onViewProfile: (participantId: string) => void;
  summaryStats: {
      adults: number;
      children: number;
      total: number;
  };
}

const RegisteredParticipantsDialog: React.FC<RegisteredParticipantsDialogProps> = ({
  isOpen,
  onOpenChange,
  groups,
  isLoading,
  onViewProfile,
  summaryStats,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredGroups = React.useMemo(() => {
    if (!searchQuery) return groups;
    const lowerQuery = searchQuery.toLowerCase();
    
    return groups.filter(group => 
      group.participants.some(p => 
        p.participant_info.full_name.toLowerCase().includes(lowerQuery) ||
        p.participant_info.phone.includes(searchQuery)
      ) ||
      group.transaction_id?.toLowerCase().includes(lowerQuery)
    );
  }, [groups, searchQuery]);

  const totalCompletedAmount = React.useMemo(() => {
    return groups.reduce((acc, g) => {
        const s = g.payment_status.toLowerCase();
        if (s === 'completed' || s === 'success' || s === 'paid') {
            return acc + g.payment_amount;
        }
        return acc;
    }, 0);
  }, [groups]);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "success" || s === "paid" || s === "completed") {
      return <Badge className="bg-green-500 hover:bg-green-500 text-white text-[10px]">Paid</Badge>;
    }
    if (s === "pending") {
      return <Badge variant="secondary" className="text-[10px]">Pending</Badge>;
    }
    return <Badge variant="destructive" className="text-[10px]">Failed</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Registration Ledger
          </DialogTitle>
          <DialogDescription>
            Grouped by payment transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4 grid grid-cols-3 gap-3 text-center border-b">
          <Card className="p-2 shadow-sm">
            <p className="text-[9px] font-medium text-muted-foreground uppercase">Total</p>
            <p className="text-xl font-bold">{summaryStats.total}</p>
          </Card>
          <Card className="p-2 shadow-sm">
            <p className="text-[9px] font-medium text-muted-foreground uppercase">Adults</p>
            <p className="text-xl font-bold text-blue-600">{summaryStats.adults}</p>
          </Card>
          <Card className="p-2 shadow-sm">
            <p className="text-[9px] font-medium text-muted-foreground uppercase">Children</p>
            <p className="text-xl font-bold text-pink-600">{summaryStats.children}</p>
          </Card>
        </div>

        <div className="px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search participants or payment ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 pt-2 space-y-6 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">Loading groups...</p>
            </div>
          ) : filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div key={group.order_id} className="space-y-2">
                <div className="flex items-center justify-between bg-muted/50 p-2 px-3 rounded-md border border-dashed">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Tx: {group.transaction_id || "N/A"}</span>
                            {getStatusBadge(group.payment_status)}
                        </div>
                        <span className="text-[9px] text-muted-foreground">{group.payment_date ? format(parseISO(group.payment_date), "MMM dd, hh:mm a") : "Date Unknown"}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold flex items-center justify-end text-primary">
                            <IndianRupee className="h-3 w-3" /> {group.payment_amount}
                        </p>
                        <p className="text-[9px] text-muted-foreground">{group.adult_count} Adults, {group.child_count} Kids</p>
                    </div>
                </div>

                <div className="grid gap-2 pl-4 border-l-2 border-primary/20 ml-2">
                  {group.participants.map((participant) => (
                    <div key={participant.participant_id} className="flex items-center justify-between p-3 rounded-lg border bg-background hover:shadow-sm transition-shadow">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">{participant.participant_info.full_name}</h4>
                          {participant.is_child && (
                            <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-[9px] px-1.5 h-4">Kid</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{participant.participant_info.phone}</p>
                        {participant.registration_option && (
                            <p className="text-[9px] text-primary/80 font-medium mt-1 italic">
                                {participant.registration_option}
                            </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewProfile(participant.participant_info.id)}
                        className="h-7 w-7 p-0 shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No registrations found.</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="p-6 pt-3 border-t bg-muted/20 flex flex-col items-stretch gap-2">
          <div className="flex justify-between items-center text-lg font-bold text-green-700 dark:text-green-400">
            <span>Collected Revenue</span>
            <span className="flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {totalCompletedAmount}
            </span>
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full">Close List</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default YatraCard;