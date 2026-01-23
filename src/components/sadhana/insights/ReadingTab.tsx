"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMonthlyBookInsight } from "@/utils/sadhanaInsightsApi";
import { Loader2, BookOpen, Sparkles } from "lucide-react";

interface ReadingTabProps {
    year: number;
    month: number;
    participantId?: string;
}

const ReadingTab: React.FC<ReadingTabProps> = ({ year, month, participantId }) => {
    const { user } = useAuth();
    const targetUserId = participantId || user?.user_id!;

    const { data: book, isLoading } = useQuery({
        queryKey: ["insight", "book", targetUserId, year, month],
        queryFn: () => fetchMonthlyBookInsight(targetUserId, year, month),
        enabled: !!targetUserId,
    });

    if (isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-stone-200" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10">
            <div className="mb-10 text-center px-4">
                <h2 className="text-2xl font-black text-stone-800 mb-2 uppercase tracking-tight">Sacred Wisdom</h2>
                <p className="text-xs font-medium text-stone-500 max-w-[240px] mx-auto leading-relaxed">
                    Feeding the intelligence with divine knowledge clarifies the path and strengthens the heart.
                </p>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-stone-100 shadow-sm mb-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 rounded-2xl bg-stone-50 text-stone-400">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-stone-800 tracking-tight">Reading Consistency</h3>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">Total Days</span>
                        <p className="text-2xl font-black text-stone-700 tracking-tight">{book?.reading_days ?? 0}</p>
                        <p className="text-xs font-medium text-stone-500 leading-snug">Days with study recorded.</p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">Median Time</span>
                        <p className="text-2xl font-black text-stone-700 tracking-tight">{book?.median_daily_reading_minutes ?? 0}m</p>
                        <p className="text-xs font-medium text-stone-500 leading-snug">Typical daily duration.</p>
                    </div>
                    <div className="space-y-2 col-span-2 pt-4 border-t border-stone-50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">Focus IQR</span>
                        <p className="text-2xl font-black text-stone-700 tracking-tight">{book?.iqr_daily_reading_minutes ?? 0}m</p>
                        <p className="text-xs font-medium text-stone-500 leading-snug">Consistency of study sessions.</p>
                    </div>
                </div>
            </div>

            {/* Reflection Section */}
            <div className="bg-[#FAF9F6] rounded-[2rem] p-10 border border-stone-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                    <Sparkles className="h-16 w-16" />
                </div>
                <div className="relative z-10 text-center">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 mb-6">Primary Book Focus</h4>
                    <p className="text-2xl font-black text-stone-800 leading-tight mb-4 tracking-tight">
                        {book?.primary_book_name || "Cultivating a quiet mind for study."}
                    </p>
                    <div className="h-px w-8 bg-stone-200 mx-auto mb-4" />
                    <p className="text-xs font-medium text-stone-500 max-w-[200px] mx-auto leading-relaxed">
                        Focus naturally shifts — this highlights where your heart found its depth this period.
                    </p>
                </div>
            </div>

            <div className="mt-12 text-center opacity-40 px-8">
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                    Wisdom is the lamp that illuminates the soul's journey back home.
                </p>
            </div>
        </div>
    );
};

export default ReadingTab;
