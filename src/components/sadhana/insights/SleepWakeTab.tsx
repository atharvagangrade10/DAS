"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMonthlySleepInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, BedDouble, Circle } from "lucide-react";
import { formatTime12h } from "@/utils/format";
import { SleepInsightResponse } from "@/types/sadhana";

interface SleepWakeTabProps {
    year: number;
    month: number;
    participantId?: string;
}

// Sleek Metric Card
const SleekMetricCard = ({
    label,
    value,
    subtext,
    highlightColor // optional color implementation for future
}: {
    label: string;
    value: string | number | null;
    subtext: string;
    highlightColor?: string;
}) => {
    return (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100 flex flex-col h-full justify-between">
            <div>
                <div className="text-xs sm:text-sm font-bold text-gray-400 mb-3 sm:mb-4 uppercase tracking-widest">
                    {label}
                </div>
                <div className={`text-4xl sm:text-5xl font-normal text-[#0D1B2A] mb-3 sm:mb-4 tracking-tight`}>
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

const getMinutesFromMidnight = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr);
        return date.getHours() * 60 + date.getMinutes();
    } catch {
        return null; // Invalid date
    }
};

const calculateSleepStatus = (data: SleepInsightResponse | undefined): HealthResult => {
    if (!data) return {
        status: "YELLOW",
        title: "Insuficient Data",
        colorClass: "text-gray-500",
        iconColor: "fill-gray-500",
        bgGradient: "from-gray-50 to-stone-50",
        reflection: "Keep logging your sleep to reveal your natural rhythm."
    };

    const sleepTimeMins = getMinutesFromMidnight(data.median_sleep_time); // Minutes from midnight (e.g., 22:30 = 1350)
    // Handle late night: 00:00 to 04:00 is technically "next day" but for sleep time logic it's "very late". 
    // We need a continuous scale. Let's map PM times to minutes, and AM times to (minutes + 24*60).
    // Actually, median_sleep_time usually keeps the date component, but we just want the time of day relative to an "evening".
    // Let's normalize: 
    // If hour >= 12 (noon), val = hour * 60 + min
    // If hour < 12 (morning), val = (hour + 24) * 60 + min

    let effectiveSleepTime = 0;
    if (sleepTimeMins !== null) {
        if (data.median_sleep_time) {
            const d = new Date(data.median_sleep_time);
            const h = d.getHours();
            const m = d.getMinutes();
            if (h < 12) effectiveSleepTime = (h + 24) * 60 + m;
            else effectiveSleepTime = h * 60 + m;
        }
    }

    const iqrSleep = data.iqr_sleep_minutes || 999;
    const iqrWake = data.iqr_wakeup_minutes || 999;
    const duration = data.median_sleep_duration_minutes || 0;
    const earlyWakePct = data.percent_wakeup_before_5am || 0;

    // Thresholds (in minutes from start of day, or effective scale)
    // 9:15 PM = 21:15 = 1275 min
    // 10:30 PM = 22:30 = 1350 min
    // 11:30 PM = 23:30 = 1410 min
    // 11:00 PM = 23:00 = 1380 min

    // --- RED CONDITIONS ---
    const isRed =
        (effectiveSleepTime >= 1410) || // Late Sleep >= 11:30 PM
        (iqrSleep > 120) ||           // No Stable Anchor
        (iqrWake > 120) ||            // Chronic Morning Instability
        (duration < 360) ||           // Insufficient Rest < 6.0h (360m)
        (earlyWakePct >= 70 && effectiveSleepTime >= 1380); // Forced Discipline (Wake 70%+ & Sleep >= 11PM)

    if (isRed) {
        // Determine specific reflection based on the *primary* red cause (order matters)
        let ref = "Rhythm conflict detected.";
        if (effectiveSleepTime >= 1410) ref = "Late sleep times are creating a fundamental conflict with your rhythm.";
        else if (duration < 360) ref = "Insufficient rest is undermining your stability.";
        else if (earlyWakePct >= 70 && effectiveSleepTime >= 1380) ref = "Your wake-up discipline is strong, but late sleep is creating compression strain.";
        else if (iqrSleep > 120 || iqrWake > 120) ref = "High variability in timing is preventing deep restoration.";

        return {
            status: "RED",
            title: "Rhythm Conflict",
            colorClass: "text-rose-500",
            iconColor: "fill-rose-500",
            bgGradient: "from-rose-50 to-red-50",
            reflection: ref
        };
    }

    // --- GREEN CONDITIONS ---
    // All must be true
    const isGreenCandidate =
        (effectiveSleepTime >= 1275 && effectiveSleepTime <= 1350) && // 9:15 - 10:30 PM
        (iqrSleep <= 60) &&
        (iqrWake <= 60) &&
        (duration >= 390); // 6.5h = 390m
    // Discipline Support (earlyWakePct >= 60) is NOT mandatory for green, but supports it. 
    // User text: "Assign GREEN only if ALL mandatory conditions are met". Included 1-4. 5 is optional.

    if (isGreenCandidate) {
        // --- OVERRIDE CHECK ---
        // Even if green, downgrade to YELLOW if: median_sleep_time > 10:30 PM AND early wake % is high
        // Wait, Green condition #1 requires Sleep <= 10:30 PM. So it's impossible to be Green AND have Sleep > 10:30 PM.
        // The Override rule says: "Even if metrics suggest GREEN... Downgrade... if median_sleep_time is after 10:30 PM".
        // But Green criteria #1 excludes sleep after 10:30. 
        // Perhaps the user implies "If metrics *other than sleep time* suggest green"? 
        // Or specific edge cases. 
        // Based on the strictly defined "Green Condition 1", the override is redundant if implemented strictly. 
        // However, I will implement the logic strictly as written for Green. 

        return {
            status: "GREEN",
            title: "Aligned Rhythm",
            colorClass: "text-emerald-500",
            iconColor: "fill-emerald-500",
            bgGradient: "from-emerald-50 to-green-50",
            reflection: "Sleep timing is well-aligned, allowing mornings to flow naturally. An excellent foundation."
        };
    }

    // --- YELLOW CONDITIONS ---
    // If not Red and not Green, it's Yellow. 
    // Specific Yellow logic for reflection mapping.
    let yellowReason = "Present but Misaligned.";
    if (effectiveSleepTime > 1350 && effectiveSleepTime < 1410) yellowReason = "Sleep is slightly late, preventing full alignment.";
    else if (earlyWakePct >= 60 && effectiveSleepTime > 1350) yellowReason = "Discipline is strong, but without the sleep anchor, it creates drag."; // Discipline Without Anchor (Willpower without rhythm)
    else if (duration >= 360 && duration < 390) yellowReason = "Rest duration is borderline; slightly more sleep would stabilize the rhythm.";
    else if (iqrSleep > 60 || iqrWake > 60) yellowReason = "Inconsistency in timing is diluting the power of your practice.";

    return {
        status: "YELLOW",
        title: "Present but Misaligned",
        colorClass: "text-amber-500",
        iconColor: "fill-amber-500",
        bgGradient: "from-amber-50 to-yellow-50",
        reflection: yellowReason
    };
};


