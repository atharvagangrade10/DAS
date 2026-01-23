"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonth, getYear } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Tab Components
import OverviewTab from "@/components/sadhana/insights/OverviewTab";
import SleepWakeTab from "@/components/sadhana/insights/SleepWakeTab";
import ChantingTab from "@/components/sadhana/insights/ChantingTab";
import ReadingTab from "@/components/sadhana/insights/ReadingTab";
import AssociationTab from "@/components/sadhana/insights/AssociationTab";
import AratiTab from "@/components/sadhana/insights/AratiTab";
import ExerciseTab from "@/components/sadhana/insights/ExerciseTab";

const TABS = [
    { id: "overview", label: "Overview" },
    { id: "sleep", label: "Sleep & Wake" },
    { id: "chanting", label: "Chanting" },
    { id: "reading", label: "Reading" },
    { id: "association", label: "Association" },
    { id: "arati", label: "Ārati" },
    { id: "exercise", label: "Exercise" },
];

const MONTHS = [
    { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
    { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
    { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
];

import { useAuth } from "@/context/AuthContext";
import ParticipantSearch from "@/components/sadhana/insights/ParticipantSearch";

const SadhanaInsights = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = React.useState("overview");

    const now = new Date();
    const currentYear = getYear(now);
    const currentMonth = getMonth(now) + 1;

    const [selectedYear, setSelectedYear] = React.useState(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = React.useState(currentMonth.toString());

    // Manager Search State
    const [viewingParticipant, setViewingParticipant] = React.useState<any | null>(null);

    const scrollRef = React.useRef<HTMLDivElement>(null);

    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => (2024 + i).toString()).reverse();

    const isFutureDate = (year: string, month: string) => {
        const y = parseInt(year);
        const m = parseInt(month);
        if (y > currentYear) return true;
        if (y === currentYear && m > currentMonth) return true;
        return false;
    };

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === "left" ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    const renderTabContent = () => {
        const yearNum = parseInt(selectedYear);
        const monthNum = parseInt(selectedMonth);
        const props = {
            year: yearNum,
            month: monthNum,
            participantId: viewingParticipant?.id // Pass selected participant ID if any
        };

        switch (activeTab) {
            case "overview": return <OverviewTab {...props} />;
            case "sleep": return <SleepWakeTab {...props} />;
            case "chanting": return <ChantingTab {...props} />;
            case "reading": return <ReadingTab {...props} />;
            case "association": return <AssociationTab {...props} />;
            case "arati": return <AratiTab {...props} />;
            case "exercise": return <ExerciseTab {...props} />;
            default: return <OverviewTab {...props} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-[#4A4A4A] pb-32">
            <div className="max-w-2xl mx-auto px-4 pt-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-full bg-white shadow-sm border border-stone-100 h-10 w-10 text-stone-400 hover:text-stone-600"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-300 mb-0.5">Reflections</p>
                        <h1 className="text-2xl font-black text-stone-800 uppercase tracking-tight">Insights</h1>
                    </div>
                    <div className="h-10 w-10" />
                </div>

                {/* Manager Search */}
                {user?.role === 'Manager' && (
                    <ParticipantSearch
                        currentUserId={user.user_id}
                        selectedParticipantId={viewingParticipant?.id}
                        onSelect={setViewingParticipant}
                    />
                )}

                {/* Date Selectors */}
                <div className="flex gap-2 mb-8">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-1/3 rounded-2xl bg-white border border-stone-100 shadow-sm font-medium text-xs h-11 focus:ring-stone-200">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-stone-100 shadow-xl">
                            {years.map(y => <SelectItem key={y} value={y} className="rounded-lg text-xs">{y}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-2/3 rounded-2xl bg-white border border-stone-100 shadow-sm font-medium text-xs h-11 focus:ring-stone-200">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-stone-100 shadow-xl">
                            {MONTHS.map(m => (
                                <SelectItem
                                    key={m.value}
                                    value={m.value}
                                    disabled={isFutureDate(selectedYear, m.value)}
                                    className="rounded-lg text-xs"
                                >
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tab Navigation - Scrollable with arrows on PC */}
            <div className="sticky top-0 z-10 bg-[#FDFCFB]/80 backdrop-blur-md border-b border-stone-100 mb-8">
                <div className="max-w-2xl mx-auto flex items-center group relative">
                    <button
                        onClick={() => scroll("left")}
                        className="absolute left-0 z-20 h-full px-2 bg-gradient-to-r from-[#FDFCFB] via-[#FDFCFB] to-transparent text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div
                        ref={scrollRef}
                        className="overflow-x-auto no-scrollbar px-4 flex flex-nowrap w-full scroll-smooth"
                    >
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "whitespace-nowrap px-4 py-4 text-[10px] font-black tracking-widest uppercase transition-all relative shrink-0",
                                    activeTab === tab.id
                                        ? "text-stone-800"
                                        : "text-stone-300 hover:text-stone-400"
                                )}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-stone-800 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-0 z-20 h-full px-2 bg-gradient-to-l from-[#FDFCFB] via-[#FDFCFB] to-transparent text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default SadhanaInsights;
