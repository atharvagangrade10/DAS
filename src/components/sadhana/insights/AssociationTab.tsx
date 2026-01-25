"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMonthlyAssociationInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, Heart, Circle } from "lucide-react";
import { AssociationType, AssociationInsightResponse } from "@/types/sadhana";

interface AssociationTabProps {
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

// --- RYG LOGIC HELPERS ---

type HealthStatus = "GREEN" | "YELLOW" | "RED";

interface HealthResult {
    status: HealthStatus;
    title: string;
    colorClass: string;
    iconColor: string;
    bgGradient: string;
    reflection: string;
}

const calculateAssociationStatus = (data: AssociationInsightResponse | undefined): HealthResult => {
    if (!data) return {
        status: "YELLOW",
        title: "Waiting for Data",
        colorClass: "text-gray-500",
        iconColor: "fill-gray-500",
        bgGradient: "from-gray-50 to-stone-50",
        reflection: "Keep tracking your association to reveal patterns."
    };

    const assocDays = data.association_days || 0;
    const totalDays = data.days_count || 30; // Denominator
    const dayRatio = assocDays / totalDays;

    const median = data.median_daily_association_minutes || 0;
    const iqr = data.iqr_daily_association_minutes || 999;

    // Calculate Primary Type Share
    let maxShare = 0;
    if (data.median_minutes_by_type && data.association_days_by_type) {
        let totalEstMins = 0;
        let maxMins = 0;

        Object.entries(data.median_minutes_by_type).forEach(([type, med]) => {
            const days = data.association_days_by_type[type as AssociationType] || 0;
            const typeTotal = med * days;
            totalEstMins += typeTotal;
            if (typeTotal > maxMins) maxMins = typeTotal;
        });

        if (totalEstMins > 0) {
            maxShare = maxMins / totalEstMins;
        }
    }

    // --- RED CONDITIONS ---
    const isRed =
        (dayRatio < 0.20) ||           // Rare Presence
        (median < 30) ||               // Too Brief to Nourish
        (iqr > 2 * median && median > 0); // Burst Pattern

    if (isRed) {
        let ref = "Not yet nourishing.";
        if (dayRatio < 0.20) ref = "Association appears occasionally; steadier contact may help.";
        else if (median < 30) ref = "Brief interactions are good, but deeper exchange is needed for nourishment.";
        else if (iqr > 2 * median) ref = "Sporadic high-volume days are not a substitute for steady connection.";

        return {
            status: "RED",
            title: "Not Yet Nourishing",
            colorClass: "text-rose-500",
            iconColor: "fill-rose-500",
            bgGradient: "from-rose-50 to-red-50",
            reflection: ref
        };
    }

    // --- GREEN CONDITIONS ---
    // Mandatory 1-3. (4 is supporting)
    const isGreenCandidate =
        (dayRatio >= 0.40) &&
        (iqr <= median) &&
        (median >= 45);

    if (isGreenCandidate) {
        return {
            status: "GREEN",
            title: "Nourishing & Directional",
            colorClass: "text-emerald-500",
            iconColor: "fill-emerald-500",
            bgGradient: "from-emerald-50 to-green-50",
            reflection: "Association is deep, regular, and directionally clear. It serves as a stable anchor."
        };
    }

    // --- YELLOW CONDITIONS ---
    // Fallback
    let yellowReason = "Present but light or uneven.";
    if (dayRatio >= 0.20 && dayRatio < 0.40) yellowReason = "You connect meaningfully, but frequency is still settling.";
    else if (median >= 30 && median < 45) yellowReason = "Association is meaningful, but deeper exchanges would increase nourishment.";
    else if (iqr > median) yellowReason = "Time spent varies widely; consistent duration builds stronger relationships.";
    else if (maxShare < 0.50) yellowReason = "Contact exists, but influence is scattered across many sources.";

    return {
        status: "YELLOW",
        title: "Present but Light",
        colorClass: "text-amber-500",
        iconColor: "fill-amber-500",
        bgGradient: "from-amber-50 to-yellow-50",
        reflection: yellowReason
    };
};

const AssociationTab: React.FC<AssociationTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    const targetUserId = participantId || user?.user_id!;

