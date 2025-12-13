"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AttendedProgram } from "@/types/participant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { fetchAttendedPrograms } from "@/utils/api";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { API_BASE_URL } from "@/config/api";

interface AttendedProgramsListProps {
  participantId: string;
}

const deleteAttendanceRecord = async (attendanceId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/attendance/delete/${attendanceId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to delete attendance record");
  }
};

const AttendedProgramsList: React.FC<AttendedProgramsListProps> = ({
  participantId,
}) => {
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [attendanceRecordToDelete, setAttendanceRecordToDelete] = React.useState<{ sessionId: string; sessionName: string; programName: string } | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: deleteAttendanceRecord,
    onSuccess: () => {
      toast.success("Attendance record deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["attendedPrograms", participantId] });
      queryClient.invalidateQueries({ queryKey: ["allAttendedPrograms"] }); // Invalidate global attendance
      queryClient.invalidateQueries({ queryKey: ["allAttendedProgramsForStats"] }); // Invalidate stats attendance
      setIsDeleteDialogOpen(false);
      setAttendanceRecordToDelete(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete attendance record", {
        description: error.message,
      });
    },
  });

  const confirmDelete = (sessionId: string, sessionName: string, programName: string) => {
    setAttendanceRecordToDelete({ sessionId, sessionName, programName });
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (attendanceRecordToDelete) {
      deleteMutation.mutate(attendanceRecordToDelete.sessionId);
    }
  };

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
                  {program.sessions_attended
                    .sort((a, b) => parseISO(a.session_date).getTime() - parseISO(b.session_date).getTime()) // Sort sessions by date
                    .map((session) => (
                      <li key={session.session_id} className="flex items-center gap-2">
                        <span className="font-normal">{session.session_name}</span>
                        <span className="text-gray-500 dark:text-gray-400">({format(parseISO(session.session_date), "PPP")})</span>
                        <Badge variant="secondary">{session.status}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-500"
                          onClick={() => confirmDelete(session.session_id, session.session_name, program.program_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete attendance for {session.session_name}</span>
                        </Button>
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the attendance record for session{" "}
              <span className="font-semibold">{attendanceRecordToDelete?.sessionName}</span> in program{" "}
              <span className="font-semibold">{attendanceRecordToDelete?.programName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AttendedProgramsList;