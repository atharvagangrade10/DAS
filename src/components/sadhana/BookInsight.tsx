"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyBookInsight } from "@/utils/sadhanaInsightsApi";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, Clock, AlertCircle, Bookmark, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import InsightDataDisplay from "./InsightDataDisplay"; // New import

interface BookInsightProps {
    year: number;
    month: number;
}

const BookInsight: React.FC<BookInsightProps> = ({ year, month }) => {
    const { user } = useAuth();

    const { data, isLoading, error } = useQuery({
        queryKey: ["bookInsights", user?.user_id, year, month],
        queryFn: () => fetchMonthlyBookInsight(user!.user_id, year, month),
        enabled: !!user?.user_id,
    });

    if (isLoading) return <div className="py-20 flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary/20" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Consulting the library of time...</p></div>;
    if (error) return <div className="p-8 bg-destructive/5 text-destructive rounded-[2.5rem] border border-destructive/10 flex flex-col items-center gap-3 text-center"><AlertCircle className="h-8 w-8 opacity-50" /><p className="text-sm font-bold uppercase tracking-tight">The scrolls are missing.</p></div>;

    const daysTracked = data?.days_count || 0;
    const readingDays = data?.reading_days || 0;
    const momentum = Math.round((readingDays / daysTracked) * 100);
    const longestStreak = data?.longest_reading_streak || 0;
    const medianMinutes = data?.median_daily_reading_minutes || 0;
    const primaryBook = data?.primary_book_name || "Focus Not Set";
    const returnRatio = (data?.primary_book_return_ratio || 0) * 100;

    // Reflection Logic
    const isDeepFocus = returnRatio >= 70;
    const isHighMomentum = momentum >= 60;

    const reflection = isDeepFocus && isHighMomentum
        ? `Your absorption in “${primaryBook}” is profound. Deep reading is the highest food for your intelligence.`
        : isDeepFocus
            ? `You dive deep into the wisdom when you read. Increasing your daily sessions will expand this pool of clarity.`
            : isHighMomentum
                ? `Wonderful regularity in reading. Now, try to stay with one chapter or one book longer to reach deeper layers of understanding.`
                : "The mind seeks wisdom. Just ten minutes of daily reading can become a lighthouse in your busy schedule.";

    // Prepare data for InsightDataDisplay
    const bookData = [
        { label: "Reading Days", value: readingDays, unit: `/${daysTracked} days`, highlight: true },
        { label: "Monthly Momentum", value: Math.round(momentum), unit: "%", subtext: "Days with reading logged" },
        { label: "Median Session Duration", value: medianMinutes, unit: "min" },
        { label: "Longest Streak", value: longestStreak, unit: "Days" },
        { label: "Primary Focus Book", value: primaryBook, subtext: "Most frequently logged book" },
        { label: "Primary Book Engagement", value: Math.round(returnRatio), unit: "%", subtext: "Ratio of days reading primary book" },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-10">
            {/* DAS Style Header */}
            <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-3 w-3 text-primary/40" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Mind & Wisdom</h3>
            </div>

            {/* New Data Display */}
            <InsightDataDisplay title="Key Metrics" data={bookData} />

            {/* Insight Reflection Block */}
            <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 shadow-sm">
                <Sparkles className="h-5 w-5 text-primary/40 mb-4" />
                <p className="text-sm font-medium text-foreground/80 leading-relaxed italic mb-2">
                    “{reflection}”
                </p>
            </div>

            {/* Footer Information */}
            <div className="text-center space-y-2 pt-4">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                    {daysTracked} days tracked this month
                </p>
            </div>
        </div>
    );
};

export default BookInsight;