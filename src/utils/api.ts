"use client";

import { AttendedProgram, Participant } from "@/types/participant";
import { Program, Session } from "@/types/program";
import { Yatra, YatraCreate, YatraUpdate, PaymentRecord, ReceiptResponse } from "@/types/yatra";
import { Batch, BatchCreate, BatchUpdate, BatchAttendanceRecord, BatchVolunteer, BatchStatsResponse, BatchParticipantStats } from "@/types/batch";
import {
  Course, CourseCreate, CourseUpdate, Step, StepCreate, StepUpdate, StepOrder,
  Material, MaterialCreate, EnrollDefaultResponse, MaterialsCompleteResponse,
  Exam, ExamCreate, ExamSubmission, ExamSubmissionRequest, ExamSubmissionDetails,
  GradeTheoryRequest, ApproveSubmissionResponse, ExamStartResponse,
  RequirementTable, RequirementTableCreate, RequirementTableUpdate, RequirementTableSubmission,
  RequirementRowUpdate, PendingRequirementSubmission, RequirementRowApproval,
  MyCourse, CourseProgressDetail, StepProgressDetail
} from "@/types/course";
  ActivityLogResponse,
  ActivityLogCreate,
  ActivityLogUpdate,
  ChantingLogCreate,
  ChantingLogUpdate,
  ChantingLogResponse,
  BookLogCreate,
  BookLogUpdate,
  BookLogResponse,
  AssociationLogCreate,
  AssociationLogUpdate,
  AssociationLogResponse
} from "@/types/sadhana";
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
export const fetchAuthenticated = async (url: string) => {

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Unauthorized access. Logging out.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: `Failed to fetch data` }));
    const errorMessage = `${errorData.detail || 'Failed to fetch data'} (Status: ${response.status})`;
    throw new Error(errorMessage);
  }
  return response.json();
};

// Helper function for authenticated POST/PUT/DELETE requests
export const mutateAuthenticated = async (url: string, method: string, body?: any) => {

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
    const errorMessage = `${errorData.detail || 'Failed to execute request'} (Status: ${response.status})`;
    throw new Error(errorMessage);
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
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete batch' }));
    throw new Error(errorData.detail || "Failed to delete batch");
  }
};

export const fetchBatchParticipants = async (batchId: string): Promise<any[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/batches/${batchId}/participants`);
};

export const addParticipantToBatch = async (batchId: string, participantId: string) => {
  return mutateAuthenticated(`${API_BASE_URL}/batches/${batchId}/participants`, "POST", { participant_id: participantId });
};

// New endpoint to remove a participant from a batch
export const removeParticipantFromBatch = async (batchId: string, participantId: string): Promise<void> => {
  return mutateAuthenticated(`${API_BASE_URL}/batches/${batchId}/participants/${participantId}`, "DELETE");
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

export const fetchBatchVolunteers = async (batchId: string): Promise<BatchVolunteer[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/batches/${batchId}/volunteers`);
};

export const assignVolunteerToBatch = async (batchId: string, participantId: string): Promise<BatchVolunteer> => {
  return mutateAuthenticated(`${API_BASE_URL}/batches/${batchId}/volunteers`, "POST", { participant_id: participantId });
};

export const removeVolunteerFromBatch = async (batchId: string, participantId: string): Promise<void> => {
  return mutateAuthenticated(`${API_BASE_URL}/batches/${batchId}/volunteers/${participantId}`, "DELETE");
};

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

export const createRazorpayInvoice = async (data: any): Promise<any> => {
  return mutateAuthenticated(`${API_BASE_URL}/yatra/${data.yatra_id}/order`, "POST", data);
};

