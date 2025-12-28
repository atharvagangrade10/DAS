"use client";

export interface RegistrationFee {
  option_name: string;
  amount: number;
  child_amount?: number | null;
  child_condition_by_age?: number | null;
}

export interface Yatra {
  id: string;
  name: string;
  date_start: string;
  date_end: string;
  registration_fees: RegistrationFee[];
  can_add_members: boolean;
}

export interface YatraCreate {
  name: string;
  date_start: string;
  date_end: string;
  registration_fees: RegistrationFee[];
  can_add_members: boolean;
}

export interface YatraUpdate {
  name?: string;
  date_start?: string;
  date_end?: string;
  registration_fees?: RegistrationFee[];
  can_add_members?: boolean;
}

export interface PaymentRecord {
  yatra_id: string;
  yatra_name: string;
  amount: number;
  status: string;
  transaction_id: string;
  date: string;
  receipt_url?: string | null;
}