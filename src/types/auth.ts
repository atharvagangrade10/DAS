export interface AuthUser {
  user_id: string;
  full_name: string;
  phone: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  full_name: string;
  phone: string;
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
  gender: string;
  email: string;
  devotee_friend_name: string;
  chanting_rounds: number | null;
}