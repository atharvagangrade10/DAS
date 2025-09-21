"use client";

import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Participant } from "@/types/participant";
import { Program } from "@/types/program";

interface MarkAttendanceCardProps {
  participant: Participant;
  onAttendanceMarked: (participantId: string) => void; // Updated prop type
}

const fetchPrograms = async (): Promise<Program[]> => {
  const response = await fetch("https://das-backend-o43a.onrender.com/program/");
  if (!response.ok) {
    throw new Error("Failed to fetch programs");
  }
  return response.json();
};

const markAttendance = async (attendanceData: {
  participant_id: string;
  program_id: string;
  session_id: string;
  status: string;
  marked_by: string;
}) => {
  const response = await fetch("https://das-backend-o43a.onrender.com/attendance/mark", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(attendanceData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to mark attendance");
  }
  return response.json();
};

const MarkAttendanceCard: React.FC<MarkAttendanceCardProps> = ({
  participant,
  onAttendanceMarked,
}) => {
  const [selectedProgramId, setSelectedProgramId] = React.useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = React.useState<string>("");

  const { data: programs, isLoading: isLoadingPrograms } = useQuery<
    Program[],
    Error
  >({
    queryKey: ["programsWithSessions"],
    queryFn: fetchPrograms,
  });

  const mutation = useMutation({
    mutationFn: markAttendance,
    onSuccess: () => {
      toast.success(`Attendance marked for ${participant.full_name}`);
      onAttendanceMarked(participant.id); // Pass participant.id to the callback
    },
    onError: (error: Error) => {
      toast.error("Failed to mark attendance", {
        description: error.message,
      });
    },
  });

  const selectedProgram = programs?.find((p) => p.id === selectedProgramId);

  const handleSubmit = () => {
    if (!selectedProgramId || !selectedSessionId) {
      toast.error("Please select a program and a session.");
      return;
    }
    mutation.mutate({
      participant_id: participant.id,
      program_id: selectedProgramId,
      session_id: selectedSessionId,
      status: "Present",
      marked_by: "Admin",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance for {participant.full_name}</CardTitle>
        <CardDescription>
          Select a program and session to mark attendance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="program-select">Program</Label>
          <Select
            value={selectedProgramId}
            onValueChange={(value) => {
              setSelectedProgramId(value);
              setSelectedSessionId(""); // Reset session on program change
            }}
          >
            <SelectTrigger id="program-select">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingPrograms ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : (
                programs?.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.program_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedProgram && (
          <div className="space-y-2">
            <Label htmlFor="session-select">Session</Label>
            <Select
              value={selectedSessionId}
              onValueChange={setSelectedSessionId}
            >
              <SelectTrigger id="session-select">
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                {selectedProgram.sessions?.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={
            !selectedProgramId || !selectedSessionId || mutation.isPending
          }
        >
          {mutation.isPending ? "Marking..." : "Mark as Present"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MarkAttendanceCard;