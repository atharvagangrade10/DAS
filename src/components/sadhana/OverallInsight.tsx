"use client";

import React from "react";
import { Zap, Moon, BookOpen, Users, Dumbbell, Sparkles, Heart, Brain, Activity } from "lucide-react";
import { ActivityLogResponse } from "@/types/sadhana";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface OverallInsightProps {
    activity?: ActivityLogResponse;
}

const PillarBlock = ({ title, icon: Icon, children, colorClass }: any) => (
    <div className={cn("p-8 rounded-[3rem] border transition-all shadow-sm", colorClass)}>
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-white/40 dark:bg-black/20">
                <Icon className="h-5 w-5 text-current" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] opacity-70">{title}</h3>
        </div>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const MetricRow = ({ icon: Icon, label, value, percent }: any) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Icon className="h-4 w-4 opacity-40" />
            <div>
                <p className="text-[10px] font-bold uppercase opacity-40 mb-0.5">{label}</p>
                <p className="text-2xl font-black tracking-tight">{value}</p>
            </div>
        </div>
        <div className="h-1.5 w-12 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-current" style={{ width: `${percent}%` }} />
        </div>
    </div>
);

const OverallInsight: React.FC<OverallInsightProps> = ({ activity }) => {
    const totalRounds = activity?.chanting_logs.reduce((sum, log) => sum + log.rounds, 0) || 0;
    const totalReadingMinutes = activity?.book_reading_logs.reduce((sum, log) => sum + log.reading_time, 0) || 0;
    const totalAssociationMinutes = activity?.association_logs.reduce((sum, log) => sum + log.duration, 0) || 0;
    const totalExerciseMinutes = activity?.exercise_time || 0;
    const wakeupTime = activity?.wakeup_at ? format(parseISO(activity.wakeup_at), "h:mm aa") : "--:--";

    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="px-2 mb-10">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-3">Spiritual Health</p>
                <h2 className="text-6xl font-black text-primary leading-[0.85] uppercase tracking-tighter italic">State of<br />Being</h2>
            </div>

            <div className="grid gap-6">
                {/* SOUL PILLAR */}
                <PillarBlock 
                    title="The Soul" 
                    icon={Heart} 
                    colorClass="bg-indigo-50 border-indigo-100 text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-200"
                >
                    <MetricRow 
                        icon={Zap} 
                        label="Chanting" 
                        value={`${totalRounds} Rounds`} 
                        percent={Math.min((totalRounds / 16) * 100, 100)} 
                    />
                    <MetricRow 
                        icon={Users} 
                        label="Sangha" 
                        value={`${(totalAssociationMinutes / 60).toFixed(1)}h`} 
                        percent={Math.min((totalAssociationMinutes / 60) * 100, 100)} 
                    />
                </PillarBlock>

                {/* MIND PILLAR */}
                <PillarBlock 
                    title="The Mind" 
                    icon={Brain} 
                    colorClass="bg-emerald-50 border-emerald-100 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-200"
                >
                    <MetricRow 
                        icon={BookOpen} 
                        label="Wisdom" 
                        value={`${totalReadingMinutes}m`} 
                        percent={Math.min((totalReadingMinutes / 30) * 100, 100)} 
                    />
                </PillarBlock>

                {/* BODY PILLAR */}
                <PillarBlock 
                    title="The Body" 
                    icon={Activity} 
                    colorClass="bg-amber-50 border-amber-100 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-200"
                >
                    <MetricRow 
                        icon={Moon} 
                        label="Wake Up" 
                        value={wakeupTime} 
                        percent={85} 
                    />
                    <MetricRow 
                        icon={Dumbbell} 
                        label="Fitness" 
                        value={`${totalExerciseMinutes}m`} 
                        percent={Math.min((totalExerciseMinutes / 30) * 100, 100)} 
                    />
                </PillarBlock>
            </div>

            {/* Status Quote */}
            <div className="bg-primary p-10 rounded-[3rem] text-center relative overflow-hidden shadow-2xl shadow-primary/20 mt-8">
                <Sparkles className="absolute top-4 right-4 h-6 w-6 text-white/20" />
                <p className="text-lg font-bold text-primary-foreground leading-tight italic lowercase font-serif">
                    “{totalRounds > 0 && totalReadingMinutes > 0 
                        ? "Your pillars are standing strong. Carry this clarity into your leadership today."
                        : "A balanced practitioner is a balanced leader. Tend to your morning rhythm."}”
                </p>
            </div>
        </div>
    );
};

export default OverallInsight;