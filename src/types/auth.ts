export interface AuthUser {
  user_id: string;
  full_name: string;
  phone: string;
  address?: string;
  age?: number | null;
  dob?: string | null; // Added dob field
  gender?: string;
  email?: string;
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
  phone: string;
  address: string;
  password: string;
  age: number | null;
  dob: string | null; // Added dob field
  gender: string;
  email: string;
  devotee_friend_name: string;
  chanting_rounds: number | null;
}