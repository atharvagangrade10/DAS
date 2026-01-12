"use client";

import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PlusCircle, LayoutGrid, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Program } from "@/types/program";
import { Batch } from "@/types/batch";
import CreateProgramDialog from "@/components/CreateProgramDialog";
import CreateBatchDialog from "@/components/CreateBatchDialog";
import ProgramCard from "@/components/ProgramCard";
import BatchCard from "@/components/BatchCard";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPrograms, fetchBatches, fetchMyAssignedBatches, fetchMyEnrolledBatches } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Programs = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  const isVolunteer = user?.role === 'Volunteer';
  const isAttendee = user?.role === 'Attendee';

  const [isCreateProgramDialogOpen, setIsCreateProgramDialogOpen] = React.useState(false);
  const [isCreateBatchDialogOpen, setIsCreateBatchDialogOpen] = React.useState(false);

  const { data: programs, isLoading: isLoadingPrograms, error: programsError } = useQuery<Program[], Error>({
    queryKey: ["programs"],
    queryFn: fetchPrograms,
    enabled: isManager, // Only managers see regular programs
  });

  const { data: batches, isLoading: isLoadingBatches, error: batchesError } = useQuery<Batch[], Error>({
    queryKey: ["batches", user?.role, user?.user_id],
    queryFn: () => {
      if (isManager) {
        return fetchBatches();
      }
      if (isVolunteer) {
        return fetchMyAssignedBatches();
      }
      // For Attendees, fetch enrolled batches
      return fetchMyEnrolledBatches();
    },
    enabled: !!user,
  });

  React.useEffect(() => {
    if (isManager && programsError) {
      toast.error("Error loading programs", { description: programsError.message });
    }
    if (batchesError) {
      toast.error("Error loading classes", { description: batchesError.message });
    }
  }, [programsError, batchesError, isManager]);

  const isLoading = isLoadingPrograms || isLoadingBatches;

  return (
    <div className="container mx-auto p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Programs & Classes</h1>

        {isManager && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Create New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsCreateProgramDialogOpen(true)} className="flex items-center gap-2 cursor-pointer">
                <Calendar className="h-4 w-4" />
                New Program
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCreateBatchDialogOpen(true)} className="flex items-center gap-2 cursor-pointer">
                <LayoutGrid className="h-4 w-4" />
                New Class
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>


      <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mb-8">
        Manage your fixed-duration spiritual programs and recurring daily or weekly classes.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Render regular programs */}
          {isManager && programs?.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}

          {/* Render recurring classes (batches) */}
          {batches?.map((batch) => (
            <BatchCard key={batch.id} batch={batch} showAdminControls={isManager} />
          ))}

          {(!isManager || (!programs || programs.length === 0)) && (!batches || batches.length === 0) && (
            <div className="col-span-full text-center py-20">
              <p className="text-gray-500 text-xl">No activities found.</p>
              <p className="text-gray-500">
                {isManager ? "Create a new program or class to get started." : "You are not enrolled in any programs or classes yet."}
              </p>
            </div>
          )}
        </div>
      )}

      <CreateProgramDialog
        isOpen={isCreateProgramDialogOpen}
        onOpenChange={setIsCreateProgramDialogOpen}
      />

      <CreateBatchDialog
        isOpen={isCreateBatchDialogOpen}
        onOpenChange={setIsCreateBatchDialogOpen}
      />
    </div>
  );
};

export default Programs;
</dyad-file>

<dyad-write path="src/components/BatchManagementDialog.tsx" description="Adjusting permissions for BatchManagementDialog based on user roles.">
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
  const isVolunteer = user?.role === 'Volunteer';
  const isMobile = useIsMobile();

  // Staff includes Managers and Volunteers
  const isStaff = isManager || isVolunteer;

  // Determine the default active tab based on role
  const defaultTab = isStaff ? "participants" : "history";
  const [activeTab, setActiveTab] = React.useState(defaultTab);

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

  // Determine write access: Managers always have it, Volunteers only if assigned
  const hasWriteAccess = isManager || (isVolunteer && isAssignedVolunteer);

  // Determine if the current user is a participant in this batch
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
              <CalendarDays className="h-6 w-6 text-primary" />
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
                {/* Participants Tab: Visible to Managers and Volunteers */}
                {(isManager || isVolunteer) && (
                  <TabsTrigger
                    value="participants"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                  >
                    <Users className="h-4 w-4 mr-2" /> Participants
                  </TabsTrigger>
                )}
                {/* Attendance Tab: Visible to Managers and Volunteers */}
                {(isManager || isVolunteer) && (
                  <TabsTrigger
                    value="attendance"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                  >
                    <CalendarDays className="h-4 w-4 mr-2" /> Attendance
                  </TabsTrigger>
                )}
                {/* Volunteers Tab: Visible only to Managers */}
                {isManager && (
                  <TabsTrigger
                    value="volunteers"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                  >
                    <User className="h-4 w-4 mr-2" /> Volunteers
                  </TabsTrigger>
                )}
                {/* History Tab: Visible to all */}
                <TabsTrigger
                  value="history"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 pt-2"
                >
                  <History className="h-4 w-4 mr-2" /> History
                </TabsTrigger>
                {/* Stats Tab: Visible to Managers and if the current user is a participant */}
                {(isManager || isParticipant) && (
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
                  readOnly={!hasWriteAccess} // Volunteers can view but not add/remove if not assigned
                />
              </TabsContent>
              <TabsContent value="attendance" className="m-0">
                <AttendanceTabContent
                  batch={batch}
                  participants={participants || []}
                  isLoadingParticipants={isLoadingParticipants}
                  isOpen={activeTab === "attendance"}
                  readOnly={!hasWriteAccess} // Only Managers or assigned Volunteers can mark attendance
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
                  participantId={user?.user_id} // Pass current user's ID for their stats
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