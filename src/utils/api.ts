import { AttendedProgram, Participant } from "@/types/participant";
import { Program, Session } from "@/types/program";

interface DevoteeFriend {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export const fetchAllParticipants = async (): Promise<Participant[]> => {
  const response = await fetch("https://das-backend-o43a.onrender.com/register/participants");
  if (!response.ok) {
    throw new Error("Failed to fetch participants");
  }
  return response.json();
};

export const fetchDevoteeFriends = async (): Promise<DevoteeFriend[]> => {
  const response = await fetch("https://das-backend-o43a.onrender.com/register/devoteefriends");
  if (!response.ok) {
    throw new Error("Failed to fetch devotee friends");
  }
  return response.json();
};

export const fetchPrograms = async (): Promise<Program[]> => {
  const response = await fetch("https://das-backend-o43a.onrender.com/program/");
  if (!response.ok) {
    throw new Error("Failed to fetch programs");
  }
  return response.json();
};

export const fetchProgramSessions = async (programId: string): Promise<Session[]> => {
  if (!programId) return [];
  const response = await fetch(`https://das-backend-o43a.onrender.com/program/${programId}/sessions`);
  if (!response.ok) {
    throw new Error("Failed to fetch program sessions");
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const fetchAttendedPrograms = async (
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