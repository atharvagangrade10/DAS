"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyAratiInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, AlertCircle, Flame, Sparkles } from "lucide-react";
import InsightDataDisplay from "./InsightDataDisplay";

interface AratiInsightProps {
    year: number;
    month: number;
    participantId: string;
}

const ARATI_TYPES = [
    { key: "mangla_attended_days", label: "Mangala" },
    { key: "narasimha_attended_days", label: "Narasimha" },
    { key: "tulsi_arati_attended_days", label: "Tulsi" },
    { key: "darshan_arati_attended_days", label: "Darshan" },
    { key: "guru_puja_attended_days", label: "Guru Puja" },
    { key: "sandhya_arati_attended_days", label: "Sandhya" },
];

const AratiInsight: React.FC<AratiInsightProps> = ({ year, month, participantId }) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ["aratiInsights", participantId, year, month],
        queryFn: () => fetchMonthlyAratiInsight(participantId, year, month),
        enabled: !!participantId,
    });

    if (isLoading) return <div className="py-20 flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary/20" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Illuminating the sanctum...</p></div>;
    if (error) return <div className="p-8 bg-destructive/5 text-destructive rounded-[2.5rem] border border-destructive/10 flex flex-col items-center gap-3 text-center"><AlertCircle className="h-8 w-8 opacity-50" /><p className="text-sm font-bold uppercase tracking-tight">The altar is veiled.</p></div>;

    const daysTracked = data?.days_count || 0;
    const totalDays = data?.total_arati_attendance_days || 0;
    const momentum = Math.round((totalDays / (daysTracked || 1)) * 100);
    const mornings = data?.morning_arati_days || 0;

    const aratiData = [
        { label: "Total Altar Presence", value: totalDays, unit: "Days", highlight: true },
        { label: "Monthly Momentum", value: Math.round(momentum), unit: "%", subtext: "Days with any Arati logged" },
        { label: "Morning Arati Days", value: mornings, unit: "Days", subtext: "Mangala, Narasimha, Tulsi, Darshan" },
    ];

    if (data) {
        ARATI_TYPES.forEach((arati) => {
            const days = (data as any)?.[arati.key] || 0;
            if (days > 0) {
                aratiData.push({
                    label: arati.label,
                    value: days,
                    unit: "Days",
                    subtext: `Attended ${Math.round((days / (daysTracked || 1)) * 100)}% of days`,
                });
            }
        });
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-10">
            <div className="flex items-center gap-2 mb-2">
                <Flame className="h-3 w-3 text-primary/40" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Devotional Service</h3>
            </div>
            <InsightDataDisplay title="Key Metrics & Breakdown" data={aratiData} />
            <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 shadow-sm">
                <Sparkles className="h-5 w-5 text-primary/40 mb-4" />
                <p className="text-sm font-medium text-foreground/80 leading-relaxed italic mb-2">
                    “The Altar is a source of infinite strength. Consistency in your presence is a sacred testimony.”
                </p>
            </div>
        </div>
    );
};

export default AratiInsight;