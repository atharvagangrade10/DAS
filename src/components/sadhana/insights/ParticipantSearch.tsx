"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Command,
    CommandInput,
    CommandList,
    CommandItem,
    CommandEmpty,
} from "@/components/ui/command";
import { Participant } from "@/types/participant";
import { fetchParticipants } from "@/utils/api";
import { Loader2, User, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ParticipantSearchProps {
    onSelect: (participant: Participant | null) => void;
    selectedParticipantId: string | undefined;
    currentUserId: string;
    compact?: boolean;
}

const ParticipantSearch: React.FC<ParticipantSearchProps> = ({
    onSelect,
    selectedParticipantId,
    currentUserId,
    compact = false,
}) => {
    const [query, setQuery] = React.useState("");
    const [isOpen, setIsOpen] = React.useState(false);

    // Debounce logic could be added here, but for now relying on fetchParticipants which is called on render if we just pass query directly? 
    // actually useQuery will handle caching, but we should debounce the input to avoid too many requests. 
    // For simplicity matching AttendanceSearch pattern which passes query directly to key.

    const { data: participants, isLoading } = useQuery<Participant[], Error>({
        queryKey: ["participantsSearch", query],
        queryFn: () => fetchParticipants(query),
        enabled: query.length > 2, // Search only after 3 chars
        staleTime: 60 * 1000,
    });

    const handleSelect = (participant: Participant) => {
        onSelect(participant);
        setIsOpen(false);
        setQuery("");
    }

    const handleClear = () => {
        onSelect(null); // Revert to "My Insights" (current user)
        setQuery("");
    }

    // If a participant is selected (and it's not the current user), show their name and a clear button
    // In compact mode, we might just show an icon or a smaller indicator?
    // For now, let's keep the standard view for "selected" state even in compact mode IF it's popped over?
    // actually rework to just return a trigger if compact.

    if (compact) {
        // If compact, we render a button that toggles an absolute positioned search box
        // But for simplicity/time, let's just make it a small icon that expands on click?
        // Or better yet, just return the search icon button that expands the input.

        // If viewing someone, show a small pill
        if (selectedParticipantId && selectedParticipantId !== currentUserId) {
            return (
                <div className="flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1.5 animate-in fade-in zoom-in">
                    <User className="h-4 w-4 text-stone-500" />
                    <span className="text-xs font-bold text-stone-600">Viewing Participant</span>
                    <button onClick={handleClear} className="bg-stone-200 rounded-full p-0.5 hover:bg-stone-300 transition-colors">
                        <X className="h-3 w-3 text-stone-500" />
                    </button>
                </div>
            )
        }

        return (
            <div className="relative z-50">
                {!isOpen ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(true)}
                        className="h-9 w-9 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-50"
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                ) : (
                    <div className="absolute right-0 top-0 w-64 bg-white rounded-xl shadow-xl border border-stone-100 p-1 animate-in fade-in slide-in-from-right-4">
                        <div className="relative">
                            <input
                                autoFocus
                                className="w-full h-9 pl-3 pr-8 rounded-lg bg-stone-50 text-sm focus:outline-none placeholder:text-stone-400"
                                placeholder="Search..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onBlur={(e) => {
                                    // Delay hiding to allow click on results
                                    setTimeout(() => {
                                        if (!query) setIsOpen(false);
                                    }, 200);
                                }}
                            />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute right-2 top-2 text-stone-400 hover:text-stone-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {/* Results Dropdown (Simplified duplicated logic for compact) */}
                        {query.length > 0 && (
                            <div className="mt-1 max-h-48 overflow-y-auto">
                                {isLoading ? (
                                    <div className="p-2 text-center text-xs text-stone-400">Loading...</div>
                                ) : participants?.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelect(p)}
                                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-stone-50 text-left rounded-lg"
                                    >
                                        <div className="h-6 w-6 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500">
                                            {p.full_name?.charAt(0)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold text-stone-700 truncate">{p.full_name}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (selectedParticipantId && selectedParticipantId !== currentUserId) {
        return (
            <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                    <div className="bg-stone-100 p-2 rounded-full">
                        <User className="h-5 w-5 text-stone-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Viewing Insights For</p>
                        <p className="font-bold text-stone-800">Participant ID: {selectedParticipantId.slice(0, 8)}...</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClear} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <X className="h-4 w-4 mr-2" />
                    Clear
                </Button>
            </div>
        )
    }

    return (
        <div className="relative mb-8 z-50">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <input
                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all placeholder:text-stone-400"
                    placeholder="Search participant by name or phone..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setIsOpen(false); }}
                        className="absolute right-3 top-3 text-stone-300 hover:text-stone-500"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {isOpen && query.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden max-h-[300px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 flex items-center justify-center gap-2 text-stone-400 text-xs">
                            <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                        </div>
                    ) : participants && participants.length > 0 ? (
                        <div className="py-2">
                            {participants.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelect(p)}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-stone-50 transition-colors text-left"
                                >
                                    <Avatar className="h-8 w-8 border border-stone-100">
                                        <AvatarImage src={p.profile_photo_url || undefined} />
                                        <AvatarFallback className="text-[10px] bg-stone-100 text-stone-500">
                                            {p.full_name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold text-stone-700">{p.full_name}</p>
                                        <p className="text-[10px] text-stone-400 font-medium">{p.phone}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-xs text-stone-400">
                            {query.length < 3 ? "Type at least 3 characters..." : "No participants found."}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ParticipantSearch;
