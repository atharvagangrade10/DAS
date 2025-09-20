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
    `http://127.0.0.1:8000/participants/search?query=${encodeURIComponent(query)}`,
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
    <Command className="rounded-lg border shadow-md">
      <CommandInput
        placeholder="Search by name or phone..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? "Searching..." : "No results found."}
        </CommandEmpty>
        {participants?.map((participant) => (
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
        ))}
      </CommandList>
    </Command>
  );
};

export default AttendanceSearch;