export interface AttendedSession {
  session_id: string;
  session_name: string;
  session_date: string; // ISO date string
  marked_at: string; // ISO datetime string
  status: string;
  devotee_friend_name: string;
}

export interface AttendedProgram {
  program_id: string;
  program_name: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  description: string;
  sessions_attended: AttendedSession[];
}

export interface Participant {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  age: number | null;
  gender: string;
  email: string;
  devotee_friend_name: string;
  chanting_rounds: number | null; // New field
}