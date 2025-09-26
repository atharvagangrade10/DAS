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
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Aggregate session attendance, grouped by program (existing logic)
  const programSessionAttendance = React.useMemo(() => {
    const programAttendance: Record<string, { program_name: string; sessions: Record<string, { name: string; date: string; count: number }> }> = {};

    if (allAttendedProgramsMap && programs) {
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

    const sortedProgramAttendance = Object.values(programAttendance).map(program => ({
      ...program,
      sessions: Object.values(program.sessions).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }));

    return sortedProgramAttendance.sort((a, b) => a.program_name.localeCompare(b.program_name));
  }, [allAttendedProgramsMap, programs]);

  // NEW: Devotee Friend Session Attendance
  const devoteeFriendProgramSessionAttendance = React.useMemo(() => {
    const dfAttendance: Record<string, Record<string, Record<string, { name: string; date: string; count: number }>>> = {};

    if (allParticipants && allAttendedProgramsMap && programs) {
      const programsMap = new Map(programs.map(p => [p.id, p]));

      allParticipants.forEach(participant => {
        const devoteeFriendName = participant.devotee_friend_name || "None";
        const attendedProgramsForParticipant = allAttendedProgramsMap[participant.id] || [];

        if (!dfAttendance[devoteeFriendName]) {
          dfAttendance[devoteeFriendName] = {};
        }

        attendedProgramsForParticipant.forEach(attendedProgram => {
          const programId = attendedProgram.program_id;
          const programDetails = programsMap.get(programId);

          if (!dfAttendance[devoteeFriendName][programId]) {
            dfAttendance[devoteeFriendName][programId] = {
              program_name: programDetails?.program_name || attendedProgram.program_name,
              sessions: {},
            };
          }

          attendedProgram.sessions_attended.forEach(session => {
            const sessionId = session.session_id;
            if (dfAttendance[devoteeFriendName][programId].sessions[sessionId]) {
              dfAttendance[devoteeFriendName][programId].sessions[sessionId].count++;
            } else {
              dfAttendance[devoteeFriendName][programId].sessions[sessionId] = {
                name: session.session_name,
                date: session.session_date,
                count: 1,
              };
            }
          });
        });
      });
    }

    // Convert to sorted arrays for display
    const sortedDfAttendance = Object.entries(dfAttendance).map(([dfName, programsData]) => ({
      devoteeFriendName: dfName,
      programs: Object.values(programsData).map(program => ({
        ...program,
        sessions: Object.values(program.sessions).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      })).sort((a, b) => a.program_name.localeCompare(b.program_name)),
    })).sort((a, b) => a.devoteeFriendName.localeCompare(b.devoteeFriendName));

    return sortedDfAttendance;
  }, [allParticipants, allAttendedProgramsMap, programs]);

  // NEW: Session Attendance Distribution
  const sessionAttendanceDistribution = React.useMemo(() => {
    // NEW: Global distribution by program
    const globalDistributionByProgram: Record<string, Record<number, number>> = {}; // { programId: { numSessionsInProgram: countOfParticipants } }

    // Existing: Devotee friend distribution (total sessions across all programs for a DF's participants)
    const devoteeFriendDistribution: Record<string, Record<number, number>> = {}; // { devoteeFriendName: { totalSessionsAttendedByParticipant: countOfParticipants } }

    if (allParticipants && allAttendedProgramsMap && programs) {
      const programsMap = new Map(programs.map(p => [p.id, p.program_name])); // For program name lookup

      allParticipants.forEach(participant => {
        const devoteeFriendName = participant.devotee_friend_name || "None";
        const attendedProgramsForParticipant = allAttendedProgramsMap[participant.id] || [];

        let totalSessionsAttendedByParticipantOverall = 0; // For the existing devoteeFriendDistribution

        attendedProgramsForParticipant.forEach(program => {
          const programId = program.program_id;
          const numSessionsAttendedInThisProgram = program.sessions_attended.length;

          // Populate globalDistributionByProgram
          if (!globalDistributionByProgram[programId]) {
            globalDistributionByProgram[programId] = {};
          }
          globalDistributionByProgram[programId][numSessionsAttendedInThisProgram] = (globalDistributionByProgram[programId][numSessionsAttendedInThisProgram] || 0) + 1;

          totalSessionsAttendedByParticipantOverall += numSessionsAttendedInThisProgram;
        });

        // Populate devoteeFriendDistribution (this part remains the same as before for 'byDevoteeFriend')
        if (!devoteeFriendDistribution[devoteeFriendName]) {
          devoteeFriendDistribution[devoteeFriendName] = {};
        }
        devoteeFriendDistribution[devoteeFriendName][totalSessionsAttendedByParticipantOverall] = (devoteeFriendDistribution[devoteeFriendName][totalSessionsAttendedByParticipantOverall] || 0) + 1;
      });
    }

    // Sort global distribution by program
    const sortedGlobalDistributionByProgram = Object.entries(globalDistributionByProgram)
      .map(([programId, distribution]) => ({
        programId,
        programName: programs?.find(p => p.id === programId)?.program_name || "Unknown Program",
        distribution: Object.entries(distribution)
          .map(([num, count]) => ({ numSessions: Number(num), count }))
          .sort((a, b) => a.numSessions - b.numSessions),
      }))
      .sort((a, b) => a.programName.localeCompare(b.programName));


    // Existing sorting for byDevoteeFriend
    const sortedDevoteeFriendDistribution = Object.entries(devoteeFriendDistribution)
      .map(([dfName, distribution]) => ({
        devoteeFriendName: dfName,
        distribution: Object.entries(distribution)
          .map(([num, count]) => ({ numSessions: Number(num), count }))
          .sort((a, b) => a.numSessions - b.numSessions),
      }))
      .sort((a, b) => a.devoteeFriendName.localeCompare(b.devoteeFriendName));

    return { globalByProgram: sortedGlobalDistributionByProgram, byDevoteeFriend: sortedDevoteeFriendDistribution };
  }, [allParticipants, allAttendedProgramsMap, programs]);


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
          {[...Array(6)].map((_, i) => (
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
                <ScrollArea className="h-96 pr-4">
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

          {/* NEW: Devotee Friend Session Attendance */}
          <Card className="lg:col-span-3 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Devotee Friend Session Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {devoteeFriendProgramSessionAttendance.length > 0 ? (
                <ScrollArea className="h-96 pr-4">
                  <div className="space-y-8">
                    {devoteeFriendProgramSessionAttendance.map((df, dfIndex) => (
                      <div key={df.devoteeFriendName + dfIndex} className="border-b pb-6 last:border-b-0 last:pb-0">
                        <h2 className="text-2xl font-bold mb-4 text-accent-foreground dark:text-accent">
                          {df.devoteeFriendName}
                        </h2>
                        {df.programs.length > 0 ? (
                          <div className="space-y-4">
                            {df.programs.map((program, programIndex) => (
                              <div key={program.program_name + programIndex} className="ml-4 border-l-2 pl-4">
                                <h3 className="text-xl font-semibold mb-2 text-primary dark:text-primary-foreground">
                                  {program.program_name}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        ) : (
                          <p className="text-sm text-muted-foreground ml-4">No program attendance recorded for this devotee friend.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No devotee friend attendance data available yet.</p>
              )}
            </CardContent>
          </Card>

          {/* NEW: Session Attendance Distribution */}
          <Card className="lg:col-span-3 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Session Attendance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-xl font-semibold mb-3 text-primary dark:text-primary-foreground">Overall Distribution by Program</h3>
              {sessionAttendanceDistribution.globalByProgram.length > 0 ? (
                <ScrollArea className="h-96 pr-4 mb-6">
                  <div className="space-y-8">
                    {sessionAttendanceDistribution.globalByProgram.map((programData, programIndex) => (
                      <div key={programData.programId + programIndex} className="border-b pb-6 last:border-b-0 last:pb-0">
                        <h4 className="text-lg font-bold mb-3 text-accent-foreground dark:text-accent">
                          {programData.programName}
                        </h4>
                        {programData.distribution.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-4">
                            {programData.distribution.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                                <span className="text-sm font-medium">{item.numSessions} session{item.numSessions !== 1 ? "s" : ""}:</span>
                                <span className="text-lg font-bold text-secondary-foreground">{item.count} participants</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground ml-4">No session attendance distribution for this program.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground mb-6">No overall session attendance distribution data available.</p>
              )}

              <h3 className="text-xl font-semibold mb-3 text-primary dark:text-primary-foreground">By Devotee Friend (Total Sessions Attended)</h3>
              {sessionAttendanceDistribution.byDevoteeFriend.length > 0 ? (
                <ScrollArea className="h-96 pr-4">
                  <div className="space-y-8">
                    {sessionAttendanceDistribution.byDevoteeFriend.map((df, dfIndex) => (
                      <div key={df.devoteeFriendName + dfIndex} className="border-b pb-6 last:border-b-0 last:pb-0">
                        <h4 className="text-lg font-bold mb-3 text-accent-foreground dark:text-accent">
                          {df.devoteeFriendName}
                        </h4>
                        {df.distribution.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-4">
                            {df.distribution.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                                <span className="text-sm font-medium">{item.numSessions} session{item.numSessions !== 1 ? "s" : ""}:</span>
                                <span className="text-lg font-bold text-secondary-foreground">{item.count} participants</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground ml-4">No session attendance distribution for this devotee friend.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No devotee friend session attendance distribution data available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Stats;