const SleepWakeTab: React.FC<SleepWakeTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    const targetUserId = participantId || user?.user_id!;

    const { data: sleep, isLoading } = useQuery({
        queryKey: ["insight", "sleep", targetUserId, year, month],
        queryFn: () => fetchMonthlySleepInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
        );
    }

    // Format Duration Helper
    const formatDuration = (mins: number | null) => {
        if (!mins) return "—";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    const health = calculateSleepStatus(sleep);

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-100">
                <div className="p-3 bg-stone-50 rounded-xl">
                    <BedDouble className="h-6 w-6 text-[#0D1B2A]" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[#0D1B2A] text-xl sm:text-2xl font-medium">Sleep & Wake</h3>
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
                    label="Median Sleep Time"
                    value={formatTime12h(sleep?.median_sleep_time)}
                    subtext="Your most typical time of sleeping — this anchors your rhythm"
                />
                <SleekMetricCard
                    label="Sleep-Time Consistency (IQR)"
                    value={sleep?.iqr_sleep_minutes ? `${sleep.iqr_sleep_minutes} min` : null}
                    subtext="Most nights you slept within this window"
                />

                <SleekMetricCard
                    label="Median Wake-Up Time"
                    value={formatTime12h(sleep?.median_wakeup_time)}
                    subtext="Naturally follows your sleep time"
                />
                <SleekMetricCard
                    label="Wake-Up Consistency (IQR)"
                    value={sleep?.iqr_wakeup_minutes ? `${sleep.iqr_wakeup_minutes} min` : null}
                    subtext="How steady your mornings were"
                />

                <SleekMetricCard
                    label="% Days ≤ 5 AM"
                    value={sleep?.percent_wakeup_before_5am ? `${sleep.percent_wakeup_before_5am}%` : "0%"}
                    subtext="Early discipline strength"
                />
                <SleekMetricCard
                    label="Median Sleep Duration"
                    value={formatDuration(sleep?.median_sleep_duration_minutes)}
                    subtext="Your usual rest length"
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

export default SleepWakeTab;
