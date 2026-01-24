// Course/LMS Type Definitions
// Based on COURSE_LMS_API_REFERENCE.md

// ============================================
// Enums
// ============================================

export enum MaterialTypeEnum {
  REQUIREMENT_TABLE = "RequirementTable",
  VIDEO = "Video",
  BOOK_LINK = "BookLink",
  DOCUMENT = "Document",
  AUDIO = "Audio",
}

export enum QuestionTypeEnum {
  MCQ = "MCQ",
  THEORY = "Theory",
}

export enum FormSubmissionStatus {
  Submitted = "Submitted",
  UnderReview = "UnderReview",
  Approved = "Approved",
  Rejected = "Rejected",
  RetakeRequested = "RetakeRequested",
}

export enum StepExamStatus {
  NotStarted = "NotStarted",
  InProgress = "InProgress",
  Submitted = "Submitted",
  Approved = "Approved",
  Rejected = "Rejected",
}

// ============================================
// Course Types
// ============================================

export interface Course {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  previous_course_id: string | null;
  next_course_id: string | null;
  default_step_id: string | null;
  order_index: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  steps?: Step[];
}

export interface CourseCreate {
  name: string;
  description?: string;
  image_url?: string;
  is_default?: boolean;
  previous_course_id?: string | null;
  order_index: number;
}

export interface CourseUpdate {
  name?: string;
  description?: string;
  image_url?: string;
  is_default?: boolean;
  previous_course_id?: string | null;
  next_course_id?: string | null;
  is_active?: boolean;
}

// ============================================
// Step Types
// ============================================

export interface Step {
  id: string;
  name: string;
  description: string;
  course_id: string;
  order_index: number;
  is_locked: boolean;
  has_exam: boolean;
  exam_id?: string;
  exam_info?: ExamBasicInfo;
  unlock_on_exam_pass?: boolean;
  previous_step_id?: string;
  materials?: Material[];
  progress?: StepProgress;
}

export interface StepCreate {
  course_id: string;
  name: string;
  description?: string;
  order_index: number;
  previous_step_id?: string;
  unlock_on_exam_pass?: boolean;
}

export interface StepUpdate {
  name?: string;
  description?: string;
  order_index?: number;
  previous_step_id?: string;
  unlock_on_exam_pass?: boolean;
}

export interface StepProgress {
  is_started: boolean;
  materials_completed: boolean;
  completed_materials_count: number;
  total_materials: number;
  exam_status: StepExamStatus;
}

export interface ExamBasicInfo {
  id: string;
  name: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
}

// ============================================
// Material Types
// ============================================

export interface Material {
  id: string;
  step_id: string;
  material_type: MaterialTypeEnum;
  title: string;
  description: string;
  content: MaterialContent;
  order_index: number;
  is_mandatory: boolean;
  is_completed?: boolean;
  requirement_progress?: RequirementProgress;
}

export interface MaterialContent {
  url?: string;
  title?: string;
  requirement_table_id?: string;
}

export interface MaterialCreate {
  material_type: MaterialTypeEnum;
  title: string;
  description?: string;
  content: MaterialContent;
  order_index: number;
  is_mandatory?: boolean;
}

export interface RequirementProgress {
  completed: number;
  approved: number;
  total: number;
  is_submitted: boolean;
}

// ============================================
// Exam/Form Types
// ============================================

export interface Exam {
  id: string;
  name: string;
  description?: string;
  step_id: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  max_attempts: number;
  passing_percentage: number;
  questions: Question[];
}

export interface Question {
  question_id: string;
  question_type: QuestionTypeEnum;
  question_text: string;
  options: QuestionOption[];
  marks: number;
  max_words?: number;
}

export interface QuestionOption {
  option_id: string;
  text: string;
  is_correct?: boolean;
}

export interface ExamCreate {
  name: string;
  description?: string;
  step_id: string;
  duration_minutes: number;
  passing_marks: number;
  total_marks: number;
  max_attempts: number;
  passing_percentage: number;
  questions: ExamQuestionCreate[];
}

export interface ExamQuestionCreate {
  question_id?: string;
  question_type: QuestionTypeEnum;
  question_text: string;
  options?: QuestionOptionCreate[];
  marks: number;
  max_words?: number;
}

export interface QuestionOptionCreate {
  option_id: string;
  text: string;
  is_correct: boolean;
}

// ============================================
// Exam Submission Types
// ============================================

