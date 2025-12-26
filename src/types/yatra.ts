export interface RegistrationFees {
  [key: string]: number;
}

export interface Yatra {
  id: string;
  name: string;
  date_start: string; // ISO date string
  date_end: string; // ISO date string
  registration_fees: RegistrationFees;
}

export interface YatraCreate {
  name: string;
  date_start: string;
  date_end: string;
  registration_fees: RegistrationFees;
}