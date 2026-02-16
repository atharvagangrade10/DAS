"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMonthlyAratiInsight } from "@/utils/sadhanaInsightsApi";
import { fetchBatchParticipantStats } from "@/utils/api";
import { calculateAratiStatus } from "@/utils/insightLogic";
import { Loader2, Flame, Circle } from "lucide-react";
import { AratiInsightResponse } from "@/types/sadhana";

interface AratiTabProps {
    year: number;
    month: number;
    participantId?: string;
}

// Sleek Metric Card
const SleekMetricCard = ({
    label,
    value,
    subtext
}: {
    label: string;
    value: string | number | null;
    subtext: string;
}) => {
    return (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100 flex flex-col h-full justify-between">
            <div>
                <div className="text-xs sm:text-sm font-bold text-gray-400 mb-3 sm:mb-4 uppercase tracking-widest">
                    {label}
                </div>
                <div className="text-4xl sm:text-5xl font-normal text-[#0D1B2A] mb-3 sm:mb-4 tracking-tight">
                    {value ?? "—"}
                </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {subtext}
            </p>
        </div>
    );
};

// Arati Type Breakdown Card
const AratiTypeCard = ({
    title,
    description,
    percentage,
    colorClass = "bg-[#0D1B2A]"
}: {
    title: string;
    description: string;
    percentage: number;
    colorClass?: string;
}) => {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-base sm:text-lg font-bold text-[#0D1B2A] tracking-tight mb-1">
                        {title}
                    </h4>
                    <p className="text-xs text-gray-400 font-medium">
                        {description}
                    </p>
                </div>
                <span className="text-2xl sm:text-3xl font-light text-[#0D1B2A]">
                    {percentage}%
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

const AratiTab: React.FC<AratiTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    const targetUserId = participantId || user?.user_id!;

    // Sanjeevani Batch ID
    const SANJEEVANI_BATCH_ID = "695e8a0f91d5274d0da3bf1d";

    const { data: arati, isLoading } = useQuery({
        queryKey: ["insight", "arati", targetUserId, year, month],
        queryFn: () => fetchMonthlyAratiInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    const { data: sanjeevaniStats } = useQuery({
        queryKey: ["batchParticipantStats", SANJEEVANI_BATCH_ID, targetUserId],
        queryFn: () => fetchBatchParticipantStats(SANJEEVANI_BATCH_ID, targetUserId),
        enabled: !!targetUserId,
    });

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
        );
    }

    const health = calculateAratiStatus(arati, year, month);

    const totalDays = arati?.days_count || 30;
    const attendedDays = arati?.total_arati_attendance_days || 0;
    const consistencyPct = Math.round((attendedDays / totalDays) * 100);

    const getPct = (val: number | undefined) => Math.round(((val || 0) / totalDays) * 100);

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-100">
                <div className="p-3 bg-orange-50 rounded-xl">
                    <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />
                </div>
                <div className="flex-1">
                    <h3 className="text-[#0D1B2A] text-xl sm:text-2xl font-medium">Ārati</h3>
                </div>

                {/* Status Pill */}
                <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r rounded-full border border-white/50 self-start sm:self-auto ${health.bgGradient}`}>
                    <Circle className={`h-3 w-3 ${health.iconColor}`} />
                    <span className={`text-sm font-bold ${health.colorClass}`}>{health.title}</span>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                <SleekMetricCard
                    label="Total Āratī Attendance"
                    value={`${attendedDays} days`}
                    subtext="Days with any āratī participation"
                />
                <SleekMetricCard
                    label="% Days with Any Āratī"
                    value={`${consistencyPct}%`}
                    subtext="Consistency of ritual engagement"
                />
                <SleekMetricCard
                    label="Days Logged"
                    value={arati?.days_count}
                    subtext="Total entries this month"
                />
            </div>

            {/* Breakdown Title */}
            <div>
                <h4 className="text-base text-gray-600 font-medium mb-4">Programs & Classes</h4>
                <div className="space-y-4">

                    {/* Sanjeevani Class Card - Total Stats */}
                    {sanjeevaniStats && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600" />
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-base sm:text-lg font-bold text-[#0D1B2A] tracking-tight mb-1 flex items-center gap-2">
                                        Sanjeevani Class
                                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wide">
                                            Total
                                        </span>
                                    </h4>
                                    <p className="text-xs text-gray-400 font-medium">
                                        {sanjeevaniStats.attendance_ratio} sessions attended
                                    </p>
                                </div>
                                <span className="text-2xl sm:text-3xl font-light text-[#0D1B2A]">
                                    {Math.round(sanjeevaniStats.attendance_percentage)}%
                                </span>
                            </div>

                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-500 to-indigo-600"
                                    style={{ width: `${sanjeevaniStats.attendance_percentage}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <AratiTypeCard
                        title="Maṅgala Āratī"
                        description="Foundation of daily spiritual rhythm"
                        percentage={getPct(arati?.mangla_attended_days)}
                        colorClass="bg-[#0D1B2A]"
                    />

                    <AratiTypeCard
                        title="Nṛsiṁha Āratī"
                        description="Prayer for protection"
                        percentage={getPct(arati?.narasimha_attended_days)}
                        colorClass="bg-[#0D1B2A]"
                    />

                    <AratiTypeCard
                        title="Tulasī Āratī"
                        description="Worship of the sacred plant"
                        percentage={getPct(arati?.tulsi_arati_attended_days)}
                        colorClass="bg-[#0D1B2A]"
                    />

                    <AratiTypeCard
                        title="Japa Sanga"
                        description="Joint chanting session"
                        percentage={getPct(arati?.japa_sanga_attended_days)}
                        colorClass="bg-[#0D1B2A]"
                    />

                    <AratiTypeCard
                        title="Darshan Āratī"
                        description="Greeting the Deities"
                        percentage={getPct(arati?.darshan_arati_attended_days)}
                        colorClass="bg-[#0D1B2A]"
                    />

                    <AratiTypeCard
                        title="Guru Pūjā"
                        description="Worship of the spiritual master"
                        percentage={getPct(arati?.guru_puja_attended_days)}
                        colorClass="bg-[#0D1B2A]"
                    />

                    <AratiTypeCard
                        title="Morning Program"
                        description="Complete morning sadhana attendance"
                        percentage={getPct(arati?.morning_arati_days)}
                        colorClass="bg-[#0D1B2A]"
                    />

                    <AratiTypeCard
                        title="Sandhyā / Evening Āratī"
                        description="Closing the day consciously"
                        percentage={getPct(arati?.sandhya_arati_attended_days)}
                        colorClass="bg-[#0D1B2A]"
                    />

                </div>
            </div>


            {/* Reflection Box */}
            <div className={`bg-gradient-to-br rounded-2xl p-5 sm:p-7 border shadow-sm mt-4 ${health.status === 'RED' ? 'from-rose-50 to-red-50 border-rose-100' : health.status === 'YELLOW' ? 'from-amber-50 to-yellow-50 border-amber-100' : 'from-emerald-50 to-green-50 border-emerald-100'}`}>
                <h4 className="text-[#0D1B2A] mb-2 sm:mb-3 text-base sm:text-lg font-medium">Reflection</h4>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                    {health.reflection}
                </p>
            </div>

            <p className="text-[10px] text-gray-400 italic mt-6">
                Percentages are relative to days present, showing intentional choices rather than obligations.
            </p>

        </div>
    );
};

export default AratiTab;
