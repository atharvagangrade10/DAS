# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DAS (Devotee Administration System) is a React 18 + TypeScript SPA for managing devotee programs, attendance, classes (batches), and yatra (pilgrimage) registrations. The application serves a spiritual organization with role-based access control.

## Commands

```bash
# Development
npm run dev          # Start dev server on port 8080

# Building
npm run build        # Production build
npm run build:dev    # Development mode build
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## Tech Stack

- **Build**: Vite 6 with SWC for React fast refresh
- **UI**: React 18, shadcn/ui components (Radix UI), Tailwind CSS
- **State**: React Context (auth), TanStack Query (server state)
- **Routing**: React Router DOM with role-based protection
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Exports**: jsPDF + autoTable (PDF), xlsx (Excel)

## Architecture

### Layer Structure

```
src/
├── components/ui/          # Shadcn/ui base components (auto-generated)
├── components/batch-management/  # Batch management feature module
├── context/                # React Context providers (AuthContext)
├── pages/                  # Route components
├── types/                  # TypeScript definitions
├── utils/api.ts            # Centralized API functions
└── config/api.ts           # API base URL config
```

### Authentication Flow

1. JWT tokens stored in localStorage (`das_auth_token`)
2. User data cached in localStorage (`das_auth_user`)
3. On app load, user data is refreshed from API via `fetchParticipantById`
4. Global 401 handler (`handleUnauthorized`) auto-logs out users
5. AuthContext registers the logout handler globally for 401 responses

### API Layer (`src/utils/api.ts`)

- All API calls use centralized helpers: `fetchAuthenticated` (GET) and `mutAuthenticated` (POST/PUT/DELETE)
- These helpers inject Bearer tokens and handle 401 responses
- Public endpoints (auth, participant search) are also included here
- Base URL configured in `src/config/api.ts`

### Role-Based Access Control

Roles: `Attendee` → `DevoteeFriend` → `Volunteer` → `Manager`

Route protection is defined in `App.tsx`:
- **Public**: Login, registration, password reset
- **All authenticated**: Dashboard, profile, payments, programs
- **DevoteeFriend/Manager**: Friends management
- **Volunteer/Manager**: Attendance marking
- **Manager only**: Yatra, participants, statistics

### State Management Patterns

- **Auth state**: React Context with localStorage persistence
- **Server state**: TanStack Query for API data (most pages)
- **Local UI state**: useState for dialogs, forms, toggles

### Batch System

Batches are classes with participants, volunteers, and attendance tracking:
- Participants can be enrolled in batches
- Volunteers can be assigned to batches
- Attendance is marked per date with bulk operations
- Each batch has stats (attendance rates, participant counts)
- Volunteers see "My Assigned Batches", participants see "My Enrolled Batches"

### Yatra & Payments

- Yatra registrations with Razorpay integration
- Support for family members (`related_participant_ids`)
- Fee categories with tiered pricing (adult/child by age)
- Payment verification and receipt generation
- Live Razorpay key in `src/config/api.ts`

### Form Handling

- React Hook Form for form state
- Zod schemas for validation (defined alongside components)
- Custom validation error handling via backend `detail` responses

### Export Functionality

- **PDF**: jsPDF with autoTable for structured reports
- **Excel**: xlsx library for spreadsheet exports
- Used in Stats and other reporting pages

## Important Notes

- Path alias `@` maps to `./src`
- Profile photos have separate storage key `das_profile_photos`
- All dates are ISO strings
- ESLint unused vars rule is disabled (line 26 of eslint.config.js)
- Dyad component tagger plugin is active for development
