"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  fetchAllParticipants,
  fetchDevoteeFriends,
  fetchPrograms,
  fetchAttendedPrograms,
} from "@/utils/api";
import { Participant, AttendedProgram } from "@/types/participant";
import { Program } from "@/types/program";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

interface DevoteeFriend {
  id: string;
  name: string;
  phone: string;
  email: string;
}

const Stats = () => {
  // Fetch all participants
  const { data: allParticipants, isLoading: isLoadingParticipants, error: participantsError } = useQuery<Participant[], Error>({
    queryKey: ["allParticipants"],
    queryFn: fetchAllParticipants,
  });

  // Fetch all devotee friends
  const { data: devoteeFriends, isLoading: isLoadingFriends, error: friendsError } = useQuery<DevoteeFriend[], Error>({
    queryKey: ["devoteeFriends"],
    queryFn: fetchDevoteeFriends,
  });

  // Fetch all programs (needed to get session names/dates)
  const { data: programs, isLoading: isLoadingPrograms, error: programsError } = useQuery<Program[], Error>({
    queryKey: ["programs"],
    queryFn: fetchPrograms,
  });

  // Fetch all attended programs for all participants to aggregate session attendance
  const { data: allAttendedProgramsMap, isLoading: isLoadingAllAttendedPrograms, error: allAttendedProgramsError } = useQuery<Record<string, AttendedProgram[]>, Error>({
    queryKey: ["allAttendedProgramsForStats"], // Unique key to avoid conflicts
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
    if (participantsError) toast.error("Error loading participants", { description: participantsError.message });
    if (friendsError) toast.error("Error loading devotee friends", { description: friendsError.message });
    if (programsError) toast.error("Error loading programs", { description: programsError.message });
    if (allAttendedProgramsError) toast.error("Error loading attendance data", { description: allAttendedProgramsError.message });
  }, [participantsError, friendsError, programsError, allAttendedProgramsError]);

  // Calculate derived stats
  const totalParticipants = allParticipants?.length || 0;
  const totalDevoteeFriends = devoteeFriends?.length || 0;
  const participantsWithoutDevoteeFriend = allParticipants?.filter(p => !p.devotee_friend_name || p.devotee_friend_name === "None").length || 0;

  // Aggregate session attendance, grouped by program
  const programSessionAttendance = React.useMemo(() => {
    const programAttendance: Record<string, { program_name: string; sessions: Record<string, { name: string; date: string; count: number }> }> = {};

    if (allAttendedProgramsMap && programs) {
      // Create a map of all programs for easy lookup
      const programsMap = new Map(programs.map(p => [p.id, p]));

      Object.values(allAttendedProgramsMap).forEach(attendedPrograms => {
        attendedPrograms.forEach(attendedProgram => {
          const programId = attendedProgram.program_id;
          const programDetails = programsMap.get(programId);

          if (!programAttendance[programId]) {
            programAttendance[programId] = {
              program_name: programDetails?.program_name || attendedProgram.program_name,
              sessions: {},
            };
          }

          attendedProgram.sessions_attended.forEach(session => {
            const sessionId = session.session_id;
            if (programAttendance[programId].sessions[sessionId]) {
              programAttendance[programId].sessions[sessionId].count++;
            } else {
              programAttendance[programId].sessions[sessionId] = {
                name: session.session_name,
                date: session.session_date,
                count: 1,
              };
            }
          });
        });
      });
    }

    // Convert sessions from object to sorted array for each program
    const sortedProgramAttendance = Object.values(programAttendance).map(program => ({
      ...program,
      sessions: Object.values(program.sessions).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }));

    // Sort programs by name
    return sortedProgramAttendance.sort((a, b) => a.program_name.localeCompare(b.program_name));
  }, [allAttendedProgramsMap, programs]);

  const isLoading = isLoadingParticipants || isLoadingFriends || isLoadingPrograms || isLoadingAllAttendedPrograms;
  const hasError = participantsError || friendsError || programsError || allAttendedProgramsError;

  return (
    <div className="container mx-auto p-6 sm:p-8 space-y-8">
      <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Application Statistics</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl">
        Overview of key metrics across participants, devotee friends, and program attendance.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : hasError ? (
        <p className="text-red-500">An error occurred while loading statistics.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Total Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalParticipants}</div>
              <p className="text-xs text-muted-foreground">
                Current number of registered participants.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Total Devotee Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalDevoteeFriends}</div>
              <p className="text-xs text-muted-foreground">
                Number of registered devotee friends.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Participants Without Devotee Friend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{participantsWithoutDevoteeFriend}</div>
              <p className="text-xs text-muted-foreground">
                Participants not associated with a devotee friend.
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Program and Session Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {programSessionAttendance.length > 0 ? (
                <ScrollArea className="h-96 pr-4"> {/* Added ScrollArea for long lists */}
                  <div className="space-y-6">
                    {programSessionAttendance.map((program, programIndex) => (
                      <div key={program.program_name + programIndex} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <h3 className="text-xl font-semibold mb-3 text-primary dark:text-primary-foreground">
                          {program.program_name}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {program.sessions.map((session, sessionIndex) => (
                            <div key={session.name + session.date + sessionIndex} className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                              <span className="text-sm font-medium">{session.name} ({format(parseISO(session.date), "MMM dd")})</span>
                              <span className="text-lg font-bold text-secondary-foreground">{session.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No program or session attendance data available yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Stats;