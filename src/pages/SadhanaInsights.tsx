"use client";

import React from "react";
import { format, getMonth, getYear } from "date-fns";
import { ChevronLeft, Search, User, X, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchActivityLogByDate, fetchParticipants } from "@/utils/api";
import InsightNavigation, { InsightCategory } from "@/components/sadhana/InsightNavigation";
import SleepInsight from "@/components/sadhana/SleepInsight";
import ChantingInsight from "@/components/sadhana/ChantingInsight";
import OverallInsight from "@/components/sadhana/OverallInsight";
import BookInsight from "@/components/sadhana/BookInsight";
import AssociationInsight from "@/components/sadhana/AssociationInsight";
import AratiInsight from "@/components/sadhana/AratiInsight";
import ExerciseInsight from "@/components/sadhana/ExerciseInsight";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Participant } from "@/types/participant";

const MONTHS = [
    { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
    { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
    { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
];

const SadhanaInsights = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isManager = user?.role === "Manager";

    const [category, setCategory] = React.useState<InsightCategory>("overall");
    const [targetParticipant, setTargetParticipant] = React.useState<Participant | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    const now = new Date();
    const currentYear = getYear(now);
    const currentMonth = getMonth(now) + 1;

    const [selectedYear, setSelectedYear] = React.useState(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = React.useState(currentMonth.toString());

    const activeParticipantId = targetParticipant?.id || user?.user_id;
    const activeParticipantName = targetParticipant?.full_name || "My Progress";

    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => (2024 + i).toString()).reverse();
    const todayDate = format(new Date(), "yyyy-MM-dd");

    // Fetch daily activity log for "Today" view
    const { data: activityLog } = useQuery({
        queryKey: ["activityLog", todayDate, activeParticipantId],
        queryFn: () => fetchActivityLogByDate(activeParticipantId!, todayDate),
        enabled: !!activeParticipantId,
    });

    // Manager: Participant Search
    const { data: searchResults } = useQuery<Participant[]>({
        queryKey: ["participantSearch", searchQuery],
        queryFn: () => fetchParticipants(searchQuery),
        enabled: searchQuery.length >= 3,
    });

    const renderContent = () => {
        const yearNum = parseInt(selectedYear);
        const monthNum = parseInt(selectedMonth);
        const pId = activeParticipantId!;

        switch (category) {
            case "sleep": return <SleepInsight year={yearNum} month={monthNum} participantId={pId} />;
            case "chanting": return <ChantingInsight year={yearNum} month={monthNum} participantId={pId} />;
            case "reading": return <BookInsight year={yearNum} month={monthNum} participantId={pId} />;
            case "association": return <AssociationInsight year={yearNum} month={monthNum} participantId={pId} />;
            case "arati": return <AratiInsight year={yearNum} month={monthNum} participantId={pId} />;
            case "exercise": return <ExerciseInsight year={yearNum} month={monthNum} participantId={pId} />;
            default: return <OverallInsight activity={activityLog} />;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-32">
            <div className="max-w-md mx-auto px-4 pt-10">
                {/* Modern Header */}
                <div className="flex items-center justify-between mb-12">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-muted/20 h-10 w-10">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">
                            {targetParticipant ? "Devotee Oversight" : "Spiritual Path"}
                        </p>
                        <h1 className="text-3xl font-black text-primary uppercase tracking-tight">Insights</h1>
                    </div>
                    <div className="h-10 w-10" />
                </div>

                {/* Manager Participant Selection */}
                {isManager && (
                    <div className="mb-10 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Switch Devotee</h3>
                            {targetParticipant && (
                                <button onClick={() => setTargetParticipant(null)} className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                    <X className="h-3 w-3" /> Clear Selection
                                </button>
                            )}
                        </div>
                        
                        {!targetParticipant ? (
                            <div className="relative group">
                                <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input 
                                    placeholder="Search by name or phone..." 
                                    className="h-12 pl-11 rounded-2xl bg-muted/20 border-none font-bold text-sm focus-visible:ring-2 focus-visible:ring-primary/10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery.length >= 3 && searchResults && (
                                    <div className="absolute top-14 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                        {searchResults.map((p) => (
                                            <button 
                                                key={p.id}
                                                onClick={() => { setTargetParticipant(p); setSearchQuery(""); }}
                                                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b last:border-none"
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={p.profile_photo_url || ""} />
                                                    <AvatarFallback className="text-[10px] font-black">{p.full_name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-xs font-black uppercase">{p.full_name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{p.phone}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-5 bg-primary text-primary-foreground rounded-[2rem] shadow-xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-white/20">
                                        <AvatarImage src={targetParticipant.profile_photo_url || ""} />
                                        <AvatarFallback className="bg-white/10 font-black">{targetParticipant.full_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Viewing Profile</p>
                                        <p className="text-xl font-black tracking-tight">{targetParticipant.full_name}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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