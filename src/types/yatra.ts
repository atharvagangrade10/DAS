export interface RegistrationFees {
  [key: string]: number;
}

export interface MemberPrices {
  Husband: number;
  Wife: number;
  Child: number;
}

export interface Yatra {
  id: string;
  name: string;
  date_start: string;
  date_end: string;
  registration_fees: RegistrationFees;
  can_add_members: boolean;
  member_prices: MemberPrices;
}

export interface YatraCreate {
  name: string;
  date_start: string;
  date_end: string;
  registration_fees: RegistrationFees;
  can_add_members: boolean;
  member_prices: MemberPrices;
}

export interface YatraUpdate {
  name?: string;
  date_start?: string;
  date_end?: string;
  registration_fees?: RegistrationFees;
  can_add_members?: boolean;
  member_prices?: MemberPrices;
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