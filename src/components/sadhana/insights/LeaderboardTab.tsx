"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchParticipantRankings } from "@/utils/sadhanaInsightsApi";
import { Loader2, Trophy, Medal, Crown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const LeaderboardTab = () => {
    const { user } = useAuth();

    const { data: rankings, isLoading, error } = useQuery({
        queryKey: ["rankings"],
        queryFn: fetchParticipantRankings,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <p className="text-xs font-medium text-gray-500">Loading leaderboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 text-gray-500">
                <p>Failed to load rankings. Please try again.</p>
            </div>
        );
    }

    if (!rankings || rankings.length === 0) {
        return (
            <div className="text-center py-20 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm font-medium">No rankings available yet</p>
            </div>
        );
    }

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
        if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
        return null;
    };

    const getRankStyle = (rank: number) => {
        if (rank === 1) return "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-amber-100";
        if (rank === 2) return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
        if (rank === 3) return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200";
        return "bg-white border-gray-100";
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const [visibleCount, setVisibleCount] = React.useState(10);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 rounded-full mb-4">
                    <Trophy className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-bold text-amber-800">Sadhana Leaderboard</span>
                </div>
                <p className="text-xs text-gray-500">Based on average daily scores this month</p>
            </div>

            {/* Top 3 Podium */}
            {rankings.length >= 3 && (
                <div className="flex items-end justify-center gap-4 mb-8">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center">
                        <Avatar className="h-16 w-16 border-4 border-gray-300 shadow-lg">
                            <AvatarImage src={rankings[1]?.profile_photo_url || undefined} />
                            <AvatarFallback className="bg-gray-100 text-gray-600 font-bold">
                                {getInitials(rankings[1]?.full_name || "?")}
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-200 w-20 h-16 rounded-t-lg mt-2 flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-600">2</span>
                        </div>
                        <p className="text-xs font-medium text-gray-700 mt-2 text-center max-w-[80px] truncate">
                            {rankings[1]?.full_name}
                        </p>
                        <p className="text-xs text-gray-500">{(rankings[1]?.avg_total_score || 0).toFixed(1)} pts</p>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center -mt-4">
                        <Crown className="h-8 w-8 text-amber-500 mb-1" />
                        <Avatar className="h-20 w-20 border-4 border-amber-400 shadow-xl">
                            <AvatarImage src={rankings[0]?.profile_photo_url || undefined} />
                            <AvatarFallback className="bg-amber-100 text-amber-700 font-bold text-lg">
                                {getInitials(rankings[0]?.full_name || "?")}
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-gradient-to-b from-amber-400 to-amber-500 w-24 h-24 rounded-t-lg mt-2 flex items-center justify-center shadow-lg">
                            <span className="text-3xl font-black text-white">1</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 mt-2 text-center max-w-[100px] truncate">
                            {rankings[0]?.full_name}
                        </p>
                        <p className="text-sm font-semibold text-amber-600">{(rankings[0]?.avg_total_score || 0).toFixed(1)} pts</p>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                        <Avatar className="h-16 w-16 border-4 border-orange-300 shadow-lg">
                            <AvatarImage src={rankings[2]?.profile_photo_url || undefined} />
                            <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                                {getInitials(rankings[2]?.full_name || "?")}
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-gradient-to-b from-orange-200 to-orange-300 w-20 h-12 rounded-t-lg mt-2 flex items-center justify-center">
                            <span className="text-2xl font-bold text-orange-700">3</span>
                        </div>
                        <p className="text-xs font-medium text-gray-700 mt-2 text-center max-w-[80px] truncate">
                            {rankings[2]?.full_name}
                        </p>
                        <p className="text-xs text-gray-500">{(rankings[2]?.avg_total_score || 0).toFixed(1)} pts</p>
                    </div>
                </div>
            )}

            {/* Full Rankings List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">All Rankings</h3>
                    <span className="text-[10px] font-bold text-gray-400">{rankings.length} Participants</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {rankings.slice(0, visibleCount).map((participant) => {
                        const isCurrentUser = participant.participant_id === user?.user_id;
                        return (
                            <div
                                key={participant.participant_id}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 transition-colors",
                                    getRankStyle(participant.rank),
                                    isCurrentUser && "ring-2 ring-inset ring-blue-400"
                                )}
                            >
                                {/* Rank */}
                                <div className="w-10 flex items-center justify-center">
                                    {getRankIcon(participant.rank) || (
                                        <span className="text-sm font-bold text-gray-400">#{participant.rank}</span>
                                    )}
                                </div>

                                {/* Avatar */}
                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                    <AvatarImage src={participant.profile_photo_url || undefined} />
                                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-medium">
                                        {getInitials(participant.full_name)}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-sm font-medium truncate",
                                        participant.rank <= 3 ? "text-gray-800" : "text-gray-700",
                                        isCurrentUser && "text-blue-700"
                                    )}>
                                        {participant.full_name}
                                        {isCurrentUser && <span className="ml-2 text-xs text-blue-500">(You)</span>}
                                    </p>
                                </div>

                                {/* Score */}
                                <div className="text-right">
                                    <p className={cn(
                                        "text-sm font-bold",
                                        participant.rank === 1 ? "text-amber-600" :
                                            participant.rank === 2 ? "text-gray-600" :
                                                participant.rank === 3 ? "text-orange-600" : "text-gray-500"
                                    )}>
                                        {(participant.avg_total_score || 0).toFixed(1)}
                                    </p>
                                    <p className="text-[10px] text-gray-400">avg pts</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {visibleCount < rankings.length && (
                    <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex justify-center">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 10)}
                            className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                        >
                            View More
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaderboardTab;
