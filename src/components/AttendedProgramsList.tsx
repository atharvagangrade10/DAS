"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AttendedProgram } from "@/types/participant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface AttendedProgramsListProps {
  participantId: string;
}

const fetchAttendedPrograms = async (
  participantId: string,
): Promise<AttendedProgram[]> => {
  const response = await fetch(
    `https://das-backend-o43a.onrender.com/participants/${participantId}/attended-programs`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch attended programs");
  }
  return response.json();
};

const AttendedProgramsList: React.FC<AttendedProgramsListProps> = ({
  participantId,
}) => {
  const {
    data: attendedPrograms,
    isLoading,
    error,
  } = useQuery<AttendedProgram[], Error>({
    queryKey: ["attendedPrograms", participantId],
    queryFn: () => fetchAttendedPrograms(participantId),
    enabled: !!participantId,
  });

  React.useEffect(() => {
    if (error) {
      toast.error("Error loading attended programs", {
        description: error.message,
      });
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 mt-4">Error: {error.message}</p>;
  }

  if (!attendedPrograms || attendedPrograms.length === 0) {
    return (
      <p className="text-gray-500 text-sm mt-4">No programs attended yet.</p>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-3">Attended Programs</h3>
      <div className="space-y-4">
        {attendedPrograms.map((program) => (
          <Card key={program.program_id} className="p-4">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-xl font-semibold">
                {program.program_name}
              </CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {format(parseISO(program.start_date), "PPP")} - {format(parseISO(program.end_date), "PPP")}
              </p>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {program.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {program.description}
                </p>
              )}
              <h4 className="font-medium text-sm mb-2">Sessions:</h4>
              {program.sessions_attended.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {program.sessions_attended.map((session) => (
                    <li key={session.session_id} className="flex items-center gap-2">
                      <span className="font-normal">{session.session_name}</span>
                      <span className="text-gray-500 dark:text-gray-400">({format(parseISO(session.session_date), "PPP")})</span>
                      <Badge variant="secondary">{session.status}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No sessions recorded for this program.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AttendedProgramsList;