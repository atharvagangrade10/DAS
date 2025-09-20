export interface Program {
  id: string;
  program_name: string; // Changed from 'name' to 'program_name'
  description: string;
  start_date: string; // ISO date string, e.g., "YYYY-MM-DD"
  end_date: string;   // ISO date string, e.g., "YYYY-MM-DD"
  num_sessions: number;
}

export interface Session {
  id: string; // Changed from 'session_id' to 'id'
  name: string; // Added 'name' field
  date: string; // ISO date string, e.g., "YYYY-MM-DD"
}

export interface ProgramCreate {
  program_name: string; // Changed from 'name' to 'program_name'
  description: string;
  start_date: string;
  end_date: string;
  num_sessions: number;
}

export interface ProgramUpdate {
  program_name?: string; // Changed from 'name' to 'program_name'
  description?: string;
  start_date?: string;
  end_date?: string;
  num_sessions?: number;
}

export interface SessionUpdate {
  session_id: string; // This still refers to the backend's expected ID for updates
  new_date: string;
}