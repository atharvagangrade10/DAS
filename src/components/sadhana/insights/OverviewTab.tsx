"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
    fetchMonthlySleepInsight,
    fetchMonthlyChantingInsight,
    fetchMonthlyBookInsight,
    fetchMonthlyExerciseInsight
} from "@/utils/sadhanaInsightsApi";
import { Loader2, Calendar, Flame, Trophy } from "lucide-react";
import { InsightCard, MetricBadge } from "./InsightComponents";

interface OverviewTabProps {
    year: number;
    month: number;
    participantId?: string;
}

const SummaryStatCard = ({ label, value, subValue, icon: Icon, colorClass }: any) => (
    <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden group">
        <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity">
            <Icon className={`h-6 w-6 ${colorClass}`} />
        </div>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{label}</span>
        <div>
            <span className="text-3xl font-black text-stone-800 tracking-tighter">{value}</span>
            <p className="text-[10px] font-medium text-stone-400 mt-1">{subValue}</p>
        </div>
    </div>
);

const OverviewTab: React.FC<OverviewTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    // Use provided participantId for managers, otherwise fallback to logged-in user
    const targetUserId = participantId || user?.user_id!;

    const sleepQuery = useQuery({
        queryKey: ["insight", "sleep", targetUserId, year, month],
        queryFn: () => fetchMonthlySleepInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    const chantingQuery = useQuery({
        queryKey: ["insight", "chanting", targetUserId, year, month],
        queryFn: () => fetchMonthlyChantingInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    const bookQuery = useQuery({
        queryKey: ["insight", "book", targetUserId, year, month],
        queryFn: () => fetchMonthlyBookInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    const exerciseQuery = useQuery({
        queryKey: ["insight", "exercise", targetUserId, year, month],
        queryFn: () => fetchMonthlyExerciseInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });


    const isLoading = sleepQuery.isLoading || chantingQuery.isLoading || bookQuery.isLoading;

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-stone-200" />
            </div>
        );
    }

    // Derived logic for "Streaks"
    const currentStreak = bookQuery.data?.days_count ? "?" : 0;
    const longestStreak = bookQuery.data?.longest_reading_streak || 0;
    const totalDaysLogged = (chantingQuery.data?.days_count || 0);
    const totalDaysInMonth = 30; // Approximation

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10">

            {/* Top Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <SummaryStatCard
                    label="Total Days Logged"
                    value={totalDaysLogged}
                    subValue={`out of ${totalDaysInMonth} days`}
                    icon={Calendar}
                    colorClass="text-blue-500"
                />
                <SummaryStatCard
                    label="Current Streak"
                    value={longestStreak > 0 ? "~" : 0}
                    subValue="consecutive days"
                    icon={Flame}
                    colorClass="text-orange-500"
                />
                <SummaryStatCard
                    label="Longest Streak"
                    value={longestStreak}
                    subValue="days in a row"
                    icon={Trophy}
                    colorClass="text-yellow-500"
                />
            </div>

            <h3 className="text-sm font-bold text-stone-800 mb-4 px-2">Quick Glance</h3>

            <InsightCard className="mb-6">
                <div className="grid grid-cols-2 gap-8">
                    <MetricBadge
                        label="Wake Up"
                        value={sleepQuery.data?.median_wakeup_time ? sleepQuery.data.median_wakeup_time.slice(0, 5) : "—"}
                    />
                    <MetricBadge
                        label="Chanting"
                        value={chantingQuery.data?.median_daily_rounds || 0}
                        subValue="rounds avg"
                    />
                    <MetricBadge
                        label="Reading"
                        value={bookQuery.data?.median_daily_reading_minutes || 0}
                        subValue="min avg"
                    />
                    <MetricBadge
                        label="Exercise"
                        value={exerciseQuery.data?.percent_days_exercised ? `${Math.round(exerciseQuery.data.percent_days_exercised)}%` : "0%"}
                        subValue="consistency"
                    />
                </div>
            </InsightCard>

            <div className="text-center opacity-40 px-8 mt-8">
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                    Consistency is the secret of success.
                </p>
            </div>

        </div>
    );
};

export default OverviewTab;
