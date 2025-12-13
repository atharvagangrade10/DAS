"use client";

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AttendedProgram, Participant } from '@/types/participant';
import { Program, Session } from '@/types/program';
import CreateParticipantDialog from '@/components/CreateParticipantDialog';
import ParticipantCard from '@/components/ParticipantCard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ExportToExcelButton from '@/components/ExportToExcelButton';
import { format, parseISO } from 'date-fns';

import {
  fetchAllParticipants,
  fetchDevoteeFriends,
  fetchPrograms,
  fetchProgramSessions,
  fetchAttendedPrograms,
} from "@/utils/api";

interface DevoteeFriend {
  id: string;
  name: string;
}

interface ExportParticipantData extends Participant {
  attended_programs_summary: string;
  attended_sessions_details: string;
}

const ParticipantsPage = () => {
  const queryClient = useQueryClient();
  const [isCreateParticipantDialogOpen, setIsCreateParticipantDialogOpen] = React.useState(false);
  const [selectedDevoteeFriendName, setSelectedDevoteeFriendName] = React.useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = React.useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null);

  const { data: allParticipants, isLoading: isLoadingParticipants, error: participantsError } = useQuery<Participant[], Error>({
    queryKey: ["allParticipants"],
    queryFn: fetchAllParticipants,
  });

  const { data: devoteeFriends, isLoading: isLoadingFriends, error: friendsError } = useQuery<DevoteeFriend[], Error>({
    queryKey: ["devoteeFriends"],
    queryFn: fetchDevoteeFriends,
  });

  const { data: programs, isLoading: isLoadingPrograms, error: programsError } = useQuery<Program[], Error>({
    queryKey: ["programs"],
    queryFn: fetchPrograms,
  });

  const { data: sessions, isLoading: isLoadingSessions, error: sessionsError } = useQuery<Session[], Error>({
    queryKey: ["programSessions", selectedProgramId],
    queryFn: () => fetchProgramSessions(selectedProgramId!),
    enabled: !!selectedProgramId,
  });

  const { data: allAttendedProgramsMap, isLoading: isLoadingAllAttendedPrograms, error: allAttendedProgramsError } = useQuery<Record<string, AttendedProgram[]>, Error>({
    queryKey: ["allAttendedPrograms"],
    queryFn: async () => {
      if (!allParticipants) return {};
      const promises = allParticipants.map(async (participant) => {
        try {
          const programs = await fetchAttendedPrograms(participant.id);
          return { participantId: participant.id, programs };
        } catch (e) {
          console.error(`Failed to fetch attended programs for participant ${participant.id}:`, e);
          return { participantId: participant.id, programs: [] };
        }
      });
      const results = await Promise.all(promises);
      return results.reduce((acc, curr) => {
        acc[curr.participantId] = curr.programs;
        return acc;
      }, {});
    },
    enabled: !!allParticipants && allParticipants.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  React.useEffect(() => {
    if (participantsError) {
      toast.error("Error loading participants", { description: participantsError.message });
    }
    if (friendsError) {
      toast.error("Error loading devotee friends for filter", { description: friendsError.message });
    }
    if (programsError) {
      toast.error("Error loading programs for filter", { description: programsError.message });
    }
    if (sessionsError) {
      toast.error("Error loading sessions for filter", { description: sessionsError.message });
    }
    if (allAttendedProgramsError) {
      toast.error("Error loading attended programs for export", { description: allAttendedProgramsError.message });
    }
  }, [participantsError, friendsError, programsError, sessionsError, allAttendedProgramsError]);

  const handleParticipantCreationSuccess = (newParticipant: Participant) => {
    queryClient.invalidateQueries({ queryKey: ["allParticipants"] });
    queryClient.invalidateQueries({ queryKey: ["allAttendedPrograms"] });
    setIsCreateParticipantDialogOpen(false);
  };

  const handleParticipantUpdate = (updatedParticipant: Participant | null) => {
    // Invalidate queries to refetch the list and remove the deleted participant
    queryClient.invalidateQueries({ queryKey: ["allParticipants"] });
    queryClient.invalidateQueries({ queryKey: ["allAttendedPrograms"] });
  };

  const filteredParticipants = React.useMemo(() => {
    if (!allParticipants) return [];
    let currentParticipants = allParticipants;

    if (selectedDevoteeFriendName) {
      if (selectedDevoteeFriendName === "None") {
        currentParticipants = currentParticipants.filter(p => !p.devotee_friend_name || p.devotee_friend_name === "None");
      } else if (selectedDevoteeFriendName !== "All") {
        currentParticipants = currentParticipants.filter(p => p.devotee_friend_name === selectedDevoteeFriendName);
      }
    }

    if (selectedProgramId && selectedProgramId !== "All" && allAttendedProgramsMap) {
      currentParticipants = currentParticipants.filter(participant => {
        const attendedPrograms = allAttendedProgramsMap[participant.id] || [];
        const hasAttendedProgram = attendedPrograms.some(ap => ap.program_id === selectedProgramId);

        if (selectedSessionId && selectedSessionId !== "All") {
          return hasAttendedProgram && attendedPrograms.some(ap => 
            ap.program_id === selectedProgramId && 
            ap.sessions_attended.some(sa => sa.session_id === selectedSessionId)
          );
        }
        return hasAttendedProgram;
      });
    }

    return currentParticipants;
  }, [allParticipants, selectedDevoteeFriendName, selectedProgramId, selectedSessionId, allAttendedProgramsMap]);

  const dataForExport: ExportParticipantData[] = React.useMemo(() => {
    if (!filteredParticipants || !allAttendedProgramsMap) return [];

    return filteredParticipants.map(participant => {
      const attendedPrograms = allAttendedProgramsMap[participant.id] || [];
      
      const attended_programs_summary = attendedPrograms.map(program => 
        `${program.program_name} (${program.sessions_attended.length} sessions)`
      ).join("; ");

      const attended_sessions_details = attendedPrograms.map(program => 
        `${program.program_name}: ${program.sessions_attended.map(session => 
          `${session.session_name} (${format(parseISO(session.session_date), "yyyy-MM-dd")}, ${session.status})`
        ).join(", ")}`
      ).join("; ");

      return {
        ...participant,
        attended_programs_summary: attended_programs_summary || "N/A",
        attended_sessions_details: attended_sessions_details || "N/A",
      };
    });
  }, [filteredParticipants, allAttendedProgramsMap]);

  const isExportButtonDisabled = isLoadingParticipants || isLoadingAllAttendedPrograms;

  return (
    <div className="container mx-auto p-6 sm:p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">All Participants</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl">
          View and manage all participants. Use filters to narrow down the list.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 max-w-xs">
          <Label htmlFor="devotee-friend-filter">Filter by Devotee Friend</Label>
          <Select
            onValueChange={(value) => setSelectedDevoteeFriendName(value)}
            value={selectedDevoteeFriendName || "All"}
            disabled={isLoadingFriends}
          >
            <SelectTrigger id="devotee-friend-filter">
              <SelectValue placeholder="Select a friend" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Devotee Friends</SelectItem>
              <SelectItem value="None">No Devotee Friend</SelectItem>
              {devoteeFriends?.map((friend) => (
                <SelectItem key={friend.id} value={friend.name}>
                  {friend.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 max-w-xs">
          <Label htmlFor="program-filter">Filter by Program</Label>
          <Select
            onValueChange={(value) => {
              setSelectedProgramId(value === "All" ? null : value);
              setSelectedSessionId(null);
            }}
            value={selectedProgramId || "All"}
            disabled={isLoadingPrograms}
          >
            <SelectTrigger id="program-filter">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Programs</SelectItem>
              {programs?.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.program_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 max-w-xs">
          <Label htmlFor="session-filter">Filter by Session</Label>
          <Select
            onValueChange={(value) => setSelectedSessionId(value === "All" ? null : value)}
            value={selectedSessionId || "All"}
            disabled={!selectedProgramId || isLoadingSessions}
          >
            <SelectTrigger id="session-filter">
              <SelectValue placeholder="Select a session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Sessions</SelectItem>
              {sessions?.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsCreateParticipantDialogOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Add New Participant
        </Button>
        <ExportToExcelButton data={dataForExport} fileName="participants_data" disabled={isExportButtonDisabled} />
      </div>

      {isLoadingParticipants || isLoadingAllAttendedPrograms ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : participantsError ? (
        <p className="text-red-500">Error: {participantsError.message}</p>
      ) : filteredParticipants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParticipants.map((participant) => (
            <ParticipantCard key={participant.id} participant={participant} onParticipantUpdate={handleParticipantUpdate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 text-xl">No participants found.</p>
          <p className="text-gray-500">Adjust your filters or add a new participant.</p>
        </div>
      )}

      <CreateParticipantDialog
        isOpen={isCreateParticipantDialogOpen}
        onOpenChange={setIsCreateParticipantDialogOpen}
        onCreationSuccess={handleParticipantCreationSuccess}
      />
    </div>
  );
};

export default ParticipantsPage;