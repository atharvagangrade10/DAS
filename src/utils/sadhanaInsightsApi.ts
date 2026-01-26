import { fetchAuthenticated } from "./api";
import {
    SleepInsightResponse,
    ChantingInsightResponse,
    BookInsightResponse,
    AssociationInsightResponse,
    AratiInsightResponse,
    ExerciseInsightResponse,
    ScoresInsightResponse,
    ParticipantRankingResponse
} from "@/types/sadhana";

import { API_BASE_URL as BASE_URL } from "@/config/api";

export const fetchMonthlySleepInsight = async (participantId: string, year: number, month: number): Promise<SleepInsightResponse> => {
    return fetchAuthenticated(`${BASE_URL}/activities/insights/sleep/${participantId}/${year}/${month}`);
};

export const fetchMonthlyChantingInsight = async (participantId: string, year: number, month: number): Promise<ChantingInsightResponse> => {
    return fetchAuthenticated(`${BASE_URL}/activities/insights/chanting/${participantId}/${year}/${month}`);
};

export const fetchMonthlyBookInsight = async (participantId: string, year: number, month: number): Promise<BookInsightResponse> => {
    return fetchAuthenticated(`${BASE_URL}/activities/insights/book/${participantId}/${year}/${month}`);
};

export const fetchMonthlyAssociationInsight = async (participantId: string, year: number, month: number): Promise<AssociationInsightResponse> => {
    return fetchAuthenticated(`${BASE_URL}/activities/insights/association/${participantId}/${year}/${month}`);
};

export const fetchMonthlyAratiInsight = async (participantId: string, year: number, month: number): Promise<AratiInsightResponse> => {
    return fetchAuthenticated(`${BASE_URL}/activities/insights/arati/${participantId}/${year}/${month}`);
};

export const fetchMonthlyExerciseInsight = async (participantId: string, year: number, month: number): Promise<ExerciseInsightResponse> => {
    // Matching backend route spelling: /insights/excercise/
    return fetchAuthenticated(`${BASE_URL}/activities/insights/excercise/${participantId}/${year}/${month}`);
};

export const fetchMonthlyScoresInsight = async (participantId: string, year: number, month: number): Promise<ScoresInsightResponse> => {
    return fetchAuthenticated(`${BASE_URL}/activities/insights/scores/${participantId}/${year}/${month}`);
};

export const fetchParticipantRankings = async (participantId?: string): Promise<ParticipantRankingResponse[]> => {
    let url = `${BASE_URL}/activities/rankings`;
    if (participantId) {
        url += `?participant_id=${participantId}`;
    }
    return fetchAuthenticated(url);
};