"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyAratiInsight } from "@/utils/sadhanaInsightsApi";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star, AlertCircle, Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import InsightDataDisplay from "./InsightDataDisplay"; // New import

interface AratiInsightProps {
    year: number;
    month: number;
}

const ARATI_TYPES = [
    { key: "mangla_attended_days", label: "Mangala" },
    { key: "narasimha_attended_days", label: "Narasimha" },
    { key: "tulsi_arati_attended_days", label: "Tulsi" },
    { key: "darshan_arati_attended_days", label: "Darshan" },
    { key: "guru_puja_attended_days", label: "Guru Puja" },
    { key: "sandhya_arati_attended_days", label: "Sandhya" },
];

const AratiInsight: React.FC<AratiInsightProps> = ({ year, month }) => {
    const { user } = useAuth();

    const { data, isLoading, error } = useQuery({
        queryKey: ["aratiInsights", user?.user_id, year, month],
        queryFn: () => fetchMonthlyAratiInsight(user!.user_id, year, month),
        enabled: !!user?.user_id,
    });

    if (isLoading) return <div className="py-20 flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary/20" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Illuminating the sanctum...</p></div>;
    if (error) return <div className="p-8 bg-destructive/5 text-destructive rounded-[2.5rem] border border-destructive/10 flex flex-col items-center gap-3 text-center"><AlertCircle className="h-8 w-8 opacity-50" /><p className="text-sm font-bold uppercase tracking-tight">The altar is veiled.</p></div>;

    const daysTracked = data?.days_count || 0;
    const totalDays = data?.total_arati_attendance_days || 0;
    const momentum = Math.round((totalDays / daysTracked) * 100);
    const mornings = data?.morning_arati_days || 0;

    // Reflection Logic
    const isHighPresence = momentum >= 70;
    const isMorningConsistent = (mornings / (totalDays || 1)) >= 0.8;

    const reflection = isHighPresence && isMorningConsistent
        ? "Your presence before the Altar is a SACRED TESTIMONY. The morning spirit is truly within you."
        : isHighPresence
            ? "Wonderful consistency in your visits. Try to catch more morning morning sessions to taste the special quiet of the dawn."
            : isMorningConsistent && totalDays > 0
                ? "You have a strong morning spirit. Increasing your overall visits will help carry that sanctified mood throughout the week."
                : "The Altar is a source of infinite strength. Even a single visit this week will recharge your devotional heart.";

    // Prepare data for InsightDataDisplay
    const aratiData = [
        { label: "Total Altar Presence", value: totalDays, unit: "Days", highlight: true },
        { label: "Monthly Momentum", value: Math.round(momentum), unit: "%", subtext: "Days with any Arati logged" },
        { label: "Morning Arati Days", value: mornings, unit: "Days", subtext: "Mangala, Narasimha, Tulsi, Darshan" },
    ];

    // Add individual arati types to the display
    if (data) {
        ARATI_TYPES.forEach((arati) => {
            const days = (data as any)?.[arati.key] || 0;
            if (days > 0) {
                aratiData.push({
                    label: arati.label,
                    value: days,
                    unit: "Days",
                    subtext: `Attended ${Math.round((days / daysTracked) * 100)}% of days`,
                });
            }
        });
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-10">
            {/* DAS Style Header */}
            <div className="flex items-center gap-2 mb-2">
                <Flame className="h-3 w-3 text-primary/40" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Devotional Service</h3>
            </div>

            {/* New Data Display */}
            <InsightDataDisplay title="Key Metrics & Breakdown" data={aratiData} />

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

export default AratiInsight;