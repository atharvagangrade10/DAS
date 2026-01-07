"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import {
  Users,
  CalendarDays,
  Search,
  UserPlus,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar as CalendarIcon,
  ChevronRight,
  History,
  BarChart3,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Batch } from "@/types/batch";
import { Participant } from "@/types/participant";
import {
  fetchBatchParticipants,
  addParticipantToBatch,
  fetchBatchAttendance,
  markBatchAttendanceBulk,
  fetchParticipants,
  fetchParticipantById,
} from "@/utils/api";
import { cn } from "@/lib/utils";
import BatchAttendanceHistoryDialog from "./BatchAttendanceHistoryDialog";
import ParticipantStatsDialog from "./ParticipantStatsDialog";

interface BatchManagementDialogProps {
  batch: Batch;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BatchManagementDialog: React.FC<BatchManagementDialogProps> = ({
  batch,
  isOpen,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("participants");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [attendanceStatuses, setAttendanceStatuses] = React.useState<
    Record<string, string>
  >({});
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = React.useState(false);
  const [selectedParticipant, setSelectedParticipant] = React.useState<Participant | null>(null);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = React.useState(false);

  // 1. Fetch Current Participants
  const { data: currentMappings, isLoading: isLoadingMappings } = useQuery({
    queryKey: ["batchParticipants", batch.id],
    queryFn: () => fetchBatchParticipants(batch.id),
    enabled: isOpen,
  });

  // 2. Fetch Detailed Participant Profiles for the mappings
  const { data: participants, isLoading: isLoadingParticipants } = useQuery<
    Participant[]
  >({
    queryKey: ["batchParticipantDetails", batch.id, currentMappings?.length],
    queryFn: async () => {
      if (!currentMappings) return [];
      const promises = currentMappings.map((m) =>
        fetchParticipantById(m.participant_id)
      );
      return Promise.all(promises);
    },
    enabled: !!currentMappings,
  });

  // 3. Search for Global Participants to Add
  const { data: searchResults, isLoading: isSearching } = useQuery<Participant[]>({
    queryKey: ["participantSearch", searchQuery],
    queryFn: () => fetchParticipants(searchQuery),
    enabled: searchQuery.length >= 3,
  });

  // 4. Fetch Attendance for Selected Date
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data: currentAttendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["batchAttendance", batch.id, dateStr],
    queryFn: () => fetchBatchAttendance(batch.id, dateStr),
    enabled: isOpen && activeTab === "attendance",
  });

  // Sync current attendance to state
  React.useEffect(() => {
    if (currentAttendance) {
      const initial: Record<string, string> = {};
      currentAttendance.forEach((a: any) => {
        initial[a.participant_id] = a.status;
      });
      setAttendanceStatuses(initial);
    }
  }, [currentAttendance]);

