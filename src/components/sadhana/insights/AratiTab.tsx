"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMonthlyAratiInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, Zap, CheckCircle2 } from "lucide-react";

interface AratiTabProps {
    year: number;
    month: number;
    participantId?: string;
}

const AratiRow = ({ label, count, total }: { label: string; count: number; total: number }) => {
    const percentage = Math.round((count / total) * 100) || 0;
    return (
        <div className="flex items-center justify-between group">
            <div className="space-y-0.5">
                <p className="text-xs font-bold text-stone-700 tracking-tight">{label}</p>
                <p className="text-[10px] text-stone-300 uppercase tracking-widest">{count} days present</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="h-1 w-12 bg-stone-50 rounded-full overflow-hidden hidden xs:block">
                    <div className="h-full bg-stone-200" style={{ width: `${percentage}%` }} />
                </div>
                <p className="text-lg font-black text-stone-600 w-10 text-right">{percentage}%</p>
            </div>
        </div>
    );
};

const AratiTab: React.FC<AratiTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    const targetUserId = participantId || user?.user_id!;

    const { data: arati, isLoading } = useQuery({
        queryKey: ["insight", "arati", targetUserId, year, month],
        queryFn: () => fetchMonthlyAratiInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-stone-200" />
            </div>
        );
    }

    const totalDays = arati?.days_count || 30;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10">
            <div className="mb-10 text-center px-4">
                <h2 className="text-2xl font-black text-stone-800 mb-2 uppercase tracking-tight">Temple Service</h2>
                <p className="text-xs font-medium text-stone-500 max-w-[240px] mx-auto leading-relaxed">
                    Witnessing the beauty of the Lord creates lasting impressions on the consciousness.
                </p>
            </div>

            <div className="bg-white rounded-[2rem] p-10 border border-stone-100 shadow-sm mb-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4">
                    <div className="bg-stone-50 px-4 py-1 rounded-full border border-stone-100">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-300">Morning Presence</p>
                    </div>
                </div>
                <CheckCircle2 className="h-8 w-8 text-stone-200 mx-auto mb-4" />
                <h3 className="text-4xl font-black text-stone-800 tracking-tighter mb-1">{arati?.morning_arati_days ?? 0}</h3>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest font-black">Days in Early Service</p>
                <p className="text-xs font-medium text-stone-500 mt-2 leading-snug opacity-80">Reflecting consistency in Mangla & Morning Āratīs</p>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-stone-100 shadow-sm mb-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 rounded-2xl bg-stone-50 text-stone-400">
                        <Zap className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-stone-800 tracking-tight">Attendance Summary</h3>
                </div>

                <div className="space-y-6">
                    <AratiRow label="Mangla Āratī" count={arati?.mangla_attended_days || 0} total={totalDays} />
                    <AratiRow label="Narshima Āratī" count={arati?.narasimha_attended_days || 0} total={totalDays} />
                    <AratiRow label="Tulsi Āratī" count={arati?.tulsi_arati_attended_days || 0} total={totalDays} />
                    <AratiRow label="Darshan Āratī" count={arati?.darshan_arati_attended_days || 0} total={totalDays} />
                    <AratiRow label="Guru Pūjā" count={arati?.guru_puja_attended_days || 0} total={totalDays} />
                    <AratiRow label="Sandhyā Āratī" count={arati?.sandhya_arati_attended_days || 0} total={totalDays} />
                </div>
            </div>

            <div className="mt-12 text-center opacity-30 px-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed">
                    The deity is the mercy-form of the Lord, appearing before us to accept our simple service.
                </p>
            </div>
        </div>
    );
};

export default AratiTab;
