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
// Tab Components
import OverviewTab from "../components/sadhana/insights/OverviewTab";
import SleepWakeTab from "../components/sadhana/insights/SleepWakeTab";
import ChantingTab from "../components/sadhana/insights/ChantingTab";
import ReadingTab from "../components/sadhana/insights/ReadingTab";
import AssociationTab from "../components/sadhana/insights/AssociationTab";
import AratiTab from "../components/sadhana/insights/AratiTab";
import ExerciseTab from "../components/sadhana/insights/ExerciseTab";
import LeaderboardTab from "../components/sadhana/insights/LeaderboardTab";

const TABS = [
    { id: "overview", label: "Overview" },
    { id: "sleep", label: "Sleep & Wake" },
    { id: "chanting", label: "Chanting" },
    { id: "reading", label: "Reading" },
    { id: "association", label: "Association" },
    { id: "arati", label: "Ārati" },
    { id: "exercise", label: "Exercise" },
    { id: "leaderboard", label: "Leaderboard" },
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
    const [hasSelectedPeriod, setHasSelectedPeriod] = React.useState(false);

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
            case "leaderboard": return <LeaderboardTab />;
            default: return <OverviewTab {...props} />;
        }
    };

    // Initial View: Monthly Insight Card
    if (!hasSelectedPeriod && !viewingParticipant) {
        return (
            <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 relative">
                {/* Background Blobs for specific aesthetic if needed, but keeping it clean white/gray for now */}

                {/* Back Button */}
                <div className="absolute top-8 left-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-full bg-white shadow-sm border border-stone-100 h-10 w-10 text-stone-400 hover:text-stone-600"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </div>


                <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 p-10 w-full max-w-[400px]">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-medium text-[#1A2C4E] mb-2 tracking-tight">Monthly Insight</h1>
                        <p className="text-slate-400 text-sm font-medium">A calm overview of your month</p>
                    </div>

                    {/* Form */}
                    <div className="space-y-6">
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-600 ml-1">Month</label>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full rounded-xl bg-white border border-slate-200 shadow-sm font-medium h-12 px-4 focus:ring-slate-100 focus:border-slate-300">
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] rounded-xl border-slate-100 shadow-xl">
                                    {MONTHS.map(m => (
                                        <SelectItem
                                            key={m.value}
                                            value={m.value}
                                            disabled={isFutureDate(selectedYear, m.value)}
                                            className="rounded-lg text-sm py-2 cursor-pointer focus:bg-slate-50"
                                        >
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2.5">
                            <label className="text-xs font-bold text-slate-600 ml-1">Year</label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-full rounded-xl bg-white border border-slate-200 shadow-sm font-medium h-12 px-4 focus:ring-slate-100 focus:border-slate-300">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                    {years.map(y => (
                                        <SelectItem key={y} value={y} className="rounded-lg text-sm py-2 cursor-pointer focus:bg-slate-50">
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            className="w-full h-12 rounded-xl bg-[#15233E] hover:bg-[#15233E]/90 text-white font-semibold text-sm mt-4 shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98]"
                            onClick={() => setHasSelectedPeriod(true)}
                        >
                            View Monthly Overview
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Dashboard View
    return (
        <div className="min-h-screen bg-[#FDFCFB] text-[#4A4A4A] pb-32">
            {/* New Sticky Header */}
            <div className="sticky top-0 z-20 bg-[#FDFCFB]/90 backdrop-blur-md border-b border-stone-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

                    {/* Left Group: Back + Title */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setHasSelectedPeriod(false)}
                            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 transition-colors group px-2 py-1 rounded-lg hover:bg-stone-50"
                        >
                            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                            <span className="text-xs font-semibold tracking-wide">Change Month</span>
                        </button>

                        <div className="h-4 w-[1px] bg-stone-200 hidden sm:block" />

                        <h2 className="text-base font-bold text-stone-800 tracking-tight hidden sm:block">
                            {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                        </h2>
                    </div>

                    {/* Right: Navigation */}
                    <div className="flex items-center gap-3">
                        {/* Manager Search Trigger */}
                        {user?.role === 'Manager' && (
                            <ParticipantSearch
                                currentUserId={user.user_id}
                                selectedParticipantId={viewingParticipant?.id}
                                onSelect={setViewingParticipant}
                                compact
                            />
                        )}

                        {/* Desktop Tabs (Visible md+) */}
                        <div className="hidden md:flex items-center gap-1 bg-stone-100/50 p-1 rounded-xl border border-stone-200/50">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                                        activeTab === tab.id
                                            ? "bg-[#0D1B2A] text-white shadow-sm"
                                            : "text-stone-500 hover:bg-white hover:text-stone-700 hover:shadow-sm"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Mobile Dropdown (Visible < md) */}
                        <div className="md:hidden">
                            <Select value={activeTab} onValueChange={setActiveTab}>
                                <SelectTrigger className="w-[140px] h-9 rounded-xl bg-white border-stone-200 shadow-sm text-xs font-semibold text-stone-600 focus:ring-stone-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end" className="rounded-xl border-stone-100 shadow-xl p-1">
                                    {TABS.map(tab => (
                                        <SelectItem
                                            key={tab.id}
                                            value={tab.id}
                                            className="rounded-lg text-xs font-medium focus:bg-stone-50 cursor-pointer py-2"
                                        >
                                            {tab.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-6xl mx-auto px-4 pt-8">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default SadhanaInsights;