    const { data: association, isLoading } = useQuery({
        queryKey: ["insight", "association", targetUserId, year, month],
        queryFn: () => fetchMonthlyAssociationInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
        );
    }

    const health = calculateAssociationStatus(association);

    // --- Helper Logic for Breakdown ---
    const getLabel = (type: string) => {
        switch (type) {
            case "PRABHUPADA": return "Srila Prabhupada";
            case "GURU": return "Spiritual Master";
            case "OTHER_ISKCON_DEVOTEE": return "Other ISKCON Devotees";
            default: return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
        }
    };

    // Calculate Primary Type & Percentages for Display
    let primaryType = "—";
    let typeStats: { type: string; label: string; percentage: number; minutes: number }[] = [];

    if (association?.median_minutes_by_type && association?.association_days_by_type) {
        let maxDuration = 0;
        let totalEstimatedMinutes = 0;

        // 1. Calculate totals
        Object.entries(association.median_minutes_by_type).forEach(([type, medianMins]) => {
            const days = association.association_days_by_type[type as AssociationType] || 0;
            const totalMins = medianMins * days;
            totalEstimatedMinutes += totalMins;

            if (totalMins > maxDuration) {
                maxDuration = totalMins;
                primaryType = getLabel(type);
            }
        });

        // 2. Calculate percentages
        if (totalEstimatedMinutes > 0) {
            typeStats = Object.entries(association.median_minutes_by_type).map(([type, medianMins]) => {
                const days = association.association_days_by_type[type as AssociationType] || 0;
                const totalMins = medianMins * days;
                const pct = Math.round((totalMins / totalEstimatedMinutes) * 100);
                return {
                    type,
                    label: getLabel(type),
                    percentage: pct,
                    minutes: totalMins
                };
            }).sort((a, b) => b.percentage - a.percentage); // Sort by highest %
        }
    }


    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-100">
                <div className="p-3 bg-rose-50 rounded-xl">
                    <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[#0D1B2A] text-xl sm:text-2xl font-medium">Association</h3>
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
                    label="Median Daily Time"
                    value={association?.median_daily_association_minutes ? `${Math.round(association.median_daily_association_minutes)} min` : "0 min"}
                    subtext="Typical time spent in association each day"
                />
                <SleekMetricCard
                    label="Consistency (IQR)"
                    value={association?.iqr_daily_association_minutes ? `${Math.round(association.iqr_daily_association_minutes)} min` : null}
                    subtext="Most days your time fell within this range"
                />
                <SleekMetricCard
                    label="Days with Association"
                    value={association?.association_days ? `${association.association_days}` : "0"}
                    subtext="Days you engaged in spiritual association"
                />
                <SleekMetricCard
                    label="Primary Type"
                    value={primaryType}
                    subtext="Your main form of association this month"
                />
                <SleekMetricCard
                    label="Days Logged"
                    value={association?.days_count}
                    subtext="Total entries this month"
                />
            </div>

            {/* Breakdown by Type Section */}
            {typeStats.length > 0 && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
                    <div className="text-xs sm:text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest">
                        Association Breakdown
                    </div>
                    <div className="space-y-6">
                        {typeStats.map((stat) => (
                            <div key={stat.type} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-[#0D1B2A]">{stat.label}</span>
                                    <span className="text-xs font-bold text-gray-400">{stat.percentage}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-rose-400 rounded-full transition-all duration-500"
                                        style={{ width: `${stat.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Unique Devotees Section - Based on Books Library Design */}
            {association?.unique_devotee_names && association.unique_devotee_names.length > 0 && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-100">
                    <div className="text-xs sm:text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">
                        Devotees Associated With (This Month)
                    </div>
                    <div className="flex flex-col gap-3">
                        {association.unique_devotee_names.map((name, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-100/50 hover:bg-[#0D1B2A] hover:text-white hover:border-[#0D1B2A] transition-all duration-300 group cursor-default">
                                <span className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full bg-stone-200 text-stone-500 text-[10px] font-bold group-hover:bg-white/20 group-hover:text-white transition-colors">
                                    {i + 1}
                                </span>
                                <span className="text-sm font-medium tracking-wide">
                                    {name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}


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

export default AssociationTab;