export interface ExamSubmission {
  submission_id: string;
  participant_id: string;
  form_id: string;
  form_name: string;
  step_id: string;
  step_name: string;
  course_id: string;
  course_name: string;
  mcq_score: number;
  theory_score: number | null;
  total_score: number | null;
  submission_status: FormSubmissionStatus;
  submitted_at: string;
  attempt_number: number;
  feedback?: string;
}

export interface MCQAnswer {
  question_id: string;
  selected_option_id: string;
}

export interface TheoryAnswer {
  question_id: string;
  answer_text: string;
}

export interface ExamSubmissionRequest {
  mcq_answers: MCQAnswer[];
  theory_answers: TheoryAnswer[];
}

export interface ExamSubmissionDetails extends ExamSubmission {
  questions: ExamQuestionWithAnswer[];
  form: {
    total_marks: number;
    passing_marks: number;
  };
}

export interface ExamQuestionWithAnswer extends Question {
  participant_answer?: MCQAnswer | TheoryAnswer;
  marks_awarded?: number;
}

export interface TheoryGrade {
  question_id: string;
  marks_awarded: number;
}

export interface GradeTheoryRequest {
  theory_grades: TheoryGrade[];
  feedback?: string;
}

export interface ExamStartResponse {
  submission_id: string;
  form: Exam;
  duration_minutes: number;
  started_at: string;
  attempt_number: number;
}

// ============================================
// Requirement Table Types
// ============================================

export interface RequirementTable {
  id: string;
  name: string;
  description: string;
  step_id: string;
  requirements: Requirement[];
  requirement_count: number;
  created_at: string;
  updated_at: string;
}

export interface Requirement {
  serial_number: number;
  activity: string;
  target: number;
  unit: string;
}

export interface RequirementTableCreate {
  name: string;
  description?: string;
  step_id?: string;
  requirements: Requirement[];
}

export interface RequirementTableUpdate {
  name?: string;
  description?: string;
  requirements?: Requirement[];
}

export interface RequirementTableSubmission {
  submission_id: string;
  requirement_table: RequirementTable;
  row_statuses: RequirementRowStatus[];
  is_completed: boolean;
  is_approved: boolean;
  submitted_at?: string;
}

export interface RequirementRowStatus {
  serial_number: number;
  activity: string;
  target: number;
  unit: string;
  completed: boolean;
  completed_value?: number;
  remarks?: string;
  completed_at?: string;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  approval_remarks?: string;
}

export interface RequirementRowUpdate {
  serial_number: number;
  completed: boolean;
  completed_value?: number;
  remarks?: string;
}

export interface PendingRequirementSubmission {
  submission_id: string;
  participant_id: string;
  requirement_table_id: string;
  table_name: string;
  step_id: string;
  completed_rows: number;
  total_rows: number;
  approved_rows: number;
  submitted_at: string;
}

export interface RequirementRowApproval {
  approved: boolean;
  approval_remarks?: string;
}

// ============================================
// Progress Types
// ============================================

export interface MyCourse {
  course_id: string;
  course_name: string;
  description: string;
  image_url?: string;
  is_default: boolean;
  current_step: CurrentStepInfo;
  progress: CourseProgress;
  step_progress: StepProgress;
  requirement_status?: RequirementStatus;
  is_completed: boolean;
}

export interface CurrentStepInfo {
  step_id: string;
  step_name: string;
  order_index: number;
}

export interface CourseProgress {
  completed_steps: number;
  total_steps: number;
  percentage: number;
}

export interface RequirementStatus {
  completed: number;
  approved: number;
  total: number;
}

export interface CourseProgressDetail {
  course: {
    id: string;
    name: string;
    description: string;
  };
  current_step_id: string;
  current_step_order_index: number;
  completed_step_ids: string[];
  is_completed: boolean;
  steps: Step[];
}

export interface StepProgressDetail {
  step: Step;
  progress: StepProgress;
  materials: Material[];
  exam_submission?: ExamSubmission;
}

// ============================================
// Step Order for Reordering
// ============================================

export interface StepOrder {
  step_id: string;
  order_index: number;
}

// ============================================
// Enroll in Default Course Response
// ============================================

export interface EnrollDefaultResponse {
  message: string;
  course_id: string;
  course_name: string;
  current_step_id: string;
}

// ============================================
// Mark Materials Complete Response
// ============================================

export interface MaterialsCompleteResponse {
  message: string;
  can_take_exam: boolean;
  exam_id: string;
}

// ============================================
// Approve Submission Response
// ============================================

export interface ApproveSubmissionResponse {
  message: string;
  next_step_unlocked: boolean;
  next_step_id?: string;
  course_completed: boolean;
}