export const verifyPayment = async (yatraId: string, data: any): Promise<any> => {
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

// --- Sadhana Activity Endpoints ---

export const fetchActivityLogByDate = async (participantId: string, date: string): Promise<ActivityLogResponse> => {
  return fetchAuthenticated(`${API_BASE_URL}/activities/date/${participantId}?date=${date}`);
};

export const createActivityLog = async (data: ActivityLogCreate): Promise<ActivityLogResponse> => {
  return mutateAuthenticated(`${API_BASE_URL}/activities/create`, "POST", data);
};

export const updateActivityLog = async (activityId: string, data: ActivityLogUpdate): Promise<ActivityLogResponse> => {
  return mutateAuthenticated(`${API_BASE_URL}/activities/${activityId}`, "PUT", data);
};

export const addChantingLog = async (activityId: string, data: ChantingLogCreate): Promise<ChantingLogResponse> => {
  return mutateAuthenticated(`${API_BASE_URL}/activities/${activityId}/chanting-logs`, "POST", data);
};

export const updateChantingLog = async (activityId: string, slot: string, data: ChantingLogUpdate): Promise<ChantingLogResponse> => {
  return mutateAuthenticated(`${API_BASE_URL}/activities/${activityId}/chanting-logs/${slot}`, "PUT", data);
};

export const deleteChantingLog = async (activityId: string, slot: string): Promise<void> => {
  return mutateAuthenticated(`${API_BASE_URL}/activities/${activityId}/chanting-logs/${slot}`, "DELETE");
};

export const addBookLog = async (activityId: string, data: BookLogCreate): Promise<BookLogResponse> => {
  return mutateAuthenticated(`${API_BASE_URL}/activities/${activityId}/book-logs`, "POST", data);
};

export const updateBookLog = async (activityId: string, name: string, data: BookLogUpdate): Promise<BookLogResponse> => {
  return mutateAuthenticated(`${API_BASE_URL}/activities/${activityId}/book-logs/${encodeURIComponent(name)}`, "PUT", data);
};

export const deleteBookLog = async (activityId: string, name: string): Promise<void> => {
  return mutateAuthenticated(`${API_BASE_URL}/activities/${activityId}/book-logs/${encodeURIComponent(name)}`, "DELETE");
};

export const addAssociationLog = async (activityId: string, data: AssociationLogCreate): Promise<AssociationLogResponse> => {
  return mutateAuthenticated(`${API_BASE_URL}/activities/${activityId}/association-logs`, "POST", data);
};

export const updateAssociationLog = async (activityId: string, type: string, data: AssociationLogUpdate): Promise<AssociationLogResponse> => {
  return mutateAuthenticated(`${API_BASE_URL}/activities/${activityId}/association-logs/${type}`, "PUT", data);
};

export const deleteAssociationLog = async (activityId: string, type: string): Promise<void> => {
  return mutateAuthenticated(`${API_BASE_URL}/activities/${activityId}/association-logs/${type}`, "DELETE");
};


// --- Public Endpoints ---

export const fetchYatrasPublic = async (): Promise<Yatra[]> => {
  const response = await fetch(`${API_BASE_URL}/yatra/`, { headers: { "Content-Type": "application/json" } });
  if (!response.ok) throw new Error("Failed to fetch trip details");
  return response.json();
};

export const createAccountCheck = async (phone: string): Promise<AccountStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/create-account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!response.ok) throw new Error("Failed to check account status");
  return response.json();
};

export const createParticipantPublic = async (data: any): Promise<Participant> => {
  const response = await fetch(`${API_BASE_URL}/auth/create-participant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to register participant");
  return response.json();
};

export const setPasswordPublic = async (participant_id: string, password: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_id, password }),
  });
  if (!response.ok) throw new Error("Failed to set account password");
  return response.json();
};

export const forgotPassword = async (phone: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!response.ok) throw new Error("Failed to initiate password reset");
  return response.json();
};

export const resetPassword = async (token: string, new_password: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password }),
  });
  if (!response.ok) throw new Error("Failed to reset password");
  return response.json();
};

export const searchParticipantPublic = async (phone: string): Promise<Participant[]> => {
  const response = await fetch(`${API_BASE_URL}/participants/search?query=${encodeURIComponent(phone)}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) return [];
  return response.json();
};

