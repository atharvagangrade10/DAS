export interface Session {
  id: string;
  program_id: string;
  name: string;
  date: string;
}

export interface Program {
  id: string;
  program_name: string;
  description: string;
  start_date: string;
  end_date: string;
  num_sessions: number;
  sessions?: Session[];
}

export interface ProgramCreate {
  program_name: string;
  description: string;
  start_date: string;
  end_date: string;
  num_sessions: number;
}

export interface ProgramUpdate {
  program_name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  num_sessions?: number;
}

export interface SessionUpdate {
  session_id: string;
  new_date: string;
}