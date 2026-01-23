"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMonthlyChantingInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, Zap } from "lucide-react";
import { InsightCard, MetricBadge, ProgressBar } from "./InsightComponents";

interface ChantingTabProps {
    year: number;
    month: number;
    participantId?: string;
}

const ChantingTab: React.FC<ChantingTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    const targetUserId = participantId || user?.user_id!;

    const { data: chanting, isLoading } = useQuery({
        queryKey: ["insight", "chanting", targetUserId, year, month],
        queryFn: () => fetchMonthlyChantingInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-stone-200" />
            </div>
        );
    }

    // Derived values
    const totalRoundsApprox = (chanting?.median_daily_rounds || 0) * (chanting?.days_count || 1);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10 space-y-6">

            {/* Main Stats Header */}
            <InsightCard>
                <div className="flex items-center gap-2 mb-6">
                    <Zap className="h-5 w-5 text-orange-500 fill-orange-500" />
                    <h2 className="text-lg font-black text-stone-800 tracking-tight">Chanting Insights</h2>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    <MetricBadge
                        label="Total Rounds"
                        value={totalRoundsApprox > 0 ? `~${totalRoundsApprox}` : "0"}
                    />
                    <MetricBadge
                        label="Avg Per Day"
                        value={chanting?.median_daily_rounds ?? 0}
                    />
                    <MetricBadge
                        label="Avg Quality"
                        value={chanting?.median_rating ?? 0}
                        subValue="/ 10"
                    />
                </div>

                <div className="space-y-6">
                    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">Slot Consistency</h3>

                    <ProgressBar
                        label="Early Morning (Before 7:30 AM)"
                        value={chanting?.percent_rounds_before_7_30_am || 0}
                        max={100}
                        colorClass="bg-orange-400"
                        valueLabel={`${Math.round(chanting?.percent_rounds_before_7_30_am || 0)}% of rounds`}
                    />

                    <ProgressBar
                        label="Night (After 9:30 PM)"
                        value={chanting?.percent_rounds_after_9_30_pm || 0}
                        max={100}
                        colorClass="bg-stone-400"
                        valueLabel={`${Math.round(chanting?.percent_rounds_after_9_30_pm || 0)}% of rounds`}
                    />

                    <div className="pt-4">
                        <p className="text-[10px] text-stone-400 italic">
                            * Maintaining early morning rounds is the key to steady advancement.
                        </p>
                    </div>
                </div>
            </InsightCard>

        </div>
    );
};

export default ChantingTab;
