import React from "react";
import { cn } from "@/lib/utils";

export const InsightCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("bg-white rounded-[1.5rem] p-6 border border-stone-100 shadow-sm", className)}>
        {children}
    </div>
);

export const MetricBadge = ({ label, value, subValue, icon: Icon, colorClass }: { label: string; value: string | number; subValue?: string; icon?: any; colorClass?: string }) => (
    <div className="flex flex-col">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">{label}</span>
        <div className="flex items-center gap-2">
            {Icon && <Icon className={cn("h-4 w-4", colorClass)} />}
            <span className="text-2xl font-black text-stone-800 tracking-tight">{value}</span>
            {subValue && <span className="text-[10px] font-medium text-stone-400 mt-2">{subValue}</span>}
        </div>
    </div>
);

export const ProgressBar = ({
    label,
    value,
    max = 100,
    colorClass = "bg-orange-400",
    valueLabel
}: {
    label: string;
    value: number;
    max?: number;
    colorClass?: string;
    valueLabel?: string;
}) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[11px] font-medium text-stone-500">{label}</span>
                <span className="text-[10px] font-bold text-stone-400">{valueLabel || `${value}`}</span>
            </div>
            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all duration-500", colorClass)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
