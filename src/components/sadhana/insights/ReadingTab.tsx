"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMonthlyBookInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, BookOpen, Circle } from "lucide-react";
import { BookInsightResponse } from "@/types/sadhana";

interface ReadingTabProps {
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

const calculateReadingStatus = (data: BookInsightResponse | undefined): HealthResult => {
    if (!data) return {
        status: "YELLOW",
        title: "Waiting for Data",
        colorClass: "text-gray-500",
        iconColor: "fill-gray-500",
        bgGradient: "from-gray-50 to-stone-50",
        reflection: "Keep logging your reading to verify habit formation."
    };

    const readingDays = data.reading_days || 0;
    const totalDays = data.days_count || 30; // Denominator
    const dayRatio = readingDays / totalDays;

    const median = data.median_daily_reading_minutes || 0;
    const iqr = data.iqr_daily_reading_minutes || 999;

    // Primary Book Share (Assuming return_ratio maps to this Concept, usually 0.0 to 1.0)
    // If not, we ignore optional supporting metric for mandatory gates, but use for display
    const primaryShare = data.primary_book_return_ratio || 0;

    // --- RED CONDITIONS ---
    const isRed =
        (dayRatio < 0.30) ||             // Rare Presence
        (median < 15) ||                 // Too Light to Stabilize
        (iqr > 2 * median && median > 0); // Burst Pattern (IQR > 2x Median)

    if (isRed) {
        let ref = "Habit not yet integrated.";
        if (dayRatio < 0.30) ref = "Reading appears occasionally; a gentler, more regular rhythm may help.";
        else if (median < 15) ref = "Current duration is too brief for deep absorption.";
        else if (iqr > 2 * median) ref = "Occasional long sessions without continuity are preventing habit stability.";

        return {
            status: "RED",
            title: "Not Yet a Habit",
            colorClass: "text-rose-500",
            iconColor: "fill-rose-500",
            bgGradient: "from-rose-50 to-red-50",
            reflection: ref
        };
    }

    // --- GREEN CONDITIONS ---
    // Mandatory 1-3. (4 is supporting)
    const isGreenCandidate =
        (dayRatio >= 0.60) &&
        (iqr <= median) &&  // Consistency
        (median >= 30);     // Meaningful Depth

    if (isGreenCandidate) {
        return {
            status: "GREEN",
            title: "Habit Integrated",
            colorClass: "text-emerald-500",
            iconColor: "fill-emerald-500",
            bgGradient: "from-emerald-50 to-green-50",
            reflection: "Reading has become a steady, immersive part of your days. Frequency and depth are aligned."
        };
    }

    // --- YELLOW CONDITIONS ---
    // Fallback
    let yellowReason = "Alive but still forming.";
    if (dayRatio >= 0.30 && dayRatio < 0.60) yellowReason = "You’re returning to reading, but rhythm is still settling.";
    else if (median >= 15 && median < 30) yellowReason = "Reading is real, but depth is not yet fully settled.";
    else if (iqr > median) yellowReason = "Fluctuation in duration is high; aiming for a steady minimum daily will stabilize the habit.";
    else if (primaryShare < 0.50) yellowReason = "Attention is fragmented across multiple books; staying with one text deepens the connection.";

    return {
        status: "YELLOW",
        title: "Present but Light",
        colorClass: "text-amber-500",
        iconColor: "fill-amber-500",
        bgGradient: "from-amber-50 to-yellow-50",
        reflection: yellowReason
    };
};

const ReadingTab: React.FC<ReadingTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    const targetUserId = participantId || user?.user_id!;

    const { data: book, isLoading } = useQuery({
        queryKey: ["insight", "book", targetUserId, year, month],
        queryFn: () => fetchMonthlyBookInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
        );
    }

    const health = calculateReadingStatus(book);

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-100">
                <div className="p-3 bg-sky-50 rounded-xl">
                    <BookOpen className="h-6 w-6 text-sky-700" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[#0D1B2A] text-xl sm:text-2xl font-medium">Book Reading</h3>
                </div>

                {/* Status Pill */}
                <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r rounded-full border border-white/50 self-start sm:self-auto ${health.bgGradient}`}>
                    <Circle className={`h-3 w-3 ${health.iconColor}`} />
                    <span className={`text-sm font-bold ${health.colorClass}`}>{health.title}</span>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                <SleekMetricCard
                    label="Median Daily Reading"
                    value={book?.median_daily_reading_minutes ? `${Math.round(book.median_daily_reading_minutes)} min` : "0 min"}
                    subtext="Your typical reading time each day"
                />
                <SleekMetricCard
                    label="Consistency (IQR)"
                    value={book?.iqr_daily_reading_minutes ? `${Math.round(book.iqr_daily_reading_minutes)} min` : null}
                    subtext="Most days your reading time fell within this range"
                />
                <SleekMetricCard
                    label="Reading Days"
                    value={book?.reading_days ? `${book.reading_days} days` : "0 days"}
                    subtext="Days with any reading activity"
                />
                <SleekMetricCard
                    label="Days Logged"
                    value={book?.days_count}
                    subtext="Total entries this month"
                />
            </div>

            {/* Primary Book Section (Dark Card) */}
            <div className="bg-[#0D1B2A] rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-200">
                <div className="flex justify-between items-start">
                    <div className="text-xs sm:text-sm font-bold text-sky-200 mb-3 sm:mb-4 uppercase tracking-widest opacity-80">
                        Primary Book This Month
                    </div>
                    {/* Optional: Show share % if relevant */}
                    {book?.primary_book_return_ratio && (
                        <div className="px-2 py-1 bg-sky-900/50 rounded-lg text-xs font-mono text-sky-200">
                            {Math.round(book.primary_book_return_ratio * 100)}% FOCUS
                        </div>
                    )}
                </div>

                <div className="text-3xl sm:text-4xl font-normal text-white tracking-tight mb-2">
                    {book?.primary_book_name || "—"}
                </div>
            </div>

            {/* All Books Read Section */}
            {book?.books_read && book.books_read.length > 0 && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-100">
                    <div className="text-xs sm:text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">
                        Books Library (This Month)
                    </div>
                    <div className="flex flex-col gap-3">
                        {book.books_read.map((b, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl border border-stone-100/50 hover:bg-[#0D1B2A] hover:text-white hover:border-[#0D1B2A] transition-all duration-300 group cursor-default">
                                <span className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full bg-stone-200 text-stone-500 text-[10px] font-bold group-hover:bg-white/20 group-hover:text-white transition-colors">
                                    {i + 1}
                                </span>
                                <span className="text-sm font-medium tracking-wide">
                                    {b}
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

export default ReadingTab;