  // Mutations
  const addMutation = useMutation({
    mutationFn: (pId: string) => addParticipantToBatch(batch.id, pId),
    onSuccess: () => {
      toast.success("Participant added to class!");
      queryClient.invalidateQueries({ queryKey: ["batchParticipants", batch.id] });
      setSearchQuery("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: (data: any) => markBatchAttendanceBulk(batch.id, data),
    onSuccess: () => {
      toast.success("Attendance saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["batchAttendance", batch.id, dateStr] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSaveAttendance = () => {
    const presentIds = Object.entries(attendanceStatuses)
      .filter(([_, status]) => status === "Present")
      .map(([id]) => id);

    saveAttendanceMutation.mutate({
      date: dateStr,
      participant_ids: presentIds,
      status: "Present",
      marked_by: "Admin",
    });
  };

  const handleMarkAllAbsent = () => {
    if (!participants) return;
    const absentStatuses = {};
    participants.forEach(p => {
      absentStatuses[p.id] = "Absent";
    });
    setAttendanceStatuses(absentStatuses);
    toast.info("All participants marked as Absent.");
  };

  const toggleStatus = (pId: string) => {
    setAttendanceStatuses((prev) => ({
      ...prev,
      [pId]: prev[pId] === "Present" ? "Absent" : "Present",
    }));
  };

  const handleViewStats = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsStatsDialogOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Badge className="bg-primary text-white">Class</Badge>
              {batch.name}
            </DialogTitle>
            <DialogDescription>
              Manage participant list and track spiritual attendance.
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-6 border-b">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                <TabsTrigger
                  value="participants"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                >
                  <Users className="h-4 w-4 mr-2" /> Participants
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                >
                  <CalendarDays className="h-4 w-4 mr-2" /> Attendance
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                >
                  <History className="h-4 w-4 mr-2" /> History
                </TabsTrigger>
              </TabsList>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-6">
                <TabsContent value="participants" className="m-0 space-y-6">
                  {/* Search & Add Section */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <UserPlus className="h-4 w-4" /> Add Participants
                    </h4>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or phone (min 3 chars)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {searchQuery.length >= 3 && (
                      <div className="border rounded-lg bg-muted/30 divide-y overflow-hidden">
                        {isSearching ? (
                          <div className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                          </div>
                        ) : searchResults && searchResults.length > 0 ? (
                          searchResults.map((p) => {
                            const isAlreadyIn = participants?.some(
                              (cp) => cp.id === p.id
                            );
                            return (
                              <div
                                key={p.id}
                                className="p-3 flex items-center justify-between hover:bg-background transition-colors"
                              >
                                <div>
                                  <p className="font-medium text-sm">{p.full_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {p.phone}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant={isAlreadyIn ? "ghost" : "outline"}
                                  disabled={isAlreadyIn || addMutation.isPending}
                                  onClick={() => addMutation.mutate(p.id)}
                                >
                                  {isAlreadyIn ? "Added" : "Add"}
                                </Button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No participants found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Current List Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Registered Participants</h4>
                      <Badge variant="secondary">{participants?.length || 0} Total</Badge>
                    </div>
                    <ScrollArea className="h-[300px] border rounded-lg">
                      <div className="grid gap-2 p-2">
                        {isLoadingParticipants ? (
                          [...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="h-14 w-full bg-muted animate-pulse rounded-lg"
                            />
                          ))
                        ) : participants && participants.length > 0 ? (
                          participants.map((p) => (
                            <div
                              key={p.id}
                              className="p-3 flex items-center justify-between border rounded-lg hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                  {p.full_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{p.full_name}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    {p.phone}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleViewStats(p)}
                                >
                                  <BarChart3 className="h-4 w-4 text-primary" />
                                  <span className="sr-only">View stats</span>
                                </Button>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">
                              No participants added to this class yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
                <TabsContent value="attendance" className="m-0 space-y-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-4 rounded-lg border">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                        Attendance Date
                      </p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-[240px] justify-start text-left font-normal border-primary/20"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            {format(selectedDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(d) => d && setSelectedDate(d)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleMarkAllAbsent}
                      >
                        Mark All Absent
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveAttendance}
                        disabled={
                          saveAttendanceMutation.isPending ||
                          !participants ||
                          participants.length === 0
                        }
                        className="gap-2"
                      >
                        {saveAttendanceMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center justify-between">
                      Attendance Sheet
                      <span className="text-xs font-normal text-muted-foreground italic">
                        (Select date to view/edit)
                      </span>
                    </h4>
                    {isLoadingAttendance || isLoadingParticipants ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                          Loading attendance sheet...
                        </p>
                      </div>
                    ) : participants && participants.length > 0 ? (
                      <ScrollArea className="h-[300px] border rounded-lg">
                        <div className="grid gap-2 p-2">
                          {participants.map((p) => {
                            const status = attendanceStatuses[p.id] || "Absent";
                            const isPresent = status === "Present";
                            return (
                              <div
                                key={p.id}
                                className={cn(
                                  "p-3 flex items-center justify-between border rounded-lg transition-all cursor-pointer",
                                  isPresent
                                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                    : "bg-background"
                                )}
                                onClick={() => toggleStatus(p.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "h-5 w-5 rounded-full flex items-center justify-center border-2 transition-colors",
                                      isPresent
                                        ? "bg-green-500 border-green-500"
                                        : "border-muted-foreground/30"
                                    )}
                                  >
                                    {isPresent && (
                                      <CheckCircle2 className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{p.full_name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {p.phone}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant={isPresent ? "default" : "secondary"}
                                  className={cn(
                                    "text-[10px] font-bold uppercase",
                                    isPresent ? "bg-green-600 hover:bg-green-600" : ""
                                  )}
                                >
                                  {isPresent ? "Present" : "Absent"}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">
                          Add participants in the first tab to mark attendance.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="history" className="m-0 space-y-6">
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Attendance History</h3>
                    <p className="text-muted-foreground mb-6">
                      View detailed attendance records for this class over time.
                    </p>
                    <Button onClick={() => setIsHistoryDialogOpen(true)}>
                      View Full History
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      <BatchAttendanceHistoryDialog
        batch={batch}
        isOpen={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        participants={participants || []}
      />

      <ParticipantStatsDialog
        participant={selectedParticipant!}
        batches={[batch]}
        isOpen={isStatsDialogOpen}
        onOpenChange={setIsStatsDialogOpen}
      />
    </>
  );
};

export default BatchManagementDialog;