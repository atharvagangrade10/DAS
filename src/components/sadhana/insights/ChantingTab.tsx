"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMonthlyChantingInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, Sparkles, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { ChantingInsightResponse } from "@/types/sadhana";

interface ChantingTabProps {
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

// Collapsible Quality Section
const QualitySection = ({ medianRating, iqrRating }: { medianRating: number | null, iqrRating: number | null }) => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
                <h4 className="text-[#0D1B2A] text-sm font-bold uppercase tracking-wider">Quality Metrics</h4>
                {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>

            {isOpen && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100">
                    <div>
                        <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">RATING MEDIAN</div>
                        <div className="text-4xl font-normal text-[#0D1B2A] mb-2">{medianRating ?? "—"}</div>
                        <p className="text-sm text-gray-500">Average quality rating</p>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">RATING CONSISTENCY (IQR)</div>
                        <div className="text-4xl font-normal text-[#0D1B2A] mb-2">{iqrRating ?? "—"}</div>
                        <p className="text-sm text-gray-500">Quality stability range</p>
                    </div>
                </div>
            )}
        </div>
    )
}

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

const calculateChantingStatus = (data: ChantingInsightResponse | undefined): HealthResult => {
    if (!data) return {
        status: "YELLOW",
        title: "Waiting for Data",
        colorClass: "text-gray-500",
        iconColor: "fill-gray-500",
        bgGradient: "from-gray-50 to-stone-50",
        reflection: "Keep logging to reveal your chanting patterns."
    };

    const T = data.daily_target_rounds || 16; // Use API Target, default to 16 if 0/null
    const median = data.median_daily_rounds || 0;
    const iqr = data.iqr_daily_rounds || 999;
    const zeroDays = data.zero_round_days || 0;

    // Percentages are typically 0-100 in API response.
    const pctBefore730 = data.percent_rounds_before_7_30_am || 0;
    const pctAfter12 = data.percent_rounds_after_12_00_am || 0;

    // Ratios
    const medianRatio = median / (T || 1);
    const iqrRatio = iqr / (T || 1);

    // --- RED CONDITIONS ---
    const isRed =
        (zeroDays >= 5) ||           // Absence Pattern
        (medianRatio < 0.50) ||      // Low Target Integration (< 50% of T)
        (iqrRatio > 0.50) ||         // High Instability
        (pctAfter12 >= 20);          // Severe Late Night pattern

    if (isRed) {
        let ref = "Target not yet integrated.";
        if (zeroDays >= 5) ref = "Frequent absence is preventing the formation of a steady habit.";
        else if (medianRatio < 0.50) ref = "Current volume is significantly below your chosen commitment.";
        else if (iqrRatio > 0.50) ref = "High fluctuation in daily rounds suggests the habit is not yet anchored.";
        else if (pctAfter12 >= 20) ref = "Significant chanting after midnight risks health and morning focus.";

        return {
            status: "RED",
            title: "Target Not Yet Integrated",
            colorClass: "text-rose-500",
            iconColor: "fill-rose-500",
            bgGradient: "from-rose-50 to-red-50",
            reflection: ref
        };
    }

    // --- GREEN CONDITIONS ---
    // Mandatory 1-4
    const isGreenCandidate =
        (zeroDays <= 1) &&
        (medianRatio >= 0.75) &&
        (iqrRatio <= 0.25) &&
        (pctBefore730 >= 50) &&
        (pctAfter12 === 0);

    if (isGreenCandidate) {
        return {
            status: "GREEN",
            title: "Aligned with Commitment",
            colorClass: "text-emerald-500",
            iconColor: "fill-emerald-500",
            bgGradient: "from-emerald-50 to-green-50",
            reflection: "Your practice honors your chosen target. Consistency, timing, and volume are all aligned."
        };
    }

    // --- YELLOW CONDITIONS ---
    // Fallback
    let yellowReason = "Committed but Uneven.";
    // Check specific Yellow triggers for better feedback
    if (medianRatio >= 0.50 && medianRatio < 0.75) yellowReason = "You are holding the habit, but volume is typically below your full target.";
    else if (iqrRatio > 0.25 && iqrRatio <= 0.50) yellowReason = "Daily fluctuation is moderate; tighter consistency will deepen the experience.";
    else if (pctBefore730 < 50 && pctBefore730 >= 25) yellowReason = "Morning chanting is present but not dominant; shifting earlier will increase potency.";
    else if (pctAfter12 > 0) yellowReason = "Some rounds are pushing past midnight; try to wrap up earlier for better rest.";

    return {
        status: "YELLOW",
        title: "Committed but Uneven",
        colorClass: "text-amber-500",
        iconColor: "fill-amber-500",
        bgGradient: "from-amber-50 to-yellow-50",
        reflection: yellowReason
    };
};

