export interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string; // ISO date string, e.g., "YYYY-MM-DD"
  end_date: string;   // ISO date string, e.g., "YYYY-MM-DD"
  num_sessions: number; // Added num_sessions
}

export interface Session {
  session_id: string;
  date: string; // ISO date string, e.g., "YYYY-MM-DD"
}

export interface ProgramCreate {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  num_sessions: number; // Added num_sessions
}

export interface ProgramUpdate {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  num_sessions?: number; // Added num_sessions
}

export interface SessionUpdate {
  session_id: string;
  new_date: string;
}