export const fetchParticipantByIdPublic = async (id: string): Promise<Participant> => {
  const response = await fetch(`${API_BASE_URL}/participants/${id}`, { headers: { "Content-Type": "application/json" } });
  if (!response.ok) throw new Error("Failed to fetch participant");
  return response.json();
};

export const fetchParticipantByPhonePublic = async (phone: string): Promise<Participant | null> => {
  const response = await fetch(`${API_BASE_URL}/participants/phone/${phone}`, { headers: { "Content-Type": "application/json" } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch participant");
  return response.json();
};

export const upsertParticipantPublic = async (data: any, id?: string): Promise<Participant> => {
  const url = id ? `${API_BASE_URL}/participants/${id}` : `${API_BASE_URL}/register/participant`;
  const response = await fetch(url, {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, participant_id: id }),
  });
  if (!response.ok) throw new Error("Failed to process participant data");
  return response.json();
};

export const fetchParticipants = async (query: string): Promise<Participant[]> => {
  return searchParticipantPublic(query);
};

// ============================================
// LMS / COURSE API ENDPOINTS
// ============================================

// --- Course Endpoints ---

export const fetchCourses = async (params?: { is_active?: boolean; is_default?: boolean }): Promise<Course[]> => {
  const queryString = params
    ? `?${new URLSearchParams(params as any).toString()}`
    : '';
  return fetchAuthenticated(`${API_BASE_URL}/courses${queryString}`);
};

export const fetchCourseById = async (courseId: string): Promise<Course> => {
  return fetchAuthenticated(`${API_BASE_URL}/courses/${courseId}`);
};

export const createCourse = async (data: CourseCreate): Promise<Course> => {
  return mutateAuthenticated(`${API_BASE_URL}/courses`, "POST", data);
};

export const updateCourse = async (courseId: string, data: CourseUpdate): Promise<Course> => {
  return mutateAuthenticated(`${API_BASE_URL}/courses/${courseId}`, "PUT", data);
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete course' }));
    throw new Error(errorData.detail || "Failed to delete course");
  }
};

export const setDefaultCourse = async (courseId: string): Promise<void> => {
  await mutateAuthenticated(`${API_BASE_URL}/courses/${courseId}/set-default`, "PUT", {});
};

export const enrollDefaultCourse = async (participantId: string): Promise<EnrollDefaultResponse> => {
  return fetchAuthenticated(`${API_BASE_URL}/courses/enroll-default?participant_id=${participantId}`);
};

export const reorderSteps = async (courseId: string, stepOrders: StepOrder[]): Promise<void> => {
  await mutateAuthenticated(`${API_BASE_URL}/courses/${courseId}/steps/reorder`, "POST", { step_orders: stepOrders });
};

// --- Step Endpoints ---

export const fetchStepById = async (stepId: string, participantId?: string): Promise<Step> => {
  const queryString = participantId ? `?participant_id=${participantId}` : '';
  return fetchAuthenticated(`${API_BASE_URL}/steps/${stepId}${queryString}`);
};

export const createStep = async (data: StepCreate): Promise<Step> => {
  return mutateAuthenticated(`${API_BASE_URL}/steps`, "POST", data);
};

export const updateStep = async (stepId: string, data: StepUpdate): Promise<Step> => {
  return mutateAuthenticated(`${API_BASE_URL}/steps/${stepId}`, "PUT", data);
};

export const deleteStep = async (stepId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/steps/${stepId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete step' }));
    throw new Error(errorData.detail || "Failed to delete step");
  }
};

export const markMaterialsComplete = async (stepId: string, participantId: string): Promise<MaterialsCompleteResponse> => {
  return fetchAuthenticated(`${API_BASE_URL}/steps/${stepId}/materials-complete?participant_id=${participantId}`);
};

export const startStepExam = async (stepId: string, participantId: string): Promise<ExamStartResponse> => {
  return fetchAuthenticated(`${API_BASE_URL}/steps/${stepId}/exam/start?participant_id=${participantId}`);
};

