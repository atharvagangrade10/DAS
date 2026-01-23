"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMonthlyExerciseInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, Dumbbell } from "lucide-react";

interface ExerciseTabProps {
    year: number;
    month: number;
    participantId?: string;
}

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
            <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-stone-200" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10">
            <div className="mb-10 text-center px-4">
                <h2 className="text-2xl font-black text-stone-800 mb-2 uppercase tracking-tight">Body Temple</h2>
                <p className="text-xs font-medium text-stone-500 max-w-[240px] mx-auto leading-relaxed">
                    Maintaining the physical vehicle ensures the mind remains steady for spiritual absorption.
                </p>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-stone-100 shadow-sm mb-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 rounded-2xl bg-stone-50 text-stone-400">
                        <Dumbbell className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-stone-800 tracking-tight">Movement Rhythm</h3>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">Days Active</span>
                        <p className="text-2xl font-black text-stone-700 tracking-tight">{exercise?.exercise_days ?? 0}</p>
                        <p className="text-xs font-medium text-stone-500 leading-snug">Total days of movement.</p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">Consistency</span>
                        <p className="text-2xl font-black text-stone-700 tracking-tight">{Math.round(exercise?.percent_days_exercised || 0)}%</p>
                        <p className="text-xs font-medium text-stone-500 leading-snug">Portion of the month active.</p>
                    </div>
                    <div className="space-y-2 col-span-2 pt-4 border-t border-stone-50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">Median Duration</span>
                        <p className="text-2xl font-black text-stone-700 tracking-tight">{exercise?.median_exercise_minutes ?? 0}m</p>
                        <p className="text-xs font-medium text-stone-500 leading-snug">Typical time spent in support of health.</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center opacity-40 px-8">
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                    Movement as support, not pursuit.
                </p>
            </div>
        </div>
    );
};

export default ExerciseTab;
