"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyAssociationInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, Users, AlertCircle, Sparkles } from "lucide-react";
import { AssociationType } from "@/types/sadhana";
import InsightDataDisplay from "./InsightDataDisplay";

interface AssociationInsightProps {
    year: number;
    month: number;
    participantId: string;
}

const TYPE_LABELS: Record<AssociationType, string> = {
    PRABHUPADA: "Srila Prabhupada",
    GURU: "Guru / senior",
    OTHER: "Devotees",
    PREACHING: "Preaching",
    OTHER_ACTIVITIES: "Services/Others"
};

const AssociationInsight: React.FC<AssociationInsightProps> = ({ year, month, participantId }) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ["associationInsights", participantId, year, month],
        queryFn: () => fetchMonthlyAssociationInsight(participantId, year, month),
        enabled: !!participantId,
    });

    if (isLoading) return <div className="py-20 flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary/20" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Building the sacred ecosystem...</p></div>;
    if (error) return <div className="p-8 bg-destructive/5 text-destructive rounded-[2.5rem] border border-destructive/10 flex flex-col items-center gap-3 text-center"><AlertCircle className="h-8 w-8 opacity-50" /><p className="text-sm font-bold uppercase tracking-tight">The sangha is scattered.</p></div>;

    const daysTracked = data?.days_count || 0;
    const associationDays = data?.association_days || 0;
    const activeTypes = data ? Object.values(data.association_days_by_type).filter(d => d > 0).length : 0;

    const associationData: any[] = [
        { label: "Sangha Days", value: associationDays, unit: `/${daysTracked}`, highlight: true },
        { label: "Average Session", value: data?.median_daily_association_minutes || 0, unit: "mins", color: "indigo" },
        { label: "Ecosystem Balance", value: activeTypes, unit: "types", color: "emerald", subtext: activeTypes >= 3 ? "Highly Diverse" : "Focused Path" },
    ];

    if (data) {
        Object.entries(data.association_days_by_type).forEach(([type, days]) => {
            if (days > 0) {
                associationData.push({
                    label: TYPE_LABELS[type as AssociationType],
                    value: days,
                    unit: "days",
                    color: "slate",
                    subtext: `${data.median_minutes_by_type[type as AssociationType]}m avg`
                });
            }
        });
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-10">
            <div className="flex items-center gap-2 mb-2">
                <Users className="h-3 w-3 text-primary/40" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Sādhu-saṅga</h3>
            </div>
            <InsightDataDisplay title="Monthly Ecosystem" data={associationData} />
            <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 shadow-sm">
                <Sparkles className="h-5 w-5 text-primary/40 mb-4" />
                <p className="text-sm font-medium text-foreground/80 leading-relaxed italic">
                    “The path is easier walked together. Nourish your spiritual ecosystem with regular association.”
                </p>
            </div>
        </div>
    );
};

export default AssociationInsight;