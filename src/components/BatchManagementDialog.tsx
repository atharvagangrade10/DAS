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
import { Users, CalendarDays, History, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Batch } from "@/types/batch";
import { Participant } from "@/types/participant";
import { fetchBatchParticipants, fetchParticipantById } from "@/utils/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// Import new modular components
import ParticipantsTabContent from "./batch-management/ParticipantsTabContent";
import AttendanceTabContent from "./batch-management/AttendanceTabContent";
import VolunteersTabContent from "./batch-management/VolunteersTabContent";
import HistoryTabContent from "./batch-management/HistoryTabContent";

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
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = React.useState("participants");
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
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
            {/* Fixed Tab Bar */}
            <div className="px-6 border-b bg-background z-10 flex-shrink-0 sticky top-0">
              <TabsList className={cn(
                "w-full justify-start h-auto p-0 bg-transparent gap-6 flex-wrap",
                isMobile ? "grid grid-cols-2" : ""
              )}>
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
                  value="volunteers"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                >
                  <User className="h-4 w-4 mr-2" /> Volunteers
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                >
                  <History className="h-4 w-4 mr-2" /> History
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <TabsContent value="participants" className="m-0">
                    <ParticipantsTabContent
                      batch={batch}
                      isOpen={activeTab === "participants"}
                    />
                  </TabsContent>
                  <TabsContent value="attendance" className="m-0">
                    <AttendanceTabContent
                      batch={batch}
                      participants={participants || []}
                      isLoadingParticipants={isLoadingParticipants}
                      isOpen={activeTab === "attendance"}
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
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <BatchAttendanceHistoryDialog
        batch={batch}
        isOpen={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        participants={participants || []}
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