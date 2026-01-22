"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlySleepInsight } from "@/utils/sadhanaInsightsApi";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Moon, Sun, AlertCircle, Sparkles } from "lucide-react";
import InsightDataDisplay from "./InsightDataDisplay";

interface SleepInsightProps {
    year: number;
    month: number;
    participantId: string;
}

const SleepInsight: React.FC<SleepInsightProps> = ({ year, month, participantId }) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ["sleepInsights", participantId, year, month],
        queryFn: () => fetchMonthlySleepInsight(participantId, year, month),
        enabled: !!participantId,
    });

    if (isLoading) return <div className="py-20 flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary/20" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Mapping biological rhythms...</p></div>;
    if (error) return <div className="p-8 bg-destructive/5 text-destructive rounded-[2.5rem] border border-destructive/10 flex flex-col items-center gap-3 text-center"><AlertCircle className="h-8 w-8 opacity-50" /><p className="text-sm font-bold uppercase tracking-tight">The map could not be drawn.</p></div>;

    const wakeupTime = data?.median_wakeup_time || "--:--";
    const sleepTime = data?.median_sleep_time || "--:--";
    const adherence = data?.percent_wakeup_before_5am || 0;
    const iqrWakeup = data?.iqr_wakeup_minutes ?? 0;
    const sleepDuration = data?.median_sleep_duration_minutes || 0;
    const sleepHours = Math.floor(sleepDuration / 60);
    const sleepMins = sleepDuration % 60;

    const sleepData: any[] = [
        { label: "Typical Sleep", value: sleepTime, color: "indigo", subtext: "Average rest time" },
        { label: "Typical Wakeup", value: wakeupTime, color: "amber", subtext: "Average rising time" },
        { label: "Median Duration", value: `${sleepHours}h ${sleepMins}m`, highlight: true },
        { label: "Wake Consistency", value: iqrWakeup, unit: "min", color: "blue", subtext: iqrWakeup < 30 ? "Very Stable" : "Floating" },
        { label: "Goal Adherence", value: Math.round(adherence), unit: "%", color: "emerald", subtext: "Before 5 AM" },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-10">
            <div className="flex items-center gap-2 mb-2">
                <Moon className="h-3 w-3 text-primary/40" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Body & Rhythm</h3>
            </div>
            <InsightDataDisplay title="Monthly Patterns" data={sleepData} />
            <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 shadow-sm">
                <Sparkles className="h-5 w-5 text-primary/40 mb-4" />
                <p className="text-sm font-medium text-foreground/80 leading-relaxed italic">
                    “{adherence >= 70 ? "Your rhythm is aligned with the morning. This consistency is the secret to spiritual clarity." : "Finding a steady rhythm is the first step in mastering the mind."}”
                </p>
            </div>
        </div>
    );
};

export default SleepInsight;