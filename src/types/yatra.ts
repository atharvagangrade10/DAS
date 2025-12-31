"use client";

export type YatraStatus = "Open" | "Closed";

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
  status: YatraStatus;
}

export interface YatraCreate {
  name: string;
  date_start: string;
  date_end: string;
  registration_fees: RegistrationFee[];
  can_add_members: boolean;
  status?: YatraStatus;
}

export interface YatraUpdate {
  name?: string;
  date_start?: string;
  date_end?: string;
  registration_fees?: RegistrationFee[];
  can_add_members?: boolean;
  status?: YatraStatus;
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

export interface ReceiptResponse {
  yatra_id: string;
  yatra_name: string;
  participant_id: string;
  participant_name: string;
  payment_amount: number;
  payment_status: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  receipt_url: string | null;
  is_registered: boolean;
  yatra_start_date: string;
  yatra_end_date: string;
}