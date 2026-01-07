"use client";

import { AttendedProgram, Participant } from "@/types/participant";
import { Program, Session } from "@/types/program";
import { Yatra, YatraCreate, YatraUpdate, PaymentRecord, ReceiptResponse } from "@/types/yatra";
import { Batch, BatchCreate, BatchUpdate, BatchAttendanceRecord, BatchVolunteer, BatchStatsResponse, BatchParticipantStats } from "@/types/batch";
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

export const fetchParticipantById = async (id: string): Promise<Participant> => {
  const token = localStorage.getItem('das_auth_token');
  if (token) {
    return fetchAuthenticated(`${API_BASE_URL}/participants/${id}`);
  } else {
    const response = await fetch(`${API_BASE_URL}/participants/${id}`, {
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) throw new Error("Failed to fetch participant");
    return response.json();
  }
};

export const updateParticipant = async (
  participantId: string,
  data: any,
): Promise<Participant> => {
  const payload = { ...data, participant_id: participantId };
  return mutateAuthenticated(`${API_BASE_URL}/participants/${participantId}`, "PUT", payload);
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

// --- Batch (Class) Endpoints ---

export const fetchBatches = async (): Promise<Batch[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/batches/`);
};

export const createBatch = async (data: BatchCreate): Promise<Batch> => {
  return mutateAuthenticated(`${API_BASE_URL}/batches/`, "POST", data);
};

export const updateBatch = async (batchId: string, data: BatchUpdate): Promise<Batch> => {
  return mutateAuthenticated(`${API_BASE_URL}/batches/${batchId}`, "PUT", data);
};

export const deleteBatch = async (batchId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/batches/${batchId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to delete batch");
  }
};

export const fetchBatchParticipants = async (batchId: string): Promise<any[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/batches/${batchId}/participants`);
};

export const addParticipantToBatch = async (batchId: string, participantId: string) => {
  return mutateAuthenticated(`${API_BASE_URL}/batches/${batchId}/participants`, "POST", { participant_id: participantId });
};

export const fetchBatchAttendance = async (batchId: string, date: string): Promise<any[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/batches/${batchId}/attendance/${date}`);
};

export const markBatchAttendanceBulk = async (batchId: string, data: { date: string; participant_ids: string[]; status: string; marked_by?: string }) => {
  return mutateAuthenticated(`${API_BASE_URL}/batches/${batchId}/attendance/bulk`, "POST", data);
};

export const fetchBatchDay = async (batchId: string, date: string) => {
  return fetchAuthenticated(`${API_BASE_URL}/batches/${batchId}/days/${date}`);
};

export const updateBatchDay = async (batchId: string, date: string, data: { title?: string; is_skipped?: boolean }) => {
  return mutateAuthenticated(`${API_BASE_URL}/batches/${batchId}/days/${date}`, "PUT", data);
};

export const fetchBatchStats = async (batchId: string): Promise<BatchStatsResponse> => {
  return fetchAuthenticated(`${API_BASE_URL}/batches/${batchId}/stats`);
};

// --- NEW Batch Volunteer Endpoints (Verified Backend) ---

export const fetchBatchVolunteers = async (batchId: string): Promise<BatchVolunteer[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/batches/${batchId}/volunteers`);
};

export const assignVolunteerToBatch = async (batchId: string, participantId: string): Promise<BatchVolunteer> => {
  return mutateAuthenticated(`${API_BASE_URL}/batches/${batchId}/volunteers`, "POST", { participant_id: participantId });
};

export const removeVolunteerFromBatch = async (batchId: string, participantId: string): Promise<void> => {
  return mutateAuthenticated(`${API_BASE_URL}/batches/${batchId}/volunteers/${participantId}`, "DELETE");
};

// --- Batch Assignments & Enrollments ---

export const fetchMyAssignedBatches = async (): Promise<Batch[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/batches/assigned/me`);
};

export const fetchMyEnrolledBatches = async (): Promise<Batch[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/batches/enrolled/me`);
};

export const fetchBatchParticipantStats = async (batchId: string, participantId: string): Promise<BatchParticipantStats> => {
  return fetchAuthenticated(`${API_BASE_URL}/batches/${batchId}/participants/${participantId}/stats`);
};

// --- Yatra Endpoints ---

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
  related_participant_ids?: Array<{
    relation: string;
    participant_id: string;
    registration_fee?: {
      option_name: string;
      amount: number;
      child_amount?: number | null;
      child_condition_by_age?: number | null;
    };
  }>;
  registration_fee?: {
    option_name: string;
    amount: number;
    child_amount?: number | null;
    child_condition_by_age?: number | null;
  };
}

export interface RazorpayInvoiceResponse {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  yatra_name: string;
  fee_category: string;
  participant_name: string;
  participant_phone: string;
}

export const createRazorpayInvoice = async (data: RazorpayInvoiceRequest): Promise<RazorpayInvoiceResponse> => {
  return mutateAuthenticated(`${API_BASE_URL}/yatra/${data.yatra_id}/order`, "POST", {
    participant_id: data.participant_id,
    amount: data.amount,
    currency: data.currency || "INR",
    fee_category: data.fee_category,
    related_participant_ids: data.related_participant_ids || [],
    registration_fee: data.registration_fee,
  });
};

export interface RazorpayVerificationRequest {
  razorpay_order_id?: string;
  razorpay_invoice_id?: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const verifyPayment = async (yatraId: string, data: RazorpayVerificationRequest): Promise<any> => {
  return mutateAuthenticated(`${API_BASE_URL}/yatra/${yatraId}/verify-payment`, "POST", data);
};

export const fetchPaymentHistory = async (participantId: string): Promise<PaymentRecord[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/yatra/payment-history/${participantId}`);
};

export const fetchYatraReceipt = async (yatraId: string, participantId: string): Promise<ReceiptResponse> => {
  return fetchAuthenticated(`${API_BASE_URL}/yatra/${yatraId}/receipt/${participantId}`);
};

export const uploadPhoto = async (file: File, participantId: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("participant_id", participantId);

  const token = localStorage.getItem('das_auth_token');
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/drive/upload-photo`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(errorData.detail || "Upload failed");
  }

  const data = await response.json();
  return data.link;
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

// Updated search function to use authenticated headers when available
export const searchParticipantPublic = async (phone: string): Promise<Participant[]> => {
  const response = await fetch(`${API_BASE_URL}/participants/search?query=${encodeURIComponent(phone)}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) return [];
  return response.json();
};

export const fetchParticipantByIdPublic = async (id: string): Promise<Participant> => {
  const response = await fetch(`${API_BASE_URL}/participants/${id}`, {
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) throw new Error("Failed to fetch participant");
  return response.json();
};

export const fetchParticipantByPhonePublic = async (phone: string): Promise<Participant | null> => {
  const response = await fetch(`${API_BASE_URL}/participants/phone/${phone}`, {
    headers: { "Content-Type": "application/json" }
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch participant' }));
    throw new Error(errorData.detail || "Failed to fetch participant");
  }
  return response.json();
};

export const upsertParticipantPublic = async (data: any, id?: string): Promise<Participant> => {
  const url = id
    ? `${API_BASE_URL}/participants/${id}`
    : `${API_BASE_URL}/register/participant`;

  const response = await fetch(url, {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, participant_id: id }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to process request' }));
    throw new Error(errorData.detail || "Failed to process participant data");
  }
  return response.json();
};

// Map searchParticipant to fetchParticipants for clarity
export const fetchParticipants = async (query: string): Promise<Participant[]> => {
  return searchParticipantPublic(query);
};