"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export type MetricColor = "amber" | "indigo" | "emerald" | "rose" | "blue" | "slate" | "primary";

interface DataItem {
    label: string;
    value: string | number;
    unit?: string;
    subtext?: string;
    highlight?: boolean;
    color?: MetricColor;
}

interface InsightDataDisplayProps {
    title: string;
    data: DataItem[];
}

const InsightDataDisplay: React.FC<InsightDataDisplayProps> = ({ title, data }) => {
    const colorMap: Record<MetricColor, string> = {
        amber: "bg-amber-50 border-amber-100 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-200",
        indigo: "bg-indigo-50 border-indigo-100 text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-200",
        emerald: "bg-emerald-50 border-emerald-100 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-200",
        rose: "bg-rose-50 border-rose-100 text-rose-900 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-200",
        blue: "bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-200",
        slate: "bg-slate-50 border-slate-100 text-slate-900 dark:bg-slate-950/20 dark:border-slate-900/30 dark:text-slate-200",
        primary: "bg-primary text-primary-foreground shadow-xl shadow-primary/20",
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-2 px-1">
                <Star className="h-3 w-3 text-primary/40 fill-primary/10" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">{title}</h3>
            </div>

            <div className="grid gap-5">
                {data.map((item) => (
                    <div 
                        key={item.label} 
                        className={cn(
                            "group flex flex-col justify-between p-8 rounded-[2.5rem] transition-all duration-300 border shadow-sm",
                            item.highlight ? colorMap.primary : (colorMap[item.color || "slate"]),
                            item.highlight && "scale-[1.02] -rotate-1 shadow-2xl"
                        )}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-2">
                                <p className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.2em] opacity-60",
                                )}>
                                    {item.label}
                                </p>
                                {item.subtext && (
                                    <p className={cn(
                                        "text-[9px] font-bold uppercase tracking-tight px-3 py-1 rounded-full inline-block",
                                        item.highlight ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10 opacity-70"
                                    )}>
                                        {item.subtext}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black tracking-tighter uppercase leading-none">
                                {item.value}
                            </span>
                            {item.unit && (
                                <span className={cn(
                                    "text-xs font-black uppercase opacity-40 mb-1",
                                )}>
                                    {item.unit}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InsightDataDisplay;