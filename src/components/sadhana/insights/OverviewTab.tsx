"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
    fetchMonthlyChantingInsight,
    fetchMonthlySleepInsight,
    fetchMonthlyBookInsight,
    fetchMonthlyAssociationInsight,
    fetchMonthlyAratiInsight,
    fetchMonthlyExerciseInsight
} from "@/utils/sadhanaInsightsApi";
import { Loader2, BedDouble, BookOpen, Heart, Flame, Dumbbell, Sparkles } from "lucide-react";
import { formatTime12h } from "@/utils/format";
import { cn } from "@/lib/utils";
import {
    calculateSleepStatus,
    calculateChantingStatus,
    calculateReadingStatus,
    calculateAssociationStatus,
    calculateAratiStatus,
    calculateExerciseStatus,
    HealthStatus
} from "@/utils/insightLogic";

interface OverviewTabProps {
    year: number;
    month: number;
    participantId?: string;
}

// Domain Summary Card Component
const DomainCard = ({
    title,
    icon: Icon,
    value,
    label,
    status,
    reflection,
    statusTitle,
    iconBgColor = "bg-gray-100",
    iconColor = "text-gray-600"
}: {
    title: string;
    icon: any;
    value: string | number | null;
    label: string;
    status: HealthStatus;
    reflection: string;
    statusTitle: string;
    iconBgColor?: string;
    iconColor?: string;
}) => {
    // Map status to dot color
    const getDotColor = (s: HealthStatus) => {
        if (s === "GREEN") return "bg-emerald-500";
        if (s === "YELLOW") return "bg-amber-500";
        return "bg-rose-500";
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
            {/* Header Row */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-xl", iconBgColor)}>
                        <Icon className={cn("h-5 w-5", iconColor)} />
                    </div>
                    <div>
                        <span className="text-sm font-bold text-gray-600 block">{title}</span>
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{statusTitle}</span>
                    </div>
                </div>
                {/* Status Dot */}
                <span className={cn("h-2.5 w-2.5 rounded-full shadow-sm", getDotColor(status))} />
            </div>

            {/* Metric Row */}
            <div className="mb-4">
                <div className="text-3xl sm:text-4xl font-normal text-[#0D1B2A] mb-1 tracking-tight">
                    {value ?? "—"}
                </div>
                <div className="text-xs text-gray-400 font-medium">{label}</div>
            </div>

            {/* Reflection Text */}
            <div className="mt-auto pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    {reflection}
                </p>
            </div>
        </div>
    );
};

const OverviewTab: React.FC<OverviewTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    const targetUserId = participantId || user?.user_id!;

    // Parallel Fetching
    const { data: chanting } = useQuery({ queryKey: ["insight", "chanting", targetUserId, year, month], queryFn: () => fetchMonthlyChantingInsight(targetUserId, year, month) });
    const { data: sleep } = useQuery({ queryKey: ["insight", "sleep", targetUserId, year, month], queryFn: () => fetchMonthlySleepInsight(targetUserId, year, month) });
    const { data: reading } = useQuery({ queryKey: ["insight", "book", targetUserId, year, month], queryFn: () => fetchMonthlyBookInsight(targetUserId, year, month) });
    const { data: association } = useQuery({ queryKey: ["insight", "association", targetUserId, year, month], queryFn: () => fetchMonthlyAssociationInsight(targetUserId, year, month) });
    const { data: arati } = useQuery({ queryKey: ["insight", "arati", targetUserId, year, month], queryFn: () => fetchMonthlyAratiInsight(targetUserId, year, month) });
    const { data: exercise } = useQuery({ queryKey: ["insight", "exercise", targetUserId, year, month], queryFn: () => fetchMonthlyExerciseInsight(targetUserId, year, month) });

    // --- Calculate Statuses ---
    const sSleep = calculateSleepStatus(sleep, year, month);
    const sChanting = calculateChantingStatus(chanting, year, month);
    const sReading = calculateReadingStatus(reading, year, month);
    const sAssoc = calculateAssociationStatus(association, year, month);
    const sArati = calculateAratiStatus(arati, year, month);
    const sExercise = calculateExerciseStatus(exercise, year, month);

    // --- Aggregate Monthly Reflection ---
    const allStatuses = [sSleep.status, sChanting.status, sReading.status, sAssoc.status, sArati.status, sExercise.status];
    const greenCount = allStatuses.filter(s => s === "GREEN").length;
    const redCount = allStatuses.filter(s => s === "RED").length;

    let overallTitle = "Good Progress";
    let overallColor = "bg-amber-500";
    let overallBg = "bg-amber-50 border-amber-100";
    let summaryText = "Your sadhana is active, with some areas settling into rhythm while others are still forming.";

    if (greenCount >= 4 && redCount === 0) {
        overallTitle = "Excellent Harmony";
        overallColor = "bg-emerald-500";
        overallBg = "bg-emerald-50 border-emerald-100";
        summaryText = "Your month shows strong rhythm and discipline. Core habits are stable, with no internal conflicts. You are consistently nourished.";
    } else if (redCount >= 2) {
        overallTitle = "Needs Anchoring";
        overallColor = "bg-rose-500";
        overallBg = "bg-rose-50 border-rose-100";
        summaryText = "Multiple areas are showing fragmentation. Focusing on just one key anchor (like Sleep or Chanting) can help stabilize the whole ecosystem.";
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

            {/* Monthly Reflection Section */}
            <div className={cn("rounded-[2rem] p-8 sm:p-10 shadow-sm border transition-colors duration-500", overallBg)}>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h2 className="text-xl sm:text-2xl font-medium text-[#0D1B2A]">Monthly Reflection</h2>
                        <span className="text-sm font-medium text-gray-400">
                            • {sleep?.days_count || 0} days logged
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-full border border-black/5 w-fit backdrop-blur-sm">
                        <span className={cn("h-2 w-2 rounded-full", overallColor)} />
                        <span className="text-xs font-bold text-[#0D1B2A] uppercase tracking-wide">{overallTitle}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base max-w-4xl font-medium opacity-90">
                        {summaryText}
                    </p>
                </div>
            </div>

            {/* Domain Summary Title */}
            <div>
                <h3 className="text-lg font-medium text-gray-500 mb-6 px-1">Domain Summary</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Sleep */}
                    <DomainCard
                        title="Sleep & Wake"
                        icon={BedDouble}
                        iconBgColor="bg-rose-50"
                        iconColor="text-rose-500"
                        status={sSleep.status}
                        statusTitle={sSleep.title}
                        reflection={sSleep.reflection}
                        value={formatTime12h(sleep?.median_wakeup_time)}
                        label="Median wake-up time"
                    />

                    {/* Chanting */}
                    <DomainCard
                        title="Chanting"
                        icon={Sparkles}
                        iconBgColor="bg-purple-50"
                        iconColor="text-purple-500"
                        status={sChanting.status}
                        statusTitle={sChanting.title}
                        reflection={sChanting.reflection}
                        value={chanting?.median_daily_rounds ? `${Math.round(chanting.median_daily_rounds)} rounds` : "—"}
                        label="Median daily rounds"
                    />

                    {/* Reading */}
                    <DomainCard
                        title="Reading"
                        icon={BookOpen}
                        iconBgColor="bg-blue-50"
                        iconColor="text-blue-500"
                        status={sReading.status}
                        statusTitle={sReading.title}
                        reflection={sReading.reflection}
                        value={reading?.median_daily_reading_minutes ? `${Math.round(reading.median_daily_reading_minutes)} min` : "0 min"}
                        label="Median daily reading"
                    />

                    {/* Association */}
                    <DomainCard
                        title="Association"
                        icon={Heart}
                        iconBgColor="bg-amber-50"
                        iconColor="text-amber-500"
                        status={sAssoc.status}
                        statusTitle={sAssoc.title}
                        reflection={sAssoc.reflection}
                        value={association?.median_daily_association_minutes ? `${Math.round(association.median_daily_association_minutes)} min` : "0 min"}
                        label="Median daily time"
                    />

                    {/* Arati */}
                    <DomainCard
                        title="Ārati"
                        icon={Flame}
                        iconBgColor="bg-orange-50"
                        iconColor="text-orange-500"
                        status={sArati.status}
                        statusTitle={sArati.title}
                        reflection={sArati.reflection}
                        value={arati?.total_arati_attendance_days ? `${arati.total_arati_attendance_days} days` : "0 days"}
                        label="Total attendance"
                    />

                    {/* Exercise */}
                    <DomainCard
                        title="Exercise"
                        icon={Dumbbell}
                        iconBgColor="bg-cyan-50"
                        iconColor="text-cyan-500"
                        status={sExercise.status}
                        statusTitle={sExercise.title}
                        reflection={sExercise.reflection}
                        value={exercise?.percent_days_exercised ? `${Math.round(exercise.percent_days_exercised)}%` : "0%"}
                        label="Consistency"
                    />

                </div>
            </div>

        </div>
    );
};

export default OverviewTab;
