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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, CalendarDays, History, User, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Batch } from "@/types/batch";
import { Participant } from "@/types/participant";
import { fetchBatchParticipants, fetchParticipantById, fetchBatchVolunteers } from "@/utils/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// Import new modular components
import ParticipantsTabContent from "./batch-management/ParticipantsTabContent";
import AttendanceTabContent from "./batch-management/AttendanceTabContent";
import VolunteersTabContent from "./batch-management/VolunteersTabContent";
import HistoryTabContent from "./batch-management/HistoryTabContent";
import StatsTabContent from "./batch-management/StatsTabContent";

import BatchAttendanceHistoryDialog from "./BatchAttendanceHistoryDialog";
import BatchVolunteerAssignmentDialog from "./BatchVolunteerAssignmentDialog";

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
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  const isMobile = useIsMobile();

  // Volunteers and Managers are considered "Staff" for this dialog
  const isStaff = isManager || user?.role === 'Volunteer';

  const [activeTab, setActiveTab] = React.useState(isStaff ? "participants" : "history");
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = React.useState(false);
  const [isVolunteerAssignmentDialogOpen, setIsVolunteerAssignmentDialogOpen] = React.useState(false);

  // Fetch Current Participants (needed by multiple tabs, so kept in parent)
  const { data: currentMappings, isLoading: isLoadingMappings } = useQuery({
    queryKey: ["batchParticipants", batch.id],
    queryFn: () => fetchBatchParticipants(batch.id),
    enabled: isOpen,
  });

  // Fetch Detailed Participant Profiles for the mappings (also needed by multiple tabs)
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

  // Fetch Volunteers to check if the current user is assigned
  const { data: batchVolunteers } = useQuery({
    queryKey: ["batchVolunteers", batch.id],
    queryFn: () => fetchBatchVolunteers(batch.id),
    enabled: isOpen,
  });

  const isAssignedVolunteer = React.useMemo(() => {
    if (!user || !batchVolunteers) return false;
    return batchVolunteers.some(v => v.participant_id === user.user_id);
  }, [user, batchVolunteers]);

  const hasWriteAccess = isManager || (user?.role === 'Volunteer' && isAssignedVolunteer);

  const isParticipant = React.useMemo(() => {
    if (!user || !currentMappings) return false;
    return currentMappings.some(m => m.participant_id === user.user_id);
  }, [user, currentMappings]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Badge className="bg-primary text-white">Class</Badge>
              {batch.name}
            </DialogTitle>
            <DialogDescription>
              {hasWriteAccess
                ? "Manage participant list and track spiritual attendance."
                : "View participant list and attendance records."}
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Tab Bar */}
            <div className="px-6 border-b bg-background">
              <TabsList className={cn(
                "w-full justify-start h-auto p-0 bg-transparent gap-4 flex-wrap",
                isMobile ? "gap-2" : "gap-6"
              )}>
                {isStaff && (
                  <TabsTrigger
                    value="participants"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                  >
                    <Users className="h-4 w-4 mr-2" /> Participants
                  </TabsTrigger>
                )}
                {isStaff && (
                  <TabsTrigger
                    value="attendance"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                  >
                    <CalendarDays className="h-4 w-4 mr-2" /> Attendance
                  </TabsTrigger>
                )}
                {isManager && (
                  <TabsTrigger
                    value="volunteers"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                  >
                    <User className="h-4 w-4 mr-2" /> Volunteers
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="history"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                >
                  <History className="h-4 w-4 mr-2" /> History
                </TabsTrigger>
                {isParticipant && (
                  <TabsTrigger
                    value="stats"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" /> Stats
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Content Area */}
            <div className="p-6">
              <TabsContent value="participants" className="m-0">
                <ParticipantsTabContent
                  batch={batch}
                  isOpen={activeTab === "participants"}
                  readOnly={!isManager} // Volunteers can see participants but not add them
                />
              </TabsContent>
              <TabsContent value="attendance" className="m-0">
                <AttendanceTabContent
                  batch={batch}
                  participants={participants || []}
                  isLoadingParticipants={isLoadingParticipants}
                  isOpen={activeTab === "attendance"}
                  readOnly={!hasWriteAccess}
                />
              </TabsContent>
              <TabsContent value="volunteers" className="m-0">
                <VolunteersTabContent
                  batch={batch}
                  isOpen={activeTab === "volunteers"}
                  onOpenVolunteerAssignmentDialog={() => setIsVolunteerAssignmentDialogOpen(true)}
                />
              </TabsContent>
              <TabsContent value="history" className="m-0">
                <HistoryTabContent
                  onOpenHistoryDialog={() => setIsHistoryDialogOpen(true)}
                />
              </TabsContent>
              <TabsContent value="stats" className="m-0">
                <StatsTabContent
                  batch={batch}
                />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <BatchAttendanceHistoryDialog
        batch={batch}
        isOpen={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        participants={participants || []}
        isFullHistoryVisible={hasWriteAccess}
      />

      <BatchVolunteerAssignmentDialog
        batch={batch}
        isOpen={isVolunteerAssignmentDialogOpen}
        onOpenChange={setIsVolunteerAssignmentDialogOpen}
      />
    </>
  );
};

export default BatchManagementDialog;