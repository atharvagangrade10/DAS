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

export interface RelatedParticipant {
  relation: string;
  participant_id: string;
}

export interface Participant {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  initiated_name: string | null;
  phone: string;
  address: string;
  place_name: string | null;
  age: number | null;
  dob: string | null;
  gender: string;
  email: string;
  profession: string | null;
  devotee_friend_name: string;
  chanting_rounds: number | null;
  date_joined: string;
  role: 'Attendee' | 'Manager' | 'DevoteeFriend' | 'Volunteer';
  related_participant_ids?: RelatedParticipant[];
}