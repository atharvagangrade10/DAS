"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyExerciseInsight } from "@/utils/sadhanaInsightsApi";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Heart, AlertCircle, Sparkles, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import InsightDataDisplay from "./InsightDataDisplay"; // New import

interface ExerciseInsightProps {
    year: number;
    month: number;
}

const ExerciseInsight: React.FC<ExerciseInsightProps> = ({ year, month }) => {
    const { user } = useAuth();

    const { data, isLoading, error } = useQuery({
        queryKey: ["exerciseInsights", user?.user_id, year, month],
        queryFn: () => fetchMonthlyExerciseInsight(user!.user_id, year, month),
        enabled: !!user?.user_id,
    });

    if (isLoading) return <div className="py-20 flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary/20" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Maintaining the body temple...</p></div>;
    if (error) return <div className="p-8 bg-destructive/5 text-destructive rounded-[2.5rem] border border-destructive/10 flex flex-col items-center gap-3 text-center"><AlertCircle className="h-8 w-8 opacity-50" /><p className="text-sm font-bold uppercase tracking-tight">The rhythm is broken.</p></div>;

    const daysTracked = data?.days_count || 0;
    const consistency = data?.percent_days_exercised || 0;
    const exerciseDays = data?.exercise_days || 0;
    const medianMinutes = data?.median_exercise_minutes || 0;

    const iqrExercise = data?.iqr_exercise_minutes ?? 0;
    const stabilityLabel = iqrExercise < 15 ? "Steady Rhythm" : iqrExercise < 30 ? "Flexible" : "Varied";

    // Reflection Logic
    const isConsistent = consistency >= 70;
    const isSteady = iqrExercise < 15;

    const reflection = isConsistent && isSteady
        ? "Your care for the body temple is SACERDLY STEADY. This strength allows your spirit to soar without physical burden."
        : isConsistent
            ? "You are dedicated to movement. Bringing more rhythm to your schedule will help your energy levels stay high and even."
            : isSteady && exerciseDays > 0
                ? "You maintain a steady quality when you practice. Increasing your frequency will turn this care into a permanent foundation of health."
                : "The body is the instrument of the soul. Even a brisk 15-minute walk today will clear the mind and sharpen your focus.";

    // Prepare data for InsightDataDisplay
    const exerciseData = [
        { label: "Exercise Days", value: exerciseDays, unit: `/${daysTracked} days`, highlight: true },
        { label: "Monthly Presence", value: Math.round(consistency), unit: "%", subtext: "Days with exercise logged" },
        { label: "Median Session Duration", value: medianMinutes, unit: "min" },
        { label: "Session Variance", value: iqrExercise, unit: "min variance", subtext: stabilityLabel },
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-1000 pb-10">
            {/* DAS Style Header */}
            <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="h-3 w-3 text-primary/40" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Body Maintenance</h3>
            </div>

            {/* New Data Display */}
            <InsightDataDisplay title="Key Metrics" data={exerciseData} />

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

export default ExerciseInsight;