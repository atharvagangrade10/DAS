# Course/LMS API Reference

Backend API documentation for the Course/LMS system. This document provides all endpoints, request/response formats, and integration details for frontend developers.

**Base URL**: `http://localhost:8000` (or your configured backend URL)

**Authentication**: JWT token required in header: `Authorization: Bearer <token>`

---

## Table of Contents

1. [Courses](#courses)
2. [Steps](#steps)
3. [Materials](#materials)
4. [Forms/Exams](#formsexams)
5. [Exam Submissions](#exam-submissions)
6. [Submission Review](#submission-review)
7. [Requirement Tables](#requirement-tables)
8. [Participant Progress](#participant-progress)

---

## Courses

### Get All Courses
```http
GET /courses?is_active=true&is_default=false
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| is_active | boolean | No | Filter by active status |
| is_default | boolean | No | Filter by default status |

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Bhakti Shastri Course",
    "description": "In-depth study of Bhagavad-gita",
    "image_url": "https://example.com/image.jpg",
    "previous_course_id": null,
    "next_course_id": "507f1f77bcf86cd799439012",
    "default_step_id": "507f1f77bcf86cd799439013",
    "order_index": 0,
    "is_active": true,
    "is_default": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "created_by": "manager123"
  }
]
```

### Get Course by ID
```http
GET /courses/{course_id}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Bhakti Shastri Course",
  "description": "In-depth study of Bhagavad-gita",
  "image_url": "https://example.com/image.jpg",
  "previous_course_id": null,
  "next_course_id": "507f1f77bcf86cd799439012",
  "default_step_id": null,
  "order_index": 0,
  "is_active": true,
  "is_default": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "created_by": "manager123",
  "steps": [
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "Step 1: Introduction",
      "description": "Basic concepts",
      "order_index": 0,
      "exam_id": "507f1f77bcf86cd799439014",
      "is_locked": false
    }
  ]
}
```

### Create Course (Manager)
```http
POST /courses
```

**Request Body:**
```json
{
  "name": "Bhakti Shastri Course",
  "description": "In-depth study of Bhagavad-gita",
  "image_url": "https://example.com/image.jpg",
  "is_default": false,
  "previous_course_id": null,
  "order_index": 0
}
```

**Response:** `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Bhakti Shastri Course",
  "description": "In-depth study of Bhagavad-gita",
  "image_url": "https://example.com/image.jpg",
  "previous_course_id": null,
  "next_course_id": null,
  "default_step_id": null,
  "order_index": 0,
  "is_active": true,
  "is_default": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "created_by": "manager123"
}
```

### Update Course (Manager)
```http
PUT /courses/{course_id}
```

**Request Body:**
```json
{
  "name": "Updated Course Name",
  "description": "Updated description",
  "image_url": "https://example.com/new-image.jpg",
  "is_default": false,
  "previous_course_id": null,
  "next_course_id": null,
  "is_active": true
}
```

### Delete Course (Manager)
```http
DELETE /courses/{course_id}
```

**Response:** `204 No Content`

### Set Default Course (Manager)
```http
PUT /courses/{course_id}/set-default
```

### Enroll in Default Course
```http
POST /courses/enroll-default?participant_id={participant_id}
```

**Response:**
```json
{
  "message": "Enrolled in default course",
  "course_id": "507f1f77bcf86cd799439011",
  "course_name": "Bhakti Shastri Course",
  "current_step_id": "507f1f77bcf86cd799439013"
}
```

### Reorder Steps (Manager)
```http
POST /courses/{course_id}/steps/reorder
```

**Request Body:**
```json
{
  "step_orders": [
    {"step_id": "507f1f77bcf86cd799439013", "order_index": 1},
    {"step_id": "507f1f77bcf86cd799439014", "order_index": 2}
  ]
}
```

**Response:**
```json
{
  "message": "Steps reordered successfully"
}
```

---

## Steps

### Get Step Details
```http
GET /steps/{step_id}?participant_id={participant_id}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| participant_id | string | No | Include progress info |

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439013",
  "name": "Step 1: Introduction",
  "description": "Basic concepts of Bhakti",
  "course_id": "507f1f77bcf86cd799439011",
  "order_index": 0,
  "is_locked": false,
  "has_exam": true,
  "exam_id": "507f1f77bcf86cd799439014",
  "exam_info": {
    "id": "507f1f77bcf86cd799439014",
    "name": "Step 1 Exam",
    "duration_minutes": 30,
    "total_marks": 50,
    "passing_marks": 30
  },
  "materials": [
    {
      "id": "507f1f77bcf86cd799439015",
      "material_type": "Video",
      "title": "Introduction Video",
      "description": "Watch this video first",
      "order_index": 0,
      "is_mandatory": true,
      "content": {
        "url": "https://youtube.com/watch?v=example"
      },
      "is_completed": false
    }
  ],
  "progress": {
    "is_started": true,
    "materials_completed": false,
    "completed_materials_count": 1,
    "total_materials": 3,
    "exam_status": "NotStarted"
  }
}
```

### Create Step (Manager)
```http
POST /steps
```

**Request Body:**
```json
{
  "course_id": "507f1f77bcf86cd799439011",
  "name": "Step 2: Advanced Concepts",
  "description": "Deeper understanding",
  "order_index": 1,
  "previous_step_id": "507f1f77bcf86cd799439013",
  "unlock_on_exam_pass": true
}
```

### Update Step (Manager)
```http
PUT /steps/{step_id}
```

**Request Body:**
```json
{
  "name": "Updated Step Name",
  "description": "Updated description",
  "order_index": 1,
  "unlock_on_exam_pass": true
}
```

### Delete Step (Manager)
```http
DELETE /steps/{step_id}
```

**Response:** `204 No Content`

### Mark Materials Complete
```http
POST /steps/{step_id}/materials-complete?participant_id={participant_id}
```

**Response:**
```json
{
  "message": "All materials marked as complete",
  "can_take_exam": true,
  "exam_id": "507f1f77bcf86cd799439014"
}
```

### Start Step Exam
```http
POST /steps/{step_id}/exam/start?participant_id={participant_id}
```

**Response:**
```json
{
  "submission_id": "507f1f77bcf86cd799439020",
  "form": {
    "id": "507f1f77bcf86cd799439014",
    "name": "Step 1 Exam",
    "duration_minutes": 30,
    "questions": [
      {
        "question_id": "q1",
        "question_type": "MCQ",
        "question_text": "What is Bhakti?",
        "options": [
          {"option_id": "a", "text": "Devotion"},
          {"option_id": "b", "text": "Knowledge"}
        ],
        "marks": 5,
        "max_words": null
      },
      {
        "question_id": "q2",
        "question_type": "THEORY",
        "question_text": "Explain the importance of chanting",
        "options": [],
        "marks": 10,
        "max_words": 200
      }
    ]
  },
  "duration_minutes": 30,
  "started_at": "2024-01-15T11:00:00Z",
  "attempt_number": 1
}
```

### Link Exam to Step (Manager)
```http
PUT /steps/{step_id}/exam?form_id={form_id}
```

---

## Materials

### Create Material (Manager)
```http
POST /steps/{step_id}/materials
```

**Request Body:**
```json
{
  "material_type": "Video",
  "title": "Introduction Video",
  "description": "Watch this video first",
  "content": {
    "url": "https://youtube.com/watch?v=example"
  },
  "order_index": 0,
  "is_mandatory": true
}
```

**Material Types:**
| Type | Description | Content Structure |
|------|-------------|-------------------|
| Video | Video content | `{"url": "https://..."}` |
| BookLink | Link to book | `{"url": "https://...", "title": "Book Name"}` |
| Document | PDF/Document | `{"url": "https://..."}` |
| Audio | Audio content | `{"url": "https://..."}` |
| RequirementTable | Interactive table | `{"requirement_table_id": "..."}` |

**Response:** `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439015",
  "step_id": "507f1f77bcf86cd799439013",
  "material_type": "Video",
  "title": "Introduction Video"
}
```

### Update Material (Manager)
```http
PUT /materials/{material_id}
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "content": {
    "url": "https://new-url.com"
  }
}
```

### Delete Material (Manager)
```http
DELETE /materials/{material_id}
```

**Response:** `204 No Content`

### Mark Material Complete
```http
POST /materials/{material_id}/complete?participant_id={participant_id}
```

**Response:**
```json
{
  "message": "Material marked as complete",
  "material_id": "507f1f77bcf86cd799439015"
}
```

---

## Forms/Exams

### Get All Forms
```http
GET /forms?step_id={step_id}
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439014",
    "name": "Step 1 Exam",
    "description": "Test your knowledge",
    "step_id": "507f1f77bcf86cd799439013",
    "duration_minutes": 30,
    "total_marks": 50,
    "passing_marks": 30,
    "question_count": 10
  }
]
```

### Get Form by ID
```http
GET /forms/{form_id}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "name": "Step 1 Exam",
  "description": "Test your knowledge",
  "step_id": "507f1f77bcf86cd799439013",
  "duration_minutes": 30,
  "total_marks": 50,
  "passing_marks": 30,
  "max_attempts": 3,
  "passing_percentage": 60.0,
  "questions": [
    {
      "question_id": "q1",
      "question_type": "MCQ",
      "question_text": "What is Bhakti?",
      "options": [
        {"option_id": "a", "text": "Devotion"},
        {"option_id": "b", "text": "Knowledge"},
        {"option_id": "c", "text": "Yoga"},
        {"option_id": "d", "text": "Meditation"}
      ],
      "marks": 5,
      "max_words": null
    },
    {
      "question_id": "q2",
      "question_type": "THEORY",
      "question_text": "Explain the importance of chanting",
      "options": [],
      "marks": 10,
      "max_words": 200
    }
  ]
}
```

### Create Form (Manager)
```http
POST /forms
```

**Request Body:**
```json
{
  "name": "Step 1 Exam",
  "description": "Test your knowledge",
  "step_id": "507f1f77bcf86cd799439013",
  "duration_minutes": 30,
  "passing_marks": 30,
  "total_marks": 50,
  "max_attempts": 3,
  "passing_percentage": 60.0,
  "questions": [
    {
      "question_id": "q1",
      "question_type": "MCQ",
      "question_text": "What is Bhakti?",
      "options": [
        {"option_id": "a", "text": "Devotion", "is_correct": true},
        {"option_id": "b", "text": "Knowledge", "is_correct": false}
      ],
      "marks": 5
    },
    {
      "question_id": "q2",
      "question_type": "THEORY",
      "question_text": "Explain chanting",
      "marks": 10,
      "max_words": 200
    }
  ]
}
```

### Update Form (Manager)
```http
PUT /forms/{form_id}
```

### Delete Form (Manager)
```http
DELETE /forms/{form_id}
```

---

## Exam Submissions

### Submit Exam Answers
```http
POST /forms/submissions/{submission_id}/submit
```

**Request Body:**
```json
{
  "mcq_answers": [
    {"question_id": "q1", "selected_option_id": "a"}
  ],
  "theory_answers": [
    {"question_id": "q2", "answer_text": "Chanting is important because..."}
  ]
}
```

**Response:**
```json
{
  "submission_id": "507f1f77bcf86cd799439020",
  "mcq_score": 25,
  "theory_score": null,
  "submission_status": "Submitted",
  "submitted_at": "2024-01-15T11:30:00Z"
}
```

---

## Submission Review (Manager)

### Get Pending Submissions
```http
GET /form-submissions/pending?step_id={step_id}&course_id={course_id}
```

**Response:**
```json
[
  {
    "submission_id": "507f1f77bcf86cd799439020",
    "participant_id": "user123",
    "form_id": "507f1f77bcf86cd799439014",
    "form_name": "Step 1 Exam",
    "step_id": "507f1f77bcf86cd799439013",
    "step_name": "Step 1: Introduction",
    "course_id": "507f1f77bcf86cd799439011",
    "course_name": "Bhakti Shastri Course",
    "mcq_score": 25,
    "theory_score": null,
    "submission_status": "Submitted",
    "submitted_at": "2024-01-15T11:30:00Z",
    "attempt_number": 1
  }
]
```

### Get Submission Details
```http
GET /form-submissions/{submission_id}
```

**Response:**
```json
{
  "submission_id": "507f1f77bcf86cd799439020",
  "participant_id": "user123",
  "step_id": "507f1f77bcf86cd799439013",
  "step_name": "Step 1: Introduction",
  "course_id": "507f1f77bcf86cd799439011",
  "mcq_score": 25,
  "theory_score": null,
  "total_score": null,
  "submission_status": "Submitted",
  "submitted_at": "2024-01-15T11:30:00Z",
  "attempt_number": 1,
  "feedback": null,
  "questions": [
    {
      "question_id": "q1",
      "question_type": "MCQ",
      "question_text": "What is Bhakti?",
      "options": [
        {"option_id": "a", "text": "Devotion", "is_correct": true},
        {"option_id": "b", "text": "Knowledge", "is_correct": false}
      ],
      "marks": 5,
      "max_words": null,
      "participant_answer": {"question_id": "q1", "selected_option_id": "a"}
    },
    {
      "question_id": "q2",
      "question_type": "THEORY",
      "question_text": "Explain chanting",
      "marks": 10,
      "max_words": 200,
      "participant_answer": {"question_id": "q2", "answer_text": "Chanting is..."},
      "marks_awarded": null
    }
  ],
  "form": {
    "total_marks": 50,
    "passing_marks": 30
  }
}
```

### Grade Theory Answers
```http
POST /form-submissions/{submission_id}/grade?manager_id={manager_id}
```

**Request Body:**
```json
{
  "theory_grades": [
    {"question_id": "q2", "marks_awarded": 8}
  ],
  "feedback": "Good attempt, needs more detail"
}
```

### Approve Submission
```http
POST /form-submissions/{submission_id}/approve?manager_id={manager_id}
```

**Request Body:**
```json
{
  "feedback": "Well done! You passed.",
  "unlock_next_course": false
}
```

**Response:**
```json
{
  "message": "Submission approved",
  "next_step_unlocked": true,
  "next_step_id": "507f1f77bcf86cd799439014",
  "course_completed": false
}
```

### Reject Submission
```http
POST /form-submissions/{submission_id}/reject?manager_id={manager_id}
```

**Request Body:**
```json
{
  "feedback": "Please review the materials and try again."
}
```

### Request Retake
```http
POST /form-submissions/{submission_id}/request-retake?manager_id={manager_id}
```

**Request Body:**
```json
{
  "reason": "Needs improvement in theory answers"
}
```

### Get Participant Submissions
```http
GET /form-submissions/participant/{participant_id}
```

---

## Requirement Tables

### Get All Requirement Tables
```http
GET /requirement-tables?step_id={step_id}
```

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439025",
    "name": "Daily Sadhana Tracker",
    "description": "Track your daily spiritual practices",
    "step_id": "507f1f77bcf86cd799439013",
    "requirement_count": 5,
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

### Get Requirement Table by ID
```http
GET /requirement-tables/{table_id}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439025",
  "name": "Daily Sadhana Tracker",
  "description": "Track your daily spiritual practices",
  "step_id": "507f1f77bcf86cd799439013",
  "requirements": [
    {
      "serial_number": 1,
      "activity": "Chanting Rounds",
      "target": 16,
      "unit": "rounds"
    },
    {
      "serial_number": 2,
      "activity": "Reading Bhagavad-gita",
      "target": 30,
      "unit": "minutes"
    }
  ],
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### Create Requirement Table (Manager)
```http
POST /requirement-tables
```

**Request Body:**
```json
{
  "name": "Daily Sadhana Tracker",
  "description": "Track your daily spiritual practices",
  "step_id": "507f1f77bcf86cd799439013",
  "requirements": [
    {
      "serial_number": 1,
      "activity": "Chanting Rounds",
      "target": 16,
      "unit": "rounds"
    },
    {
      "serial_number": 2,
      "activity": "Reading Bhagavad-gita",
      "target": 30,
      "unit": "minutes"
    }
  ]
}
```

### Update Requirement Table (Manager)
```http
PUT /requirement-tables/{table_id}
```

### Delete Requirement Table (Manager)
```http
DELETE /requirement-tables/{table_id}
```

### Get My Requirement Submission
```http
GET /requirement-tables/{table_id}/my-submission?participant_id={participant_id}
```

**Response:**
```json
{
  "submission_id": "507f1f77bcf86cd799439026",
  "requirement_table": {
    "id": "507f1f77bcf86cd799439025",
    "name": "Daily Sadhana Tracker",
    "description": "Track your daily spiritual practices"
  },
  "row_statuses": [
    {
      "serial_number": 1,
      "activity": "Chanting Rounds",
      "target": 16,
      "unit": "rounds",
      "completed": true,
      "completed_value": 16,
      "remarks": "Completed on time",
      "completed_at": "2024-01-15T08:00:00Z",
      "approved": true,
      "approved_by": "manager123",
      "approved_at": "2024-01-15T10:00:00Z",
      "approval_remarks": "Excellent!"
    },
    {
      "serial_number": 2,
      "activity": "Reading Bhagavad-gita",
      "target": 30,
      "unit": "minutes",
      "completed": true,
      "completed_value": 25,
      "remarks": "Will do more tomorrow",
      "completed_at": "2024-01-15T09:00:00Z",
      "approved": false,
      "approved_by": null,
      "approved_at": null,
      "approval_remarks": null
    }
  ],
  "is_completed": true,
  "is_approved": false,
  "submitted_at": "2024-01-15T09:30:00Z"
}
```

### Update Requirement Row
```http
POST /requirement-tables/submissions/{submission_id}/rows?participant_id={participant_id}
```

**Request Body:**
```json
{
  "serial_number": 1,
  "completed": true,
  "completed_value": 16,
  "remarks": "Completed on time"
}
```

**Response:**
```json
{
  "message": "Row updated",
  "is_completed": true
}
```

### Submit Requirement Table
```http
POST /requirement-tables/submissions/{submission_id}/submit?participant_id={participant_id}
```

**Response:**
```json
{
  "message": "Submitted for review",
  "submitted_at": "2024-01-15T09:30:00Z"
}
```

### Get Pending Requirement Submissions (Manager)
```http
GET /requirement-tables/submissions/pending?step_id={step_id}
```

**Response:**
```json
[
  {
    "submission_id": "507f1f77bcf86cd799439026",
    "participant_id": "user123",
    "requirement_table_id": "507f1f77bcf86cd799439025",
    "table_name": "Daily Sadhana Tracker",
    "step_id": "507f1f77bcf86cd799439013",
    "completed_rows": 5,
    "total_rows": 5,
    "approved_rows": 3,
    "submitted_at": "2024-01-15T09:30:00Z"
  }
]
```

### Approve/Reject Requirement Row (Manager)
```http
POST /requirement-tables/submissions/{submission_id}/rows/{serial_number}/approve?manager_id={manager_id}
```

**Request Body:**
```json
{
  "approved": true,
  "approval_remarks": "Great job!"
}
```

**Response:**
```json
{
  "message": "Row updated",
  "approved": true,
  "all_approved": false
}
```

### Approve Entire Requirement Table (Manager)
```http
POST /requirement-tables/submissions/{submission_id}/approve?manager_id={manager_id}
```

---

## Participant Progress

### Get My Courses
```http
GET /participants/me/courses?participant_id={participant_id}
```

**Response:**
```json
[
  {
    "course_id": "507f1f77bcf86cd799439011",
    "course_name": "Bhakti Shastri Course",
    "description": "In-depth study of Bhagavad-gita",
    "image_url": "https://example.com/image.jpg",
    "is_default": true,
    "current_step": {
      "step_id": "507f1f77bcf86cd799439013",
      "step_name": "Step 1: Introduction",
      "order_index": 0
    },
    "progress": {
      "completed_steps": 0,
      "total_steps": 5,
      "percentage": 0
    },
    "step_progress": {
      "is_started": true,
      "materials_completed": false,
      "exam_status": "NotStarted"
    },
    "requirement_status": {
      "completed": 3,
      "approved": 2,
      "total": 5
    },
    "is_completed": false
  }
]
```

### Get Course Progress
```http
GET /participants/me/progress/{course_id}?participant_id={participant_id}
```

**Response:**
```json
{
  "course": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Bhakti Shastri Course",
    "description": "In-depth study"
  },
  "current_step_id": "507f1f77bcf86cd799439013",
  "current_step_order_index": 0,
  "completed_step_ids": [],
  "is_completed": false,
  "steps": [
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "Step 1: Introduction",
      "description": "Basic concepts",
      "order_index": 0,
      "is_locked": false,
      "is_completed": false,
      "exam_id": "507f1f77bcf86cd799439014",
      "exam_info": {
        "id": "507f1f77bcf86cd799439014",
        "name": "Step 1 Exam",
        "duration_minutes": 30
      },
      "progress": {
        "is_started": true,
        "materials_completed": false,
        "exam_status": "NotStarted"
      },
      "material_count": 3
    }
  ]
}
```

### Get Step Progress
```http
GET /participants/me/step/{step_id}/progress?participant_id={participant_id}
```

**Response:**
```json
{
  "step": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Step 1: Introduction",
    "description": "Basic concepts",
    "order_index": 0
  },
  "progress": {
    "is_started": true,
    "materials_completed": false,
    "completed_materials": ["507f1f77bcf86cd799439015"],
    "exam_status": "NotStarted",
    "is_completed": false
  },
  "materials": [
    {
      "id": "507f1f77bcf86cd799439015",
      "material_type": "Video",
      "title": "Introduction Video",
      "description": "Watch this video first",
      "order_index": 0,
      "is_mandatory": true,
      "content": {
        "url": "https://youtube.com/watch?v=example"
      },
      "is_completed": true
    },
    {
      "id": "507f1f77bcf86cd799439016",
      "material_type": "RequirementTable",
      "title": "Daily Sadhana Tracker",
      "description": "Track your progress",
      "order_index": 1,
      "is_mandatory": true,
      "content": {
        "requirement_table_id": "507f1f77bcf86cd799439025"
      },
      "is_completed": false,
      "requirement_progress": {
        "completed": 3,
        "approved": 2,
        "total": 5,
        "is_submitted": false
      }
    }
  ],
  "exam_submission": null
}
```

---

## Enums

### MaterialTypeEnum
| Value | Description |
|-------|-------------|
| RequirementTable | Interactive requirement table |
| Video | Video content |
| BookLink | Link to a book |
| Document | PDF or document |
| Audio | Audio content |

### QuestionTypeEnum
| Value | Description |
|-------|-------------|
| MCQ | Multiple Choice Question |
| Theory | Text/Descriptive answer |

### FormSubmissionStatus
| Value | Description |
|-------|-------------|
| Submitted | Submitted for review |
| UnderReview | Being reviewed |
| Approved | Approved and passed |
| Rejected | Rejected |
| RetakeRequested | Retake requested |

### StepExamStatus
| Value | Description |
|-------|-------------|
| NotStarted | Exam not started |
| InProgress | Exam in progress |
| Submitted | Answers submitted |
| Approved | Exam passed |
| Rejected | Exam failed |

---

## Error Responses

All endpoints may return error responses:

```json
{
  "detail": "Error message description"
}
```

**Common HTTP Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |
