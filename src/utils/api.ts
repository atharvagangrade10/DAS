import { AttendedProgram, Participant } from "@/types/participant";
import { Program, Session } from "@/types/program";
import { API_BASE_URL } from "@/config/api";

interface DevoteeFriend {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export const fetchAllParticipants = async (): Promise<Participant[]> => {
  const response = await fetch(`${API_BASE_URL}/register/participants`);
  if (!response.ok) {
    throw new Error("Failed to fetch participants");
  }
  return response.json();
};

export const fetchDevoteeFriends = async (): Promise<DevoteeFriend[]> => {
  const response = await fetch(`${API_BASE_URL}/register/devoteefriends`);
  if (!response.ok) {
    throw new Error("Failed to fetch devotee friends");
  }
  return response.json();
};

export const fetchPrograms = async (): Promise<Program[]> => {
  const response = await fetch(`${API_BASE_URL}/program/`);
  if (!response.ok) {
    throw new Error("Failed to fetch programs");
  }
  return response.json();
};

export const fetchProgramSessions = async (programId: string): Promise<Session[]> => {
  if (!programId) return [];
  const response = await fetch(`${API_BASE_URL}/program/${programId}/sessions`);
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
    `${API_BASE_URL}/participants/${participantId}/attended-programs`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch attended programs");
  }
  return response.json();
};