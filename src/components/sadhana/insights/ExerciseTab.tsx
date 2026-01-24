"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMonthlyExerciseInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, Dumbbell, Circle } from "lucide-react";
import { ExerciseInsightResponse } from "@/types/sadhana";

interface ExerciseTabProps {
    year: number;
    month: number;
    participantId?: string;
}

// Sleek Metric Card
const SleekMetricCard = ({
    label,
    value,
    subtext
}: {
    label: string;
    value: string | number | null;
    subtext: string;
}) => {
    return (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100 flex flex-col h-full justify-between">
            <div>
                <div className="text-xs sm:text-sm font-bold text-gray-400 mb-3 sm:mb-4 uppercase tracking-widest">
                    {label}
                </div>
                <div className="text-4xl sm:text-5xl font-normal text-[#0D1B2A] mb-3 sm:mb-4 tracking-tight">
                    {value ?? "—"}
                </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {subtext}
            </p>
        </div>
    );
};

// --- REFLECTION PRESETS ---
const REFLECTIONS = {
    GREEN: [
        "Your body is being supported consistently. Rhythm and duration are healthy.",
        "A healthy foundation for your energy. The consistency of movement is serving you well.",
        "Movement has become a steady, reliable support for your physical well-being."
    ],
    YELLOW: [
        "Movement is present, but rhythm isn’t settled yet. Steadying the pattern will increase the benefit.",
        "Daily movement is real but light. Slightly longer duration would provide stronger support.",
        "Consistency varies. Establishing a baseline of daily movement will stabilize your energy."
    ],
    RED: [
        "Movement is rare; gentle re-entry could help build the physical support you need.",
        "Brief movement helps, but minimum viability for health is slightly higher.",
        "Sporadic intense sessions may strain the body. Consistent, moderate movement is a safer path."
    ]
};

const calculateExerciseStatus = (data: ExerciseInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return {
        status: "YELLOW",
        title: "Waiting for Data",
        colorClass: "text-gray-500",
        iconColor: "fill-gray-500",
        bgGradient: "from-gray-50 to-stone-50",
        reflection: "Log your movement to track body support."
    };

    const days = data.exercise_days || 0;
    const totalDays = data.days_count || 30;
    const dayRatio = days / totalDays;

    const median = data.median_exercise_minutes || 0;
    const iqr = data.iqr_exercise_minutes || 999;

    // Seed
    const seed = (year + month) % 3;

    // --- RED CONDITIONS ---
    const isRed =
        (dayRatio < 0.25) ||          // Rare Movement
        (median < 10) ||              // Too Little to Support Health
        (iqr > 2 * median && median > 0); // Burst Pattern

    if (isRed) {
        let title = "Body Undersupported";
        if (dayRatio < 0.25) title = "Rare Movement";
        else if (median < 10) title = "Too Little Support";
        else if (iqr > 2 * median) title = "Burst Pattern";

        return {
            status: "RED",
            title: title,
            colorClass: "text-rose-500",
            iconColor: "fill-rose-500",
            bgGradient: "from-rose-50 to-red-50",
            reflection: REFLECTIONS.RED[seed]
        };
    }

    // --- GREEN CONDITIONS ---
    // Mandatory 1-3
    const isGreenCandidate =
        (dayRatio >= 0.50) &&
        (iqr <= median) &&
        (median >= 20);

    if (isGreenCandidate) {
        return {
            status: "GREEN",
            title: "Body Supported",
            colorClass: "text-emerald-500",
            iconColor: "fill-emerald-500",
            bgGradient: "from-emerald-50 to-green-50",
            reflection: REFLECTIONS.GREEN[seed]
        };
    }

    // --- YELLOW CONDITIONS ---
    return {
        status: "YELLOW",
        title: "Some Movement",
        colorClass: "text-amber-500",
        iconColor: "fill-amber-500",
        bgGradient: "from-amber-50 to-yellow-50",
        reflection: REFLECTIONS.YELLOW[seed]
    };
};

const ExerciseTab: React.FC<ExerciseTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    const targetUserId = participantId || user?.user_id!;

    const { data: exercise, isLoading } = useQuery({
        queryKey: ["insight", "exercise", targetUserId, year, month],
        queryFn: () => fetchMonthlyExerciseInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
        );
    }

    const health = calculateExerciseStatus(exercise, year, month);

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-100">
                <div className="p-3 bg-orange-50 rounded-xl">
                    <Dumbbell className="h-6 w-6 text-orange-500 fill-orange-500" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[#0D1B2A] text-xl sm:text-2xl font-medium">Exercise</h3>
                </div>

                {/* Status Pill */}
                <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r rounded-full border border-white/50 self-start sm:self-auto ${health.bgGradient}`}>
                    <Circle className={`h-3 w-3 ${health.iconColor}`} />
                    <span className={`text-sm font-bold ${health.colorClass}`}>{health.title}</span>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <SleekMetricCard
                    label="Median Daily Exercise"
                    value={exercise?.median_exercise_minutes ? `${Math.round(exercise.median_exercise_minutes)} min` : "0 min"}
                    subtext="Your typical exercise duration each day"
                />
                <SleekMetricCard
                    label="% Days Exercised"
                    value={exercise?.percent_days_exercised ? `${Math.round(exercise.percent_days_exercised)}%` : "0%"}
                    subtext="Days with any physical activity"
                />
            </div>

            {/* Reflection Box */}
            <div className={`bg-gradient-to-br rounded-2xl p-5 sm:p-7 border shadow-sm ${health.status === 'RED' ? 'from-rose-50 to-red-50 border-rose-100' : health.status === 'YELLOW' ? 'from-amber-50 to-yellow-50 border-amber-100' : 'from-emerald-50 to-green-50 border-emerald-100'}`}>
                <h4 className="text-[#0D1B2A] mb-2 sm:mb-3 text-base sm:text-lg font-medium">Reflection</h4>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                    {health.reflection}
                </p>
            </div>

        </div>
    );
};

export default ExerciseTab;
