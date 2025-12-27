export interface RegistrationFees {
  [key: string]: number;
}

export interface Yatra {
  id: string;
  name: string;
  date_start: string; // ISO date string (YYYY-MM-DD)
  date_end: string; // ISO date string (YYYY-MM-DD)
  registration_fees: RegistrationFees;
}

export interface YatraCreate {
  name: string;
  date_start: string;
  date_end: string;
  registration_fees: RegistrationFees;
}

export interface YatraUpdate {
  name?: string;
  date_start?: string;
  date_end?: string;
  registration_fees?: RegistrationFees;
}

export interface PaymentRecord {
  yatra_id: string;
  yatra_name: string;
  amount: number;
  status: string;
  transaction_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
}