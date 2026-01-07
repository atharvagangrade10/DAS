"use client";

export enum BatchRecursionEnum {
  daily = "Daily",
  weekly = "Weekly",
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  recursion_type: BatchRecursionEnum;
  days_of_week: number[]; // 0-6
  start_date: string;
  is_active: boolean;
  created_at: string;
}

export interface BatchCreate {
  name: string;
  description?: string;
  recursion_type: BatchRecursionEnum;
  days_of_week: number[];
  start_date: string;
  is_active: boolean;
}

export interface BatchUpdate {
  name?: string;
  description?: string;
  recursion_type?: BatchRecursionEnum;
  days_of_week?: number[];
  start_date?: string;
  is_active?: boolean;
}

export interface BatchAttendanceRecord {
  participant_id: string;
  date: string;
  status: string;
  marked_by?: string;
}

export interface BatchVolunteer {
  batch_id: string;
  participant_id: string;
  assigned_at: string; // ISO datetime string
  participant_info?: { // Optional, for displaying in frontend
    id: string;
    full_name: string;
    phone: string;
    email: string;
    profile_photo_url?: string | null;
  };
}

// New interfaces for batch statistics
export interface BatchStatsResponse {
  batch_id: string;
  batch_name: string;
  stats: BatchParticipantStats[];
}

export interface BatchParticipantStats {
  participant_id: string;
  full_name: string;
  attended_count: number;
  total_sessions: number;
  attendance_percentage: number;
  attendance_ratio: string;  // e.g., "10/20"
}