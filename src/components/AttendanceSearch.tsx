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

interface AttendanceSearchProps {
  onParticipantSelect: (participant: Participant) => void;
}

const fetchParticipants = async (query: string): Promise<Participant[]> => {
  if (!query) return [];
  const response = await fetch(
    `https://das-backend-o43a.onrender.com/participants/search?query=${encodeURIComponent(query)}`,
  );
  if (!response.ok) {
    throw new Error("Failed to search for participants");
  }
  return response.json();
};

const AttendanceSearch: React.FC<AttendanceSearchProps> = ({
  onParticipantSelect,
}) => {
  const [query, setQuery] = React.useState("");
  const { data: participants, isLoading } = useQuery<Participant[], Error>({
    queryKey: ["participantsSearch", query],
    queryFn: () => fetchParticipants(query),
    enabled: query.length > 0,
  });

  return (
    <Command className="rounded-lg border shadow-md" shouldFilter={false}>
      <CommandInput
        placeholder="Search by name or phone..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading ? (
          <CommandEmpty>Searching...</CommandEmpty>
        ) : participants && participants.length > 0 ? (
          participants.map((participant) => (
            <CommandItem
              key={participant.id}
              onSelect={() => {
                onParticipantSelect(participant);
                setQuery(""); // Clear search after selection
              }}
              className="cursor-pointer"
            >
              <div>
                <p className="font-medium">{participant.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {participant.phone || "No phone number"}
                </p>
              </div>
            </CommandItem>
          ))
        ) : (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
      </CommandList>
    </Command>
  );
};

export default AttendanceSearch;