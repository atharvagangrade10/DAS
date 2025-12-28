"use client";

export interface AuthUser {
  user_id: string;
  full_name: string;
  initiated_name?: string | null;
  phone: string;
  address?: string;
  place_name?: string | null;
  age?: number | null;
  dob?: string | null;
  gender?: string;
  email?: string;
  profession?: string | null;
  devotee_friend_name?: string;
  chanting_rounds?: number | null;
  role: 'Attendee' | 'Manager' | 'DevoteeFriend' | 'Volunteer';
}

export interface AuthTokenResponse extends AuthUser {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  initiated_name: string | null;
  phone: string;
  address: string;
  place_name: string | null;
  password: string;
  age: number | null;
  dob: string | null;
  gender: string;
  email: string;
  profession: string | null;
  devotee_friend_name: string;
  chanting_rounds: number | null;
}