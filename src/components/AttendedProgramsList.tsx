"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AttendedProgram } from "@/types/participant";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Error: {error.message}</p>;
  }

  if (!attendedPrograms || attendedPrograms.length === 0) {
    return (
      <p className="text-gray-500 text-sm">No programs attended yet.</p>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Attended Programs</h3>
      <Accordion type="single" collapsible className="w-full">
        {attendedPrograms.map((program) => (
          <AccordionItem key={program.program_id} value={program.program_id}>
            <AccordionTrigger className="text-base font-medium">
              {program.program_name} ({format(parseISO(program.start_date), "MMM yyyy")})
            </AccordionTrigger>
            <AccordionContent className="pl-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {program.description || "No description."}
              </p>
              <p className="text-sm mb-2">
                From: {format(parseISO(program.start_date), "PPP")} to{" "}
                {format(parseISO(program.end_date), "PPP")}
              </p>
              <h4 className="font-medium text-sm mb-1">Sessions Attended:</h4>
              {program.sessions_attended.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {program.sessions_attended.map((session) => (
                    <li key={session.session_id} className="flex items-center gap-2">
                      <span>
                        {session.session_name} on{" "}
                        {format(parseISO(session.session_date), "PPP")}
                      </span>
                      <Badge variant="secondary">{session.status}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No sessions recorded for this program.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default AttendedProgramsList;