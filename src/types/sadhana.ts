"use client";

// --- Enums/Union Types ---
export type ChantingSlot =
  | "before_7_30_am"
  | "7_30_to_12_00_pm"
  | "12_00_to_6_00_pm"
  | "6_00_to_12_00_am"
  | "after_12_00_am";

export type AssociationType =
  | "PRABHUPADA"
  | "GURU"
  | "OTHER_ISKCON_DEVOTEE";

// -------------------------------------------------
// BASE LOG SCHEMAS
// -------------------------------------------------

export interface ChantingLogBase {
  slot: ChantingSlot;
  rounds: number; // 1 to 108
  rating: number | null; // 1 to 10
  score?: number; // Calculated score
}

export interface BookLogBase {
  id?: string;
  name: string;
  reading_time: number; // minutes, 0 to 1440
  chapter_name: string | null;
  score?: number;
}

export interface AssociationLogBase {
  type: AssociationType;
  duration: number; // minutes, 0 to 1440
  devotee_name?: string | null;
  score?: number;
}

// -------------------------------------------------
// CREATE SCHEMAS
// -------------------------------------------------

export interface ChantingLogCreate extends ChantingLogBase { }
export interface BookLogCreate extends BookLogBase { }
export interface AssociationLogCreate extends AssociationLogBase { }

export interface ActivityLogCreate {
  participant_id: string;
  today_date: string; // date string 'YYYY-MM-DD'

  sleep_at: string; // datetime string (ISO format)
  wakeup_at: string; // datetime string (ISO format)

  no_meat: boolean;
  no_intoxication: boolean;
  no_illicit_sex: boolean;
  no_gambling: boolean;
  only_prasadam: boolean;
  notes_of_day?: string | null;

  mangla_attended: boolean;
  narshima_attended: boolean;
  tulsi_arti_attended: boolean;
  darshan_arti_attended: boolean;
  guru_puja_attended: boolean;
  sandhya_arti_attended: boolean;
  japa_sanga?: boolean;

  exercise_time: number; // minutes
  finished_by?: string | null; // datetime string (ISO format)
  // Scores might be calculated backend-side on create/update, so optional in Create/Update?
  // "Updated create_activity to handle japa_sanga and scores."
  sleep_score?: number;
  wakeup_score?: number;
  arati_score?: number;
  regulation_score?: number;
  exercise_score?: number;
}

// -------------------------------------------------
// UPDATE SCHEMAS
// -------------------------------------------------

export interface ChantingLogUpdate {
  slot?: ChantingSlot;
  rounds?: number;
  rating?: number | null;
  score?: number;
}

export interface BookLogUpdate {
  name?: string;
  reading_time?: number;
  chapter_name?: string | null;
  score?: number;
}

export interface AssociationLogUpdate {
  type?: AssociationType;
  duration?: number;
  devotee_name?: string | null;
  score?: number;
}

export interface ActivityLogUpdate {
  sleep_at?: string; // datetime string (ISO format)
  wakeup_at?: string; // datetime string (ISO format)

  no_meat?: boolean;
  no_intoxication?: boolean;
  no_illicit_sex?: boolean;
  no_gambling?: boolean;
  only_prasadam?: boolean;
  notes_of_day?: string | null;

  mangla_attended?: boolean;
  narshima_attended?: boolean;
  tulsi_arti_attended?: boolean;
  darshan_arti_attended?: boolean;
  guru_puja_attended?: boolean;
  sandhya_arti_attended?: boolean;
  japa_sanga?: boolean;

  exercise_time?: number;
  finished_by?: string | null; // datetime string (ISO format)

  sleep_score?: number;
  wakeup_score?: number;
  arati_score?: number;
  regulation_score?: number;
  exercise_score?: number;
}

// -------------------------------------------------
// RESPONSE SCHEMAS
// -------------------------------------------------

export interface ChantingLogResponse extends ChantingLogBase { }