export const linkExamToStep = async (stepId: string, formId: string): Promise<void> => {
  await mutateAuthenticated(`${API_BASE_URL}/steps/${stepId}/exam?form_id=${formId}`, "PUT");
};

// --- Material Endpoints ---

export const createMaterial = async (stepId: string, data: MaterialCreate): Promise<Material> => {
  return mutateAuthenticated(`${API_BASE_URL}/steps/${stepId}/materials`, "POST", data);
};

export const updateMaterial = async (materialId: string, data: Partial<MaterialCreate>): Promise<Material> => {
  return mutateAuthenticated(`${API_BASE_URL}/materials/${materialId}`, "PUT", data);
};

export const deleteMaterial = async (materialId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/materials/${materialId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete material' }));
    throw new Error(errorData.detail || "Failed to delete material");
  }
};

export const markMaterialComplete = async (materialId: string, participantId: string): Promise<{ message: string; material_id: string }> => {
  return fetchAuthenticated(`${API_BASE_URL}/materials/${materialId}/complete?participant_id=${participantId}`);
};

// --- Exam/Form Endpoints ---

export const fetchForms = async (stepId?: string): Promise<Exam[]> => {
  const queryString = stepId ? `?step_id=${stepId}` : '';
  return fetchAuthenticated(`${API_BASE_URL}/forms${queryString}`);
};

export const fetchFormById = async (formId: string): Promise<Exam> => {
  return fetchAuthenticated(`${API_BASE_URL}/forms/${formId}`);
};

export const createExam = async (data: ExamCreate): Promise<Exam> => {
  return mutateAuthenticated(`${API_BASE_URL}/forms`, "POST", data);
};

export const updateExam = async (formId: string, data: Partial<ExamCreate>): Promise<Exam> => {
  return mutateAuthenticated(`${API_BASE_URL}/forms/${formId}`, "PUT", data);
};

export const deleteExam = async (formId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/forms/${formId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete exam' }));
    throw new Error(errorData.detail || "Failed to delete exam");
  }
};

export const submitExamAnswers = async (submissionId: string, data: ExamSubmissionRequest): Promise<ExamSubmission> => {
  return mutateAuthenticated(`${API_BASE_URL}/forms/submissions/${submissionId}/submit`, "POST", data);
};

// --- Exam Submission & Review Endpoints ---

export const fetchPendingSubmissions = async (filters?: { step_id?: string; course_id?: string }): Promise<ExamSubmission[]> => {
  const params = new URLSearchParams(filters as any).toString();
  const queryString = params ? `?${params}` : '';
  return fetchAuthenticated(`${API_BASE_URL}/form-submissions/pending${queryString}`);
};

export const fetchSubmissionDetails = async (submissionId: string): Promise<ExamSubmissionDetails> => {
  return fetchAuthenticated(`${API_BASE_URL}/form-submissions/${submissionId}`);
};

export const gradeTheoryAnswers = async (submissionId: string, managerId: string, data: GradeTheoryRequest): Promise<any> => {
  return mutateAuthenticated(`${API_BASE_URL}/form-submissions/${submissionId}/grade?manager_id=${managerId}`, "POST", data);
};

export const approveSubmission = async (submissionId: string, managerId: string, data: { feedback?: string; unlock_next_course?: boolean }): Promise<ApproveSubmissionResponse> => {
  return mutateAuthenticated(`${API_BASE_URL}/form-submissions/${submissionId}/approve?manager_id=${managerId}`, "POST", data);
};

export const rejectSubmission = async (submissionId: string, managerId: string, data: { feedback?: string }): Promise<any> => {
  return mutateAuthenticated(`${API_BASE_URL}/form-submissions/${submissionId}/reject?manager_id=${managerId}`, "POST", data);
};

export const requestRetake = async (submissionId: string, managerId: string, data: { reason: string }): Promise<any> => {
  return mutateAuthenticated(`${API_BASE_URL}/form-submissions/${submissionId}/request-retake?manager_id=${managerId}`, "POST", data);
};

