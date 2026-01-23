"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMonthlySleepInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, Moon, Sun, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime12h } from "@/utils/format";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SleepWakeTabProps {
    year: number;
    month: number;
    participantId?: string;
}

const InsightCard = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-white rounded-[2rem] p-8 border border-stone-100 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-2xl bg-stone-50 text-stone-400">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-800 tracking-tight">{title}</h3>
        </div>
        <div className="grid grid-cols-2 gap-8">
            {children}
        </div>
    </div>
);

const MetricBlock = ({ label, value, description, tooltip }: { label: string; value: string | number | null; description?: string; tooltip?: string }) => (
    <div className="space-y-2">
        <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">{label}</span>
            {tooltip && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info className="h-3 w-3 text-stone-200" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-stone-800 text-white text-[10px] p-2 rounded-lg border-none">
                            <p className="max-w-[150px]">{tooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
        <p className="text-2xl font-black text-stone-700 tracking-tight">{value ?? "—"}</p>
        {description && <p className="text-xs font-medium text-stone-500 leading-snug">{description}</p>}
    </div>
);

const SleepWakeTab: React.FC<SleepWakeTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    const targetUserId = participantId || user?.user_id!;

    const { data: sleep, isLoading } = useQuery({
        queryKey: ["insight", "sleep", targetUserId, year, month],
        queryFn: () => fetchMonthlySleepInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-stone-200" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10">
            <div className="mb-10 text-center px-4">
                <h2 className="text-2xl font-black text-stone-800 mb-2 uppercase tracking-tight">Rest & Rising</h2>
                <p className="text-xs font-medium text-stone-500 max-w-[240px] mx-auto leading-relaxed">
                    Understanding the rhythm of your body helps create space for spiritual depth.
                </p>
            </div>

            <InsightCard title="Wake Rhythm" icon={Sun}>
                <MetricBlock
                    label="Median"
                    value={formatTime12h(sleep?.median_wakeup_time)}
                    description="Your most consistent rising time."
                    tooltip="The middle value of all your wake times. Less affected by outliers than an average."
                />
                <MetricBlock
                    label="IQR"
                    value={sleep?.iqr_wakeup_minutes ? `${sleep.iqr_wakeup_minutes}m` : null}
                    description="Variability in your rising."
                    tooltip="Interquartile Range: The spread of the middle 50% of your data. Lower means more consistency."
                />
                <div className="col-span-2 pt-4 border-t border-stone-50">
                    <MetricBlock
                        label="Early Rising"
                        value={sleep ? `${sleep.percent_wakeup_before_5am}%` : null}
                        description="Portion of days waking at or before 5:00 AM."
                    />
                </div>
            </InsightCard>

            <InsightCard title="Sleep Quality" icon={Moon}>
                <MetricBlock
                    label="Median Bed"
                    value={formatTime12h(sleep?.median_sleep_time)}
                    description="When you usually retire."
                />
                <MetricBlock
                    label="Bed IQR"
                    value={sleep?.iqr_sleep_minutes ? `${sleep.iqr_sleep_minutes}m` : null}
                    description="Consistency of rest."
                />
                <div className="col-span-2 pt-4 border-t border-stone-50">
                    <MetricBlock
                        label="Avg Duration"
                        value={sleep?.median_sleep_duration_minutes ? `${Math.round(sleep.median_sleep_duration_minutes / 60)}h ${sleep.median_sleep_duration_minutes % 60}m` : null}
                        description="Typical amount of rest per night."
                    />
                </div>
            </InsightCard>

            <div className="mt-12 text-center opacity-40 px-8">
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                    True rest is not found in sleep, but in a mind at peace with its purpose.
                </p>
            </div>
        </div>
    );
};

export default SleepWakeTab;