export interface BookLogResponse extends BookLogBase { }

export interface AssociationLogResponse extends AssociationLogBase { }

export interface ActivityLogResponse {
  id: string;
  today_date: string; // date string 'YYYY-MM-DD'

  sleep_at: string; // datetime string (ISO format)
  wakeup_at: string; // datetime string (ISO format)

  no_meat: boolean;
  no_intoxication: boolean;
  no_illicit_sex: boolean;
  no_gambling: boolean;
  only_prasadam: boolean;
  notes_of_day: string | null;

  mangla_attended: boolean;
  narshima_attended: boolean;
  tulsi_arti_attended: boolean;
  darshan_arti_attended: boolean;
  guru_puja_attended: boolean;
  sandhya_arti_attended: boolean;
  japa_sanga?: boolean; // Optional for backward compatibility, though backend likely returns it

  exercise_time: number;
  finished_by: string | null; // datetime string (ISO format)

  sleep_score: number | null;
  arati_score: number | null;
  exercise_score: number | null;

  chanting_logs: ChantingLogResponse[];
  book_reading_logs: BookLogResponse[];
  association_logs: AssociationLogResponse[];

  created_at: string;
  updated_at: string | null;
}

export interface SleepInsightResponse {
  days_count: number;
  median_wakeup_time: string | null;
  iqr_wakeup_minutes: number | null;
  percent_wakeup_before_5am: number;
  median_sleep_time: string | null;
  iqr_sleep_minutes: number | null;
  median_sleep_duration_minutes: number | null;
}

export interface ChantingInsightResponse {
  days_count: number;
  daily_target_rounds: number | null;
  median_daily_rounds: number | null;
  iqr_daily_rounds: number | null;
  percent_days_meeting_target: number;
  zero_round_days: number;
  percent_rounds_before_7_30_am: number;
  percent_rounds_7_30_to_12_00: number;
  percent_rounds_12_00_to_6_00: number;
  percent_rounds_6_00_to_12_00: number;
  percent_rounds_after_12_00_am: number;
  median_rating: number | null;
  iqr_rating: number | null;
}

export interface BookInsightResponse {
  days_count: number;
  reading_days: number;
  median_daily_reading_minutes: number | null;
  iqr_daily_reading_minutes: number | null;
  longest_reading_streak: number;
  primary_book_name: string | null;
  primary_book_return_ratio: number | null;
  books_read: string[];
}

export interface AssociationInsightResponse {
  days_count: number;
  association_days: number;
  median_daily_association_minutes: number | null;
  iqr_daily_association_minutes: number | null;
  median_minutes_by_type: Record<AssociationType, number>;
  association_days_by_type: Record<AssociationType, number>;
  unique_devotee_names: string[];
}

export interface AratiInsightResponse {
  days_count: number;
  total_arati_attendance_days: number;
  mangla_attended_days: number;
  narasimha_attended_days: number;
  tulsi_arati_attended_days: number;
  darshan_arati_attended_days: number;
  guru_puja_attended_days: number;
  sandhya_arati_attended_days: number;
  morning_arati_days: number;
  japa_sanga_attended_days?: number;
}

export interface ExerciseInsightResponse {
  days_count: number;
  exercise_days: number;
  percent_days_exercised: number;
  median_exercise_minutes: number | null;
  iqr_exercise_minutes: number | null;
}

export interface ScoresInsightResponse {
  days_count: number;
  avg_chanting_score: number;
  avg_book_score: number;
  avg_association_score: number;
  avg_regulation_score: number;
  avg_arati_score: number;
  avg_sleep_score: number;
  avg_wakeup_score: number;
  avg_exercise_score: number;
  avg_total_score: number;
}

export interface ParticipantRankingResponse {
  rank: number;
  participant_id: string;
  full_name: string;
  avg_total_score: number | null;
  profile_photo_url: string | null;
}