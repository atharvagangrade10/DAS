"use client";

import React from "react";
import { format, getMonth, getYear } from "date-fns";
import { ChevronLeft, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchActivityLogByDate } from "@/utils/api";
import InsightNavigation, { InsightCategory } from "@/components/sadhana/InsightNavigation";
import SleepInsight from "@/components/sadhana/SleepInsight";
import ChantingInsight from "@/components/sadhana/ChantingInsight";
import OverallInsight from "@/components/sadhana/OverallInsight";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import BookInsight from "@/components/sadhana/BookInsight";
import AssociationInsight from "@/components/sadhana/AssociationInsight";
import AratiInsight from "@/components/sadhana/AratiInsight";
import ExerciseInsight from "@/components/sadhana/ExerciseInsight";

const MONTHS = [
    { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
    { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
    { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
];

const SadhanaInsights = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [category, setCategory] = React.useState<InsightCategory>("overall");

    const now = new Date();
    const currentYear = getYear(now);
    const currentMonth = getMonth(now) + 1;

    const [selectedYear, setSelectedYear] = React.useState(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = React.useState(currentMonth.toString());

    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => (2024 + i).toString()).reverse();
    const todayDate = format(new Date(), "yyyy-MM-dd");

    const { data: activityLog } = useQuery({
        queryKey: ["activityLog", todayDate],
        queryFn: () => fetchActivityLogByDate(user?.user_id!, todayDate),
        enabled: !!user?.user_id,
    });

    const isFutureDate = (year: string, month: string) => {
        const y = parseInt(year);
        const m = parseInt(month);
        if (y > currentYear) return true;
        if (y === currentYear && m > currentMonth) return true;
        return false;
    };

    const renderContent = () => {
        const yearNum = parseInt(selectedYear);
        const monthNum = parseInt(selectedMonth);

        switch (category) {
            case "sleep": return <SleepInsight year={yearNum} month={monthNum} />;
            case "chanting": return <ChantingInsight year={yearNum} month={monthNum} />;
            case "reading": return <BookInsight year={yearNum} month={monthNum} />;
            case "association": return <AssociationInsight year={yearNum} month={monthNum} />;
            case "arati": return <AratiInsight year={yearNum} month={monthNum} />;
            case "exercise": return <ExerciseInsight year={yearNum} month={monthNum} />;
            default: return <OverallInsight activity={activityLog} />;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-32">
            <div className="max-w-md mx-auto px-4 pt-10">
                <div className="flex items-center justify-between mb-12">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-muted/20 h-10 w-10">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">Spiritual Path</p>
                        <h1 className="text-3xl font-black text-primary uppercase tracking-tight">Insights</h1>
                    </div>
                    <div className="h-10 w-10" />
                </div>

                <div className="mb-10">
                    <InsightNavigation activeCategory={category} onCategoryChange={setCategory} />
                </div>

                <div className="flex flex-col gap-4 mt-8 mb-10">
                    {category !== 'overall' && (
                        <div className="flex gap-2">
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[100px] rounded-2xl bg-muted/20 border-none font-bold text-xs h-12">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    {years.map(y => <SelectItem key={y} value={y} className="rounded-lg font-bold text-xs">{y}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full rounded-2xl bg-muted/20 border-none font-bold text-xs h-12">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    {MONTHS.map(m => (
                                        <SelectItem key={m.value} value={m.value} disabled={isFutureDate(selectedYear, m.value)} className="rounded-lg font-bold text-xs">
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <div className="space-y-10">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default SadhanaInsights;