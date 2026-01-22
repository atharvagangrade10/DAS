"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyChantingInsight, fetchMonthlyBookInsight } from "@/utils/sadhanaInsightsApi";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Sparkles, Heart, Brain, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryInsightProps {
    year: number;
    month: number;
}

const SummaryInsight: React.FC<SummaryInsightProps> = ({ year, month }) => {
    const { user } = useAuth();

    const chantingQuery = useQuery({
        queryKey: ["chantingInsights", user?.user_id, year, month],
        queryFn: () => fetchMonthlyChantingInsight(user!.user_id, year, month),
        enabled: !!user?.user_id,
    });

    const bookQuery = useQuery({
        queryKey: ["bookInsights", user?.user_id, year, month],
        queryFn: () => fetchMonthlyBookInsight(user!.user_id, year, month),
        enabled: !!user?.user_id,
    });

    if (chantingQuery.isLoading || bookQuery.isLoading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                    Synthesizing your journey...
                </p>
            </div>
        );
    }

    const chantingData = chantingQuery.data;
    const bookData = bookQuery.data;

    // Logic for the Soul (Chanting)
    const soulRef = chantingData?.percent_days_meeting_target && chantingData.percent_days_meeting_target > 80 
        ? { status: "Radiant", text: "Your internal fire is burning steady. Your commitment to the Name is your greatest strength." }
        : { status: "Awakening", text: "You are finding your rhythm. Consistency in small steps will soon lead to great peace." };

    // Logic for the Mind (Reading)
    const mindRef = bookData?.reading_days && bookData.reading_days > 15
        ? { status: "Sharp", text: "Your intelligence is being fed with sacred wisdom. Clarity is your natural state." }
        : { status: "Searching", text: "Make more room for study. Wisdom is the light that removes the darkness of doubt." };

    return (
        <div className="space-y-10 animate-in fade-in duration-1000 pb-10">
            {/* Soul Status */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-indigo-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Soul Status</h3>
                    </div>
                    <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{soulRef.status}</span>
                </div>
                <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100">
                    <p className="text-xl font-black text-indigo-900 leading-tight italic lowercase font-serif">
                        “{soulRef.text}”
                    </p>
                </div>
            </div>

            {/* Mind Status */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Brain className="h-3 w-3 text-emerald-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Mind Status</h3>
                    </div>
                    <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{mindRef.status}</span>
                </div>
                <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100">
                    <p className="text-xl font-black text-emerald-900 leading-tight italic lowercase font-serif">
                        “{mindRef.text}”
                    </p>
                </div>
            </div>

            <div className="pt-10 flex flex-col items-center gap-4 opacity-30">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center leading-loose italic">
                    The three pillars are one journey.
                </p>
            </div>
        </div>
    );
};

export default SummaryInsight;