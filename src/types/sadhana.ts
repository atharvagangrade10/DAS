"use client";

import { date, datetime } from "zod";

// --- Enums/Union Types ---
export type ChantingSlot = "Before 6:30 am" | "Before 8:30 am" | "Before 10 am" | "After 10 am";
export type AssociationType = "Preaching" | "Other Activities"; 

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
}

// -------------------------------------------------
// RESPONSE SCHEMAS
// -------------------------------------------------

export interface ChantingLogResponse extends ChantingLogBase {
  id: string;
}

export interface BookLogResponse extends BookLogBase {
  id: string;
}

export interface AssociationLogResponse extends AssociationLogBase {
  id: string;
}

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

  chanting_logs: ChantingLogResponse[];
  book_reading_logs: BookLogResponse[];
  association_logs: AssociationLogResponse[];

  created_at: string;
  updated_at: string | null;
}