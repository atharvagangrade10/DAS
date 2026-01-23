"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMonthlyAssociationInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, Users } from "lucide-react";
import { InsightCard, MetricBadge, ProgressBar } from "./InsightComponents";

interface AssociationTabProps {
    year: number;
    month: number;
    participantId?: string;
}

const AssociationTab: React.FC<AssociationTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    const targetUserId = participantId || user?.user_id!;

    const { data: association, isLoading } = useQuery({
        queryKey: ["insight", "association", targetUserId, year, month],
        queryFn: () => fetchMonthlyAssociationInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-stone-200" />
            </div>
        );
    }

    const getLabel = (type: string) => {
        switch (type) {
            case "PRABHUPADA": return "Srila Prabhupada";
            case "GURU": return "Spiritual Master";
            case "PREACHING": return "Preaching & Outreach";
            case "OTHER_ACTIVITIES": return "Service & Seva";
            default: return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case "PRABHUPADA": return "bg-orange-400";
            case "GURU": return "bg-green-500";
            case "PREACHING": return "bg-blue-400";
            default: return "bg-stone-300";
        }
    }

    const totalMinutes = (association?.median_daily_association_minutes || 0) * (association?.association_days || 0);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10 space-y-6">

            <InsightCard>
                <div className="flex items-center gap-2 mb-6">
                    <Users className="h-5 w-5 text-green-600 fill-green-600" />
                    <h2 className="text-lg font-black text-stone-800 tracking-tight">Association Insights</h2>
                </div>

                <div className="mb-8">
                    <MetricBadge
                        label="Total Association Time"
                        value={totalMinutes}
                        subValue="minutes (est)"
                    />
                </div>

                <div className="space-y-6">
                    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">Breakdown by Type</h3>

                    {association?.median_minutes_by_type && Object.entries(association.median_minutes_by_type).map(([type, minutes]) => (
                        <ProgressBar
                            key={type}
                            label={getLabel(type)}
                            value={minutes}
                            max={Math.max(...Object.values(association.median_minutes_by_type), 60)} // Dynamic max relative to highest
                            colorClass={getColor(type)}
                            valueLabel={`${minutes} min avg`}
                        />
                    ))}

                    {(!association?.median_minutes_by_type || Object.keys(association.median_minutes_by_type).length === 0) && (
                        <p className="text-center py-4 text-xs font-medium text-stone-400">
                            No breakdown data available for this period.
                        </p>
                    )}

                    <div className="pt-4 bg-stone-50 -mx-6 -mb-6 p-4 border-t border-stone-100">
                        <p className="text-xs font-medium text-stone-500 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-orange-400 block shrink-0" />
                            Association with Srila Prabhupada is the foundation.
                        </p>
                    </div>
                </div>
            </InsightCard>

        </div>
    );
};

export default AssociationTab;
