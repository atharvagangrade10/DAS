"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyBookInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, BookOpen, AlertCircle, Sparkles } from "lucide-react";
import InsightDataDisplay from "./InsightDataDisplay";

interface BookInsightProps {
    year: number;
    month: number;
    participantId: string;
}

const BookInsight: React.FC<BookInsightProps> = ({ year, month, participantId }) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ["bookInsights", participantId, year, month],
        queryFn: () => fetchMonthlyBookInsight(participantId, year, month),
        enabled: !!participantId,
    });

    if (isLoading) return <div className="py-20 flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary/20" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Consulting the library of time...</p></div>;
    if (error) return <div className="p-8 bg-destructive/5 text-destructive rounded-[2.5rem] border border-destructive/10 flex flex-col items-center gap-3 text-center"><AlertCircle className="h-8 w-8 opacity-50" /><p className="text-sm font-bold uppercase tracking-tight">The scrolls are missing.</p></div>;

    const daysTracked = data?.days_count || 0;
    const readingDays = data?.reading_days || 0;
    const momentum = Math.round((readingDays / (daysTracked || 1)) * 100);
    const longestStreak = data?.longest_reading_streak || 0;
    const medianMinutes = data?.median_daily_reading_minutes || 0;
    const primaryBook = data?.primary_book_name || "Focus Not Set";
    const returnRatio = (data?.primary_book_return_ratio || 0) * 100;

    const bookData = [
        { label: "Reading Days", value: readingDays, unit: `/${daysTracked} days`, highlight: true },
        { label: "Monthly Momentum", value: Math.round(momentum), unit: "%", subtext: "Days with reading logged" },
        { label: "Median Duration", value: medianMinutes, unit: "min" },
        { label: "Longest Streak", value: longestStreak, unit: "Days" },
        { label: "Primary Book", value: primaryBook, subtext: "Most logged book" },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-10">
            <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-3 w-3 text-primary/40" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Mind & Wisdom</h3>
            </div>
            <InsightDataDisplay title="Key Metrics" data={bookData} />
            <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 shadow-sm">
                <Sparkles className="h-5 w-5 text-primary/40 mb-4" />
                <p className="text-sm font-medium text-foreground/80 leading-relaxed italic mb-2">
                    “The intelligence is fed by deep reading. Stay consistent and find your anchor in the words of wisdom.”
                </p>
            </div>
        </div>
    );
};

export default BookInsight;