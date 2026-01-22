"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyChantingInsight } from "@/utils/sadhanaInsightsApi";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Zap, AlertCircle, Sparkles } from "lucide-react";
import InsightDataDisplay from "./InsightDataDisplay";

interface ChantingInsightProps {
    year: number;
    month: number;
}

const ChantingInsight: React.FC<ChantingInsightProps> = ({ year, month }) => {
    const { user } = useAuth();

    const { data, isLoading, error } = useQuery({
        queryKey: ["chantingInsights", user?.user_id, year, month],
        queryFn: () => fetchMonthlyChantingInsight(user!.user_id, year, month),
        enabled: !!user?.user_id,
    });

    if (isLoading) return <div className="py-20 flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary/20" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Deepening meditation...</p></div>;
    if (error) return <div className="p-8 bg-destructive/5 text-destructive rounded-[2.5rem] border border-destructive/10 flex flex-col items-center gap-3 text-center"><AlertCircle className="h-8 w-8 opacity-50" /><p className="text-sm font-bold uppercase tracking-tight">The record is obscured.</p></div>;

    const adherence = data?.percent_days_meeting_target || 0;
    const medianRounds = data?.median_daily_rounds || 0;
    const targetRounds = data?.daily_target_rounds || 16;
    const earlyPercent = data?.percent_rounds_before_7_30_am || 0;
    const medianRating = data?.median_rating || 0;

    const chantingData: any[] = [
        { label: "Median Rounds", value: medianRounds, unit: `/${targetRounds}`, highlight: true },
        { label: "Target Success", value: Math.round(adherence), unit: "%", color: "emerald", subtext: adherence > 80 ? "Sacred Flow" : "Growing" },
        { label: "Median Quality", value: medianRating, unit: "/10", color: "amber", subtext: "Focus & Attention" },
        { label: "Early Morning", value: Math.round(earlyPercent), unit: "%", color: "indigo", subtext: "Before 7:30 AM" },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-10">
            <div className="flex items-center gap-2 mb-2">
                <Zap className="h-3 w-3 text-primary/40" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Soul & Spirit</h3>
            </div>

            <InsightDataDisplay title="Meditation Metrics" data={chantingData} />

            <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 shadow-sm">
                <Sparkles className="h-5 w-5 text-primary/40 mb-4" />
                <p className="text-sm font-medium text-foreground/80 leading-relaxed italic">
                    “{adherence >= 90 ? "Your chanting is your anchor. The depth of your attention is a gift to the soul." : "Every round is a step closer to the heart. Consistency is the key."}”
                </p>
            </div>
        </div>
    );
};

export default ChantingInsight;