const ChantingTab: React.FC<ChantingTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    const targetUserId = participantId || user?.user_id!;

    const { data: chanting, isLoading } = useQuery({
        queryKey: ["insight", "chanting", targetUserId, year, month],
        queryFn: () => fetchMonthlyChantingInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
        );
    }

    const health = calculateChantingStatus(chanting);

    // Helpers for display
    const formatPct = (val?: number) => val ? `${Math.round(val)}%` : "0%";

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-100">
                <div className="p-3 bg-purple-50 rounded-xl">
                    <Sparkles className="h-6 w-6 text-purple-700" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[#0D1B2A] text-xl sm:text-2xl font-medium">Chanting</h3>
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
                    label="Daily Target"
                    value={chanting?.daily_target_rounds}
                    subtext="Your committed daily vow"
                />
                <SleekMetricCard
                    label="Median Daily Rounds"
                    value={chanting?.median_daily_rounds}
                    subtext="Your typical daily chanting volume"
                />
                <SleekMetricCard
                    label="Consistency (IQR)"
                    value={chanting?.iqr_daily_rounds ? `${chanting.iqr_daily_rounds} rounds` : null}
                    subtext="Most days fall within this range"
                />

                <SleekMetricCard
                    label="% Days Meeting Target"
                    value={chanting?.percent_days_meeting_target ? formatPct(chanting.percent_days_meeting_target) : "0%"}
                    subtext="Days you reached your goal"
                />
                <SleekMetricCard
                    label="Zero-Round Days"
                    value={chanting?.zero_round_days}
                    subtext="Days without any chanting"
                />
                <SleekMetricCard
                    label="Days Logged"
                    value={chanting?.days_count}
                    subtext="Total entries this month"
                />
            </div>

            {/* Time Distribution Breakdown */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
                <div className="text-xs sm:text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest">
                    Time Distribution
                </div>
                <div className="space-y-4">
                    {[
                        { label: "Early Morning (< 7:30 AM)", val: chanting?.percent_rounds_before_7_30_am, color: "bg-emerald-400" },
                        { label: "Morning (7:30 - 12:00)", val: chanting?.percent_rounds_7_30_to_12_00, color: "bg-sky-400" },
                        { label: "Afternoon (12:00 - 6:00)", val: chanting?.percent_rounds_12_00_to_6_00, color: "bg-yellow-400" },
                        { label: "Evening (6:00 - 12:00)", val: chanting?.percent_rounds_6_00_to_12_00, color: "bg-orange-400" },
                        { label: "Late Night (> 12:00 AM)", val: chanting?.percent_rounds_after_12_00_am, color: "bg-rose-500" },
                    ].map((slot) => (
                        <div key={slot.label} className="space-y-1">
                            <div className="flex justify-between text-sm font-medium">
                                <span className={slot.label.includes("Late Night") ? "text-rose-600 font-bold" : "text-gray-700"}>{slot.label}</span>
                                <span className="text-gray-900 font-bold">{formatPct(slot.val)}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full ${slot.color} transition-all duration-500`} style={{ width: formatPct(slot.val) }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quality Metrics */}
            <QualitySection
                medianRating={chanting?.median_rating ?? null}
                iqrRating={chanting?.iqr_rating ?? null}
            />

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

export default ChantingTab;
