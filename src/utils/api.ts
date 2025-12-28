import { AttendedProgram, Participant } from "@/types/participant";
import { Program, Session } from "@/types/program";
import { Yatra, YatraCreate, YatraUpdate, PaymentRecord } from "@/types/yatra";
import { API_BASE_URL } from "@/config/api";
import { handleUnauthorized } from "@/context/AuthContext";

interface DevoteeFriend {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface AccountStatusResponse {
  status: "Login" | "Register" | "SetPassword";
  participant_id: string | null;
  full_name: string | null;
  message: string;
}

// Helper function to get authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('das_auth_token');
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Helper function for authenticated GET requests
const fetchAuthenticated = async (url: string) => {
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Unauthorized access. Logging out.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch data' }));
    throw new Error(errorData.detail || "Failed to fetch data");
  }
  return response.json();
};

// Helper function for authenticated POST/PUT/DELETE requests
const mutateAuthenticated = async (url: string, method: string, body?: any) => {
  const response = await fetch(url, {
    method: method,
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Unauthorized access. Logging out.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: `Failed to ${method}` }));
    throw new Error(errorData.detail || `Failed to ${method}`);
  }
  return response.json();
};

// --- Authenticated Endpoints ---

export const fetchAllParticipants = async (): Promise<Participant[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/register/participants`);
};

export const fetchDevoteeFriends = async (): Promise<DevoteeFriend[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/register/devoteefriends`);
};

export const fetchPrograms = async (): Promise<Program[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/program/`);
};

export const fetchProgramSessions = async (programId: string): Promise<Session[]> => {
  if (!programId) return [];
  return fetchAuthenticated(`${API_BASE_URL}/program/${programId}/sessions`);
};

export const fetchAttendedPrograms = async (
  participantId: string,
): Promise<AttendedProgram[]> => {
  return fetchAuthenticated(
    `${API_BASE_URL}/participants/${participantId}/attended-programs`,
  );
};

export const fetchYatras = async (): Promise<Yatra[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/yatra/`);
};

export const createYatra = async (yatraData: YatraCreate): Promise<Yatra> => {
  return mutateAuthenticated(`${API_BASE_URL}/yatra/create`, "POST", yatraData);
};

export const updateYatra = async (yatraId: string, yatraData: YatraUpdate): Promise<Yatra> => {
  return mutateAuthenticated(`${API_BASE_URL}/yatra/update/${yatraId}`, "PUT", yatraData);
};

export interface RazorpayInvoiceRequest {
  yatra_id: string;
  fee_category: string;
  amount: number;
  participant_id: string;
}

export interface RazorpayInvoiceResponse {
  id: string;
  order_id: string; // The order ID associated with the invoice
  amount: number;
  currency: string;
  yatra_name: string;
  fee_category: string;
  participant_name: string;
  participant_phone: string;
}

export const createRazorpayInvoice = async (data: RazorpayInvoiceRequest): Promise<RazorpayInvoiceResponse> => {
  // Matches backend route @router.post("/{yatra_id}/order")
  return mutateAuthenticated(`${API_BASE_URL}/yatra/${data.yatra_id}/order`, "POST", {
    participant_id: data.participant_id,
    amount: data.amount,
    fee_category: data.fee_category,
  });
};

export interface RazorpayVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const verifyPayment = async (yatraId: string, data: RazorpayVerificationRequest): Promise<any> => {
  return mutateAuthenticated(`${API_BASE_URL}/yatra/${yatraId}/verify-payment`, "POST", data);
};

export const fetchPaymentHistory = async (participantId: string): Promise<PaymentRecord[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/yatra/payment-history/${participantId}`);
};

// --- Public Endpoints (Unprotected) ---

export const fetchYatrasPublic = async (): Promise<Yatra[]> => {
  const response = await fetch(`${API_BASE_URL}/yatra/`, {
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) throw new Error("Failed to fetch trip details");
  return response.json();
};

export const createAccountCheck = async (phone: string): Promise<AccountStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/create-account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to check account' }));
    throw new Error(errorData.detail || "Failed to check account status");
  }
  return response.json();
};

export const createParticipantPublic = async (data: any): Promise<Participant> => {
  const response = await fetch(`${API_BASE_URL}/auth/create-participant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create participant' }));
    throw new Error(errorData.detail || "Failed to register participant");
  }
  return response.json();
};

export const setPasswordPublic = async (participant_id: string, password: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_id, password }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to set password' }));
    throw new Error(errorData.detail || "Failed to set account password");
  }
  return response.json();
};

export const forgotPassword = async (phone: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to initiate password reset' }));
    throw new Error(errorData.detail || "Failed to initiate password reset");
  }
  return response.json();
};

export const resetPassword = async (token: string, new_password: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to reset password' }));
    throw new Error(errorData.detail || "Failed to reset password");
  }
  return response.json();
};

export const searchParticipantPublic = async (phone: string): Promise<Participant[]> => {
  const response = await fetch(`${API_BASE_URL}/participants/search?query=${encodeURIComponent(phone)}`, {
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) return [];
  return response.json();
};

export const upsertParticipantPublic = async (data: any, id?: string): Promise<Participant> => {
  const url = id 
    ? `${API_BASE_URL}/participants/${id}` 
    : `${API_BASE_URL}/register/participant`;
  
  const response = await fetch(url, {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to process request' }));
    throw new Error(errorData.detail || "Failed to process participant data");
  }
  return response.json();
};