export interface AuthUser {
  user_id: string;
  full_name: string;
  initiated_name?: string | null; // Added field
  phone: string;
  address?: string;
  place_name?: string | null; // Added field
  age?: number | null;
  dob?: string | null;
  gender?: string;
  email?: string;
  profession?: string | null; // Added field
  devotee_friend_name?: string;
  chanting_rounds?: number | null;
}

export interface AuthTokenResponse extends AuthUser {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  full_name: string;
  phone: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  initiated_name: string | null; // Added field
  phone: string;
  address: string;
  place_name: string | null; // Added field
  password: string;
  age: number | null;
  dob: string | null;
  gender: string;
  email: string;
  profession: string | null; // Added field
  devotee_friend_name: string;
  chanting_rounds: number | null;
}