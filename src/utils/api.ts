import { AttendedProgram, Participant } from "@/types/participant";
import { Program, Session } from "@/types/program";
import { Yatra, YatraCreate } from "@/types/yatra";
import { API_BASE_URL } from "@/config/api";
import { handleUnauthorized } from "@/context/AuthContext"; // Import the handler

interface DevoteeFriend {
  id: string;
  name: string;
  phone: string;
  email: string;
}

// Helper function to get authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('das_auth_token');
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Helper function for authenticated GET requests
const fetchAuthenticated = async (url: string) => {
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  
  if (response.status === 401) {
    handleUnauthorized();
    // Throw an error to stop further processing in the calling component/hook
    throw new Error("Unauthorized access. Logging out.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch data' }));
    throw new Error(errorData.detail || "Failed to fetch data");
  }
  return response.json();
};

// Helper function for authenticated POST/PUT/DELETE requests
const mutateAuthenticated = async (url: string, method: string, body?: any) => {
  const response = await fetch(url, {
    method: method,
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    handleUnauthorized();
    // Throw an error to stop further processing in the calling component/hook
    throw new Error("Unauthorized access. Logging out.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: `Failed to ${method}` }));
    throw new Error(errorData.detail || `Failed to ${method}`);
  }
  return response.json();
};


export const fetchAllParticipants = async (): Promise<Participant[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/register/participants`);
};

export const fetchDevoteeFriends = async (): Promise<DevoteeFriend[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/register/devoteefriends`);
};

export const fetchPrograms = async (): Promise<Program[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/program/`);
};

export const fetchProgramSessions = async (programId: string): Promise<Session[]> => {
  if (!programId) return [];
  return fetchAuthenticated(`${API_BASE_URL}/program/${programId}/sessions`);
};

export const fetchAttendedPrograms = async (
  participantId: string,
): Promise<AttendedProgram[]> => {
  return fetchAuthenticated(
    `${API_BASE_URL}/participants/${participantId}/attended-programs`,
  );
};

export const fetchYatras = async (): Promise<Yatra[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/yatra/`);
};

export const createYatra = async (yatraData: YatraCreate): Promise<Yatra> => {
  return mutateAuthenticated(`${API_BASE_URL}/yatra/create`, "POST", yatraData);
};