export const fetchParticipantSubmissions = async (participantId: string): Promise<ExamSubmission[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/form-submissions/participant/${participantId}`);
};

// --- Requirement Table Endpoints ---

export const fetchRequirementTables = async (stepId?: string): Promise<RequirementTable[]> => {
  const queryString = stepId ? `?step_id=${stepId}` : '';
  return fetchAuthenticated(`${API_BASE_URL}/requirement-tables${queryString}`);
};

export const fetchRequirementTableById = async (tableId: string): Promise<RequirementTable> => {
  return fetchAuthenticated(`${API_BASE_URL}/requirement-tables/${tableId}`);
};

export const createRequirementTable = async (data: RequirementTableCreate): Promise<RequirementTable> => {
  return mutateAuthenticated(`${API_BASE_URL}/requirement-tables`, "POST", data);
};

export const updateRequirementTable = async (tableId: string, data: RequirementTableUpdate): Promise<RequirementTable> => {
  return mutateAuthenticated(`${API_BASE_URL}/requirement-tables/${tableId}`, "PUT", data);
};

export const deleteRequirementTable = async (tableId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/requirement-tables/${tableId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete requirement table' }));
    throw new Error(errorData.detail || "Failed to delete requirement table");
  }
};

export const fetchMyRequirementSubmission = async (tableId: string, participantId: string): Promise<RequirementTableSubmission> => {
  return fetchAuthenticated(`${API_BASE_URL}/requirement-tables/${tableId}/my-submission?participant_id=${participantId}`);
};

export const updateRequirementRow = async (submissionId: string, participantId: string, data: RequirementRowUpdate): Promise<any> => {
  return mutateAuthenticated(`${API_BASE_URL}/requirement-tables/submissions/${submissionId}/rows?participant_id=${participantId}`, "POST", data);
};

export const submitRequirementTable = async (submissionId: string, participantId: string): Promise<any> => {
  return fetchAuthenticated(`${API_BASE_URL}/requirement-tables/submissions/${submissionId}/submit?participant_id=${participantId}`);
};

export const fetchPendingRequirementSubmissions = async (stepId?: string): Promise<PendingRequirementSubmission[]> => {
  const queryString = stepId ? `?step_id=${stepId}` : '';
  return fetchAuthenticated(`${API_BASE_URL}/requirement-tables/submissions/pending${queryString}`);
};

export const approveRejectRequirementRow = async (submissionId: string, serialNumber: number, managerId: string, data: RequirementRowApproval): Promise<any> => {
  return mutateAuthenticated(`${API_BASE_URL}/requirement-tables/submissions/${submissionId}/rows/${serialNumber}/approve?manager_id=${managerId}`, "POST", data);
};

export const approveEntireRequirementTable = async (submissionId: string, managerId: string): Promise<any> => {
  return fetchAuthenticated(`${API_BASE_URL}/requirement-tables/submissions/${submissionId}/approve?manager_id=${managerId}`);
};

// --- Participant Progress Endpoints ---

export const fetchMyCourses = async (participantId: string): Promise<MyCourse[]> => {
  return fetchAuthenticated(`${API_BASE_URL}/participants/me/courses?participant_id=${participantId}`);
};

export const fetchCourseProgress = async (courseId: string, participantId: string): Promise<CourseProgressDetail> => {
  console.log('API: fetchCourseProgress called with courseId:', courseId, 'participantId:', participantId);
  const result = await fetchAuthenticated(`${API_BASE_URL}/participants/me/progress/${courseId}?participant_id=${participantId}`);
  console.log('API: fetchCourseProgress result:', result);
  return result;
};

export const fetchStepProgress = async (stepId: string, participantId: string): Promise<StepProgressDetail> => {
  console.log('API: fetchStepProgress called with stepId:', stepId, 'participantId:', participantId);
  const result = await fetchAuthenticated(`${API_BASE_URL}/participants/me/step/${stepId}/progress?participant_id=${participantId}`);
  console.log('API: fetchStepProgress result:', result);
  return result;
};