"use client";

// --- Enums/Union Types ---
export type ChantingSlot = 
  | "before_6_30_am" 
  | "6_30_to_8_30_am" 
  | "8_30_to_10_am" 
  | "before_9_30_pm" 
  | "after_9_30_pm";

export type AssociationType = 
  | "PRABHUPADA" 
  | "GURU" 
  | "OTHER" 
  | "PREACHING" 
  | "OTHER_ACTIVITIES"; 

// -------------------------------------------------
// BASE LOG SCHEMAS
// -------------------------------------------------

export interface ChantingLogBase {
  slot: ChantingSlot;
  rounds: number; // 1 to 108
  rating: number | null; // 1 to 10
}

export interface BookLogBase {
  name: string;
  reading_time: number; // minutes, 0 to 1440
  chapter_name: string | null;
}

export interface AssociationLogBase {
  type: AssociationType;
  duration: number; // minutes, 0 to 1440
}

// -------------------------------------------------
// CREATE SCHEMAS
// -------------------------------------------------

export interface ChantingLogCreate extends ChantingLogBase {}
export interface BookLogCreate extends BookLogBase {}
export interface AssociationLogCreate extends AssociationLogBase {}

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
}

// -------------------------------------------------
// UPDATE SCHEMAS
// -------------------------------------------------

export interface ChantingLogUpdate {
  slot?: ChantingSlot;
  rounds?: number;
  rating?: number | null;
}

export interface BookLogUpdate {
  name?: string;
  reading_time?: number;
  chapter_name?: string | null;
}

export interface AssociationLogUpdate {
  type?: AssociationType;
  duration?: number;
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
}

// -------------------------------------------------
// RESPONSE SCHEMAS
// -------------------------------------------------

export interface ChantingLogResponse extends ChantingLogBase {}

export interface BookLogResponse extends BookLogBase {}

export interface AssociationLogResponse extends AssociationLogBase {}

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

  chanting_logs: ChantingLogResponse[];
  book_reading_logs: BookLogResponse[];
  association_logs: AssociationLogResponse[];

  created_at: string;
  updated_at: string | null;
}