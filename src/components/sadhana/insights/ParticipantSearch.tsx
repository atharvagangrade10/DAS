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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

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
    const isMobile = useIsMobile();

    const { data: participants, isLoading } = useQuery<Participant[], Error>({
        queryKey: ["participantsSearch", query],
        queryFn: () => fetchParticipants(query),
        enabled: query.length > 2,
        staleTime: 60 * 1000,
    });

    const handleSelect = (participant: Participant) => {
        onSelect(participant);
        setIsOpen(false);
        setQuery("");
    };

    const handleClear = () => {
        onSelect(null);
        setQuery("");
    };

    // Selected View (When a participant is selected and it's not the current user)
    if (selectedParticipantId && selectedParticipantId !== currentUserId) {
        if (compact) {
            return (
                <div className="flex items-center gap-2 bg-stone-100 rounded-full px-3 py-1.5 animate-in fade-in zoom-in">
                    <User className="h-4 w-4 text-stone-500" />
                    <span className="text-xs font-bold text-stone-600">Viewing Participant</span>
                    <button onClick={handleClear} className="bg-stone-200 rounded-full p-0.5 hover:bg-stone-300 transition-colors">
                        <X className="h-3 w-3 text-stone-500" />
                    </button>
                </div>
            );
        }

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
        );
    }

    // Search Trigger (Input or Button)
    const SearchTrigger = compact ? (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-9 w-9 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-50"
        >
            <Search className="h-4 w-4" />
        </Button>
    ) : (
        <div className="relative cursor-pointer" onClick={() => setIsOpen(true)}>
            <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
            <div className="w-full h-10 pl-10 pr-4 flex items-center rounded-xl border border-stone-200 bg-white text-sm text-stone-400">
                Search participant by name or phone...
            </div>
        </div>
    );

    // Search Content
    const SearchContent = (
        <div className="flex flex-col h-full">
            <div className="relative p-2 border-b">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                    autoFocus
                    className="w-full h-10 pl-9 pr-4 rounded-lg bg-stone-50 text-sm focus:outline-none placeholder:text-stone-400"
                    placeholder="Search participant..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-stone-400 text-xs">
                        <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                    </div>
                ) : query.length > 2 ? (
                    participants && participants.length > 0 ? (
                        <div className="space-y-1">
                            {participants.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleSelect(p)}
                                    className="w-full px-3 py-2 flex items-center gap-3 hover:bg-stone-50 transition-colors text-left rounded-lg group"
                                >
                                    <Avatar className="h-8 w-8 border border-stone-100 group-hover:border-stone-200">
                                        <AvatarImage src={p.profile_photo_url || undefined} />
                                        <AvatarFallback className="text-[10px] bg-stone-100 text-stone-500">
                                            {p.full_name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-stone-700 truncate">{p.full_name}</p>
                                        <p className="text-[10px] text-stone-400 font-medium truncate">{p.phone}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-xs text-stone-400">
                            No participants found.
                        </div>
                    )
                ) : (
                    <div className="p-8 text-center text-xs text-stone-400">
                        Type at least 3 characters to search...
                    </div>
                )}
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    {SearchTrigger}
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] p-0 rounded-t-[28px]">
                    <SheetHeader className="p-4 pb-2 border-b">
                        <SheetTitle className="text-center text-base">Select Participant</SheetTitle>
                    </SheetHeader>
                    {SearchContent}
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {SearchTrigger}
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start" side="bottom">
                {SearchContent}
            </PopoverContent>
        </Popover>
    );
};

export default ParticipantSearch;
