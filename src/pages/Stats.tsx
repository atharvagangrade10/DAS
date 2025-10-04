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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import ExportToExcelButton from "@/components/ExportToExcelButton";
import DownloadShareButton from "@/components/stats/DownloadShareButton";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";


// Import new mobile-specific components
import MobileProgramAttendance from "@/components/stats/MobileProgramAttendance";
import MobileDevoteeFriendAttendance from "@/components/stats/MobileDevoteeFriendAttendance";
import MobileSessionDistributionByProgram from "@/components/stats/MobileSessionDistributionByProgram";
import MobileSessionDistributionByDevoteeFriend from "@/components/stats/MobileSessionDistributionByDevoteeFriend";

interface DevoteeFriend {
  id: string;
  name: string;
  phone: string;
  email: string;
}

// Define the interface for the export row
interface DevoteeFriendAttendanceExportRow {
  "Program Name DYS": string; // Combines program name, session name, and date
  [devoteeFriendName: string]: string | number; // Dynamic keys for devotee friends
}

const Stats = () => {
  const isMobile = useIsMobile();
  const [isDownloadingAllDfCards, setIsDownloadingAllDfCards] = React.useState(false);
  const [selectedProgramFilterId, setSelectedProgramFilterId] = React.useState<string | null>(null);


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

  // Set default selected program once programs are loaded
  React.useEffect(() => {
    if (programs && programs.length > 0 && !selectedProgramFilterId) {
      setSelectedProgramFilterId(programs[0].id);
    }
  }, [programs, selectedProgramFilterId]);

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
      const programsMap = new Map(programs.map(p => [p.id, p]));

      Object.values(allAttendedProgramsMap).forEach(attendedPrograms => {
        attendedPrograms.forEach(attendedProgram => {
          // Apply program filter here
          if (selectedProgramFilterId && attendedProgram.program_id !== selectedProgramFilterId) {
            return;
          }

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
  }, [allAttendedProgramsMap, programs, selectedProgramFilterId]);

  // Devotee Friend Session Attendance
  const devoteeFriendProgramSessionAttendance = React.useMemo(() => {
    const dfAttendance: Record<string, Record<string, { program_name: string; sessions: Record<string, { name: string; date: string; count: number }> }>> = {};

    const allDevoteeFriendNames = new Set<string>();
    if (devoteeFriends) {
      devoteeFriends.forEach(df => allDevoteeFriendNames.add(df.name));
    }
    allDevoteeFriendNames.add("None");

    allDevoteeFriendNames.forEach(dfName => {
      dfAttendance[dfName] = {};
    });

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

    const sortedDfAttendance = Object.entries(dfAttendance).map(([dfName, programsData]) => ({
      devoteeFriendName: dfName,
      programs: Object.values(programsData).map(program => ({
        ...program,
        sessions: Object.values(program.sessions).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      })).sort((a, b) => a.program_name.localeCompare(b.program_name)),
    })).sort((a, b) => a.devoteeFriendName.localeCompare(b.devoteeFriendName));

    return sortedDfAttendance;
  }, [allParticipants, allAttendedProgramsMap, programs, devoteeFriends]);

  // Prepare data for Devotee Friend Session Attendance export and table rendering
  const { allDevoteeFriendNames, sortedUniqueSessions, dataForDevoteeFriendAttendanceExport } = React.useMemo(() => {
    const allDfNames: string[] = [];
    devoteeFriendProgramSessionAttendance.forEach(df => {
      allDfNames.push(df.devoteeFriendName);
    });
    if (!allDfNames.includes("None") && devoteeFriendProgramSessionAttendance.some(df => df.devoteeFriendName === "None")) {
        allDfNames.push("None");
    }
    allDfNames.sort();

    const uniqueProgramSessions = new Map<string, { programName: string; sessionName: string; sessionDate: string }>();

    devoteeFriendProgramSessionAttendance.forEach(df => {
      df.programs.forEach(program => {
        program.sessions.forEach(session => {
          const key = `${program.program_name}-${session.name}-${session.date}`;
          if (!uniqueProgramSessions.has(key)) {
            uniqueProgramSessions.set(key, {
              programName: program.program_name,
              sessionName: session.name,
              sessionDate: session.date,
            });
          }
        });
      });
    });

    const sortedUniqueSessionsArray = Array.from(uniqueProgramSessions.values()).sort((a, b) => {
      const programCompare = a.programName.localeCompare(b.programName);
      if (programCompare !== 0) return programCompare;
      return new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime();
    });

    const exportData: DevoteeFriendAttendanceExportRow[] = [];

    sortedUniqueSessionsArray.forEach(sessionDetail => {
      const formattedDate = format(parseISO(sessionDetail.sessionDate), "yyyy-MM-dd");
      const row: DevoteeFriendAttendanceExportRow = {
        "Program Name DYS": `${sessionDetail.programName} - ${sessionDetail.sessionName} (${formattedDate})`,
      };

      allDfNames.forEach(dfName => {
        let attendanceCount = 0;
        const dfData = devoteeFriendProgramSessionAttendance.find(df => df.devoteeFriendName === dfName);
        if (dfData) {
          dfData.programs.forEach(program => {
            if (program.program_name === sessionDetail.programName) {
              program.sessions.forEach(session => {
                if (session.name === sessionDetail.sessionName && session.date === sessionDetail.sessionDate) {
                  attendanceCount = session.count;
                }
              });
            }
          });
        }
        row[dfName] = attendanceCount > 0 ? attendanceCount : "";
      });
      exportData.push(row);
    });

    return {
      allDevoteeFriendNames: allDfNames,
      sortedUniqueSessions: sortedUniqueSessionsArray,
      dataForDevoteeFriendAttendanceExport: exportData,
    };
  }, [devoteeFriendProgramSessionAttendance]);


  // Session Attendance Distribution
  const sessionAttendanceDistribution = React.useMemo(() => {
    const globalDistributionByProgram: Record<string, Record<number, number>> = {};
    const devoteeFriendDistribution: Record<string, Record<number, number>> = {};

    const allDevoteeFriendNamesSet = new Set<string>();
    if (devoteeFriends) {
      devoteeFriends.forEach(df => allDevoteeFriendNamesSet.add(df.name));
    }
    allDevoteeFriendNamesSet.add("None");

    allDevoteeFriendNamesSet.forEach(dfName => {
      devoteeFriendDistribution[dfName] = {};
    });

    if (allParticipants && allAttendedProgramsMap && programs) {
      allParticipants.forEach(participant => {
        const devoteeFriendName = participant.devotee_friend_name || "None";
        const attendedProgramsForParticipant = allAttendedProgramsMap[participant.id] || [];

        let totalSessionsAttendedByParticipantOverall = 0;

        attendedProgramsForParticipant.forEach(program => {
          const programId = program.program_id;
          const numSessionsAttendedInThisProgram = program.sessions_attended.length;

          if (!globalDistributionByProgram[programId]) {
            globalDistributionByProgram[programId] = {};
          }
          globalDistributionByProgram[programId][numSessionsAttendedInThisProgram] = (globalDistributionByProgram[programId][numSessionsAttendedInThisProgram] || 0) + 1;

          totalSessionsAttendedByParticipantOverall += numSessionsAttendedInThisProgram;
        });

        if (!devoteeFriendDistribution[devoteeFriendName]) {
          devoteeFriendDistribution[devoteeFriendName] = {};
        }
        devoteeFriendDistribution[devoteeFriendName][totalSessionsAttendedByParticipantOverall] = (devoteeFriendDistribution[devoteeFriendName][totalSessionsAttendedByParticipantOverall] || 0) + 1;
      });
    }

    const sortedGlobalDistributionByProgram = Object.entries(globalDistributionByProgram)
      .map(([programId, distribution]) => ({
        programId,
        programName: programs?.find(p => p.id === programId)?.program_name || "Unknown Program",
        distribution: Object.entries(distribution)
          .map(([num, count]) => ({ numSessions: Number(num), count }))
          .sort((a, b) => a.numSessions - b.numSessions),
      }))
      .sort((a, b) => a.programName.localeCompare(b.programName));

    const sortedDevoteeFriendDistribution = Object.entries(devoteeFriendDistribution)
      .map(([dfName, distribution]) => ({
        devoteeFriendName: dfName,
        distribution: Object.entries(distribution)
          .map(([num, count]) => ({ numSessions: Number(num), count }))
          .sort((a, b) => a.numSessions - b.numSessions),
      }))
      .sort((a, b) => a.devoteeFriendName.localeCompare(b.devoteeFriendName));

    return { globalByProgram: sortedGlobalDistributionByProgram, byDevoteeFriend: sortedDevoteeFriendDistribution };
  }, [allParticipants, allAttendedProgramsMap, programs, devoteeFriends]);


  const isLoading = isLoadingParticipants || isLoadingFriends || isLoadingPrograms || isLoadingAllAttendedPrograms;
  const hasError = participantsError || friendsError || programsError || allAttendedProgramsError;
  const isExportDfAttendanceButtonDisabled = isLoading || dataForDevoteeFriendAttendanceExport.length === 0;

  const handleDownloadAllDfCards = async () => {
    setIsDownloadingAllDfCards(true);
    if (!devoteeFriendProgramSessionAttendance || devoteeFriendProgramSessionAttendance.length === 0) {
      toast.info("No devotee friend attendance data to download.");
      setIsDownloadingAllDfCards(false);
      return;
    }

    for (const df of devoteeFriendProgramSessionAttendance) {
      const cardId = `df-attendance-${df.devoteeFriendName.replace(/\s+/g, '-').toLowerCase()}`;
      const cardElement = document.getElementById(cardId);

      if (!cardElement) {
        console.warn(`Could not find card element for ${df.devoteeFriendName}. Skipping.`);
        continue;
      }

      // Store original styles
      const originalCardOverflow = cardElement.style.overflow;
      const originalCardHeight = cardElement.style.height;

      // Temporarily modify styles for capture
      cardElement.style.overflow = 'visible';
      cardElement.style.height = 'auto';

      const accordionContents = cardElement.querySelectorAll('div[data-state="open"].overflow-hidden');
      const originalAccordionOverflows: string[] = [];
      accordionContents.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        originalAccordionOverflows.push(htmlEl.style.overflow);
        htmlEl.style.overflow = 'visible';
      });

      try {
        await new Promise(resolve => setTimeout(resolve, 50)); // Give browser time to apply styles

        const canvas = await html2canvas(cardElement, {
          useCORS: true,
          scale: 2,
        });
        const imageDataUrl = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = imageDataUrl;
        link.download = `${df.devoteeFriendName.replace(/\s/g, "_").toLowerCase()}_attendance.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between downloads
      } catch (error) {
        console.error(`Error capturing or downloading card for ${df.devoteeFriendName}:`, error);
        toast.error(`Failed to download card for ${df.devoteeFriendName}`);
      } finally {
        // Revert styles
        cardElement.style.overflow = originalCardOverflow;
        cardElement.style.height = originalCardHeight;
        accordionContents.forEach((el: Element, index) => {
          (el as HTMLElement).style.overflow = originalAccordionOverflows[index];
        });
      }
    }
    toast.success("All devotee friend attendance cards downloaded!");
    setIsDownloadingAllDfCards(false);
  };


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
          <Card className="shadow-lg" id="total-participants-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Total Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalParticipants}</div>
              <p className="text-xs text-muted-foreground">
                Current number of registered participants.
              </p>
              <DownloadShareButton cardId="total-participants-card" cardTitle="Total Participants" />
            </CardContent>
          </Card>

          <Card className="shadow-lg" id="total-devotee-friends-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Total Devotee Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalDevoteeFriends}</div>
              <p className="text-xs text-muted-foreground">
                Number of registered devotee friends.
              </p>
              <DownloadShareButton cardId="total-devotee-friends-card" cardTitle="Total Devotee Friends" />
            </CardContent>
          </Card>

          <Card className="shadow-lg" id="participants-without-df-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Participants Without Devotee Friend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{participantsWithoutDevoteeFriend}</div>
              <p className="text-xs text-muted-foreground">
                Participants not associated with a devotee friend.
              </p>
              <DownloadShareButton cardId="participants-without-df-card" cardTitle="Participants Without Devotee Friend" />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 shadow-lg" id="program-attendance-overview-card">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Program and Session Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="program-filter-overview">Select Program</Label>
                <Select
                  value={selectedProgramFilterId || ""}
                  onValueChange={setSelectedProgramFilterId}
                  disabled={isLoadingPrograms || !programs || programs.length === 0}
                >
                  <SelectTrigger id="program-filter-overview" className="w-[280px]">
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs?.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.program_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isMobile ? (
                <>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Mobile-Optimized View</h3>
                  <MobileProgramAttendance data={programSessionAttendance} />
                  <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">Full Table View</h3>
                  {programSessionAttendance.length > 0 ? (
                    <ScrollArea className="h-96 pr-4 border rounded-md">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Program Name</TableHead>
                            <TableHead>Session Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Attendees</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {programSessionAttendance.map((program) => (
                            <React.Fragment key={program.program_name}>
                              {program.sessions.map((session, index) => (
                                <TableRow key={`${program.program_name}-${session.name}-${session.date}`}>
                                  {index === 0 && (
                                    <TableCell rowSpan={program.sessions.length} className="font-medium align-top">
                                      {program.program_name}
                                    </TableCell>
                                  )}
                                  <TableCell>{session.name}</TableCell>
                                  <TableCell>{format(parseISO(session.date), "MMM dd, yyyy")}</TableCell>
                                  <TableCell className="text-right">{session.count}</TableCell>
                                </TableRow>
                              ))}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">No program or session attendance data available yet.</p>
                  )}
                </>
              ) : programSessionAttendance.length > 0 ? (
                <ScrollArea className="h-96 pr-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Program Name</TableHead>
                        <TableHead>Session Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Attendees</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programSessionAttendance.map((program) => (
                        <React.Fragment key={program.program_name}>
                          {program.sessions.map((session, index) => (
                            <TableRow key={`${program.program_name}-${session.name}-${session.date}`}>
                              {index === 0 && (
                                <TableCell rowSpan={program.sessions.length} className="font-medium align-top">
                                  {program.program_name}
                                </TableCell>
                              )}
                              <TableCell>{session.name}</TableCell>
                              <TableCell>{format(parseISO(session.date), "MMM dd, yyyy")}</TableCell>
                              <TableCell className="text-right">{session.count}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No program or session attendance data available yet.</p>
              )}
              <DownloadShareButton cardId="program-attendance-overview-card" cardTitle="Program and Session Attendance Overview" />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 shadow-lg" id="devotee-friend-attendance-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Devotee Friend Session Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Mobile-Optimized View</h3>
                  <MobileDevoteeFriendAttendance data={devoteeFriendProgramSessionAttendance} />
                  <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">Full Table View</h3>
                  {devoteeFriendProgramSessionAttendance.length > 0 && allDevoteeFriendNames.length > 0 && sortedUniqueSessions.length > 0 ? (
                    <div className="relative overflow-x-auto max-h-[500px] border rounded-md">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky left-0 bg-background z-20 w-[300px] min-w-[300px]">Program/Session (Date)</TableHead>
                            {allDevoteeFriendNames.map(dfName => (
                              <TableHead key={dfName} className="text-center min-w-[150px] bg-background z-10">
                                {dfName}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedUniqueSessions.map((sessionDetail, rowIndex) => (
                            <TableRow key={`row-${rowIndex}`}>
                              <TableCell className="sticky left-0 bg-background z-20 font-medium w-[300px] min-w-[300px]">
                                {sessionDetail.programName} - {sessionDetail.sessionName} ({format(parseISO(sessionDetail.sessionDate), "MMM dd, yyyy")})
                              </TableCell>
                              {allDevoteeFriendNames.map(dfName => {
                                let attendanceCount = 0;
                                const dfData = devoteeFriendProgramSessionAttendance.find(df => df.devoteeFriendName === dfName);
                                if (dfData) {
                                  dfData.programs.forEach(program => {
                                    if (program.program_name === sessionDetail.programName) {
                                      program.sessions.forEach(session => {
                                        if (session.name === sessionDetail.sessionName && session.date === sessionDetail.sessionDate) {
                                          attendanceCount = session.count;
                                        }
                                      });
                                    }
                                  });
                                }
                                return (
                                  <TableCell key={`${dfName}-${rowIndex}`} className="text-center">
                                    {attendanceCount > 0 ? attendanceCount : "-"}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No devotee friend attendance data available yet.</p>
                  )}
                </>
              ) : (
                devoteeFriendProgramSessionAttendance.length > 0 && allDevoteeFriendNames.length > 0 && sortedUniqueSessions.length > 0 ? (
                  <div className="relative overflow-x-auto max-h-[500px] border rounded-md">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-background z-20 w-[300px] min-w-[300px]">Program/Session (Date)</TableHead>
                          {allDevoteeFriendNames.map(dfName => (
                            <TableHead key={dfName} className="text-center min-w-[150px] bg-background z-10">
                              {dfName}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedUniqueSessions.map((sessionDetail, rowIndex) => (
                          <TableRow key={`row-${rowIndex}`}>
                            <TableCell className="sticky left-0 bg-background z-20 font-medium w-[300px] min-w-[300px]">
                              {sessionDetail.programName} - {sessionDetail.sessionName} ({format(parseISO(sessionDetail.sessionDate), "MMM dd, yyyy")})
                            </TableCell>
                            {allDevoteeFriendNames.map(dfName => {
                              let attendanceCount = 0;
                              const dfData = devoteeFriendProgramSessionAttendance.find(df => df.devoteeFriendName === dfName);
                              if (dfData) {
                                dfData.programs.forEach(program => {
                                  if (program.program_name === sessionDetail.programName) {
                                    program.sessions.forEach(session => {
                                      if (session.name === sessionDetail.sessionName && session.date === sessionDetail.sessionDate) {
                                        attendanceCount = session.count;
                                      }
                                    });
                                  }
                                });
                              }
                              return (
                                <TableCell key={`${dfName}-${rowIndex}`} className="text-center">
                                  {attendanceCount > 0 ? attendanceCount : "-"}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No devotee friend attendance data available yet.</p>
                )
              )}
              <div className="flex justify-end gap-2 mt-4">
                <ExportToExcelButton
                  data={dataForDevoteeFriendAttendanceExport}
                  fileName="devotee_friend_session_attendance"
                  sheetName="DF Attendance"
                  disabled={isExportDfAttendanceButtonDisabled}
                />
                {isMobile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAllDfCards}
                    disabled={isDownloadingAllDfCards || devoteeFriendProgramSessionAttendance.length === 0}
                    className="flex items-center gap-1"
                  >
                    {isDownloadingAllDfCards ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download All
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 shadow-lg" id="session-attendance-distribution-card">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Session Attendance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-xl font-semibold mb-3 text-primary dark:text-primary-foreground">Overall Distribution by Program</h3>
              {isMobile ? (
                <>
                  <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Mobile-Optimized View</h4>
                  <MobileSessionDistributionByProgram data={sessionAttendanceDistribution.globalByProgram} />
                  <h4 className="text-lg font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">Full Table View</h4>
                  {sessionAttendanceDistribution.globalByProgram.length > 0 ? (
                    <ScrollArea className="h-96 pr-4 mb-6 border rounded-md">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Program Name</TableHead>
                            <TableHead>Sessions Attended</TableHead>
                            <TableHead className="text-right">Participants Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessionAttendanceDistribution.globalByProgram.map((programData) => (
                            <React.Fragment key={programData.programId}>
                              {programData.distribution.map((item, index) => (
                                <TableRow key={`${programData.programId}-${item.numSessions}`}>
                                  {index === 0 && (
                                    <TableCell rowSpan={programData.distribution.length} className="font-medium align-top">
                                      {programData.programName}
                                    </TableCell>
                                  )}
                                  <TableCell>{item.numSessions} session{item.numSessions !== 1 ? "s" : ""}</TableCell>
                                  <TableCell className="text-right">{item.count}</TableCell>
                                </TableRow>
                              ))}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-6">No overall session attendance distribution data available.</p>
                  )}
                </>
              ) : sessionAttendanceDistribution.globalByProgram.length > 0 ? (
                <ScrollArea className="h-96 pr-4 mb-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Program Name</TableHead>
                        <TableHead>Sessions Attended</TableHead>
                        <TableHead className="text-right">Participants Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionAttendanceDistribution.globalByProgram.map((programData) => (
                        <React.Fragment key={programData.programId}>
                          {programData.distribution.map((item, index) => (
                            <TableRow key={`${programData.programId}-${item.numSessions}`}>
                              {index === 0 && (
                                <TableCell rowSpan={programData.distribution.length} className="font-medium align-top">
                                  {programData.programName}
                                </TableCell>
                              )}
                              <TableCell>{item.numSessions} session{item.numSessions !== 1 ? "s" : ""}</TableCell>
                              <TableCell className="text-right">{item.count}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground mb-6">No overall session attendance distribution data available.</p>
              )}

              <h3 className="text-xl font-semibold mb-3 text-primary dark:text-primary-foreground">By Devotee Friend (Total Sessions Attended)</h3>
              {isMobile ? (
                <>
                  <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Mobile-Optimized View</h4>
                  <MobileSessionDistributionByDevoteeFriend data={sessionAttendanceDistribution.byDevoteeFriend} />
                  <h4 className="text-lg font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200">Full Table View</h4>
                  {sessionAttendanceDistribution.byDevoteeFriend.length > 0 ? (
                    <ScrollArea className="h-96 pr-4 border rounded-md">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Devotee Friend</TableHead>
                            <TableHead>Total Sessions Attended</TableHead>
                            <TableHead className="text-right">Participants Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessionAttendanceDistribution.byDevoteeFriend.map((df) => (
                            <React.Fragment key={df.devoteeFriendName}>
                              {df.distribution.map((item, index) => (
                                <TableRow key={`${df.devoteeFriendName}-${item.numSessions}`}>
                                  {index === 0 && (
                                    <TableCell rowSpan={df.distribution.length} className="font-medium align-top">
                                      {df.devoteeFriendName}
                                    </TableCell>
                                  )}
                                  <TableCell>{item.numSessions} session{item.numSessions !== 1 ? "s" : ""}</TableCell>
                                  <TableCell className="text-right">{item.count}</TableCell>
                                </TableRow>
                              ))}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">No devotee friend session attendance distribution data available.</p>
                  )}
                </>
              ) : sessionAttendanceDistribution.byDevoteeFriend.length > 0 ? (
                <ScrollArea className="h-96 pr-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Devotee Friend</TableHead>
                        <TableHead>Total Sessions Attended</TableHead>
                        <TableHead className="text-right">Participants Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionAttendanceDistribution.byDevoteeFriend.map((df) => (
                        <React.Fragment key={df.devoteeFriendName}>
                          {df.distribution.map((item, index) => (
                            <TableRow key={`${df.devoteeFriendName}-${item.numSessions}`}>
                              {index === 0 && (
                                <TableCell rowSpan={df.distribution.length} className="font-medium align-top">
                                  {df.devoteeFriendName}
                                </TableCell>
                              )}
                              <TableCell>{item.numSessions} session{item.numSessions !== 1 ? "s" : ""}</TableCell>
                              <TableCell className="text-right">{item.count}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No devotee friend session attendance distribution data available.</p>
              )}
              <DownloadShareButton cardId="session-attendance-distribution-card" cardTitle="Session Attendance Distribution" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Stats;