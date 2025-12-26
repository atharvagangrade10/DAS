"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ParticipantCard from "./ParticipantCard"; // Import the new ParticipantCard
import { API_BASE_URL } from "@/config/api";

interface Participant {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  age: number | null;
  gender: string;
  devotee_friend_name: string;
}

interface ParticipantsListProps {
  devoteeFriendName: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('das_auth_token');
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const fetchParticipantsByDevoteeFriend = async (devoteeFriendName: string): Promise<Participant[]> => {
  const encodedName = encodeURIComponent(devoteeFriendName);
  const response = await fetch(`${API_BASE_URL}/participants/by-devotee-friend/${encodedName}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch participants' }));
    throw new Error(errorData.detail || "Failed to fetch participants");
  }
  return response.json();
};

const ParticipantsList: React.FC<ParticipantsListProps> = ({ devoteeFriendName }) => {
  const { data, isLoading, error } = useQuery<Participant[], Error>({
    queryKey: ["participants", devoteeFriendName],
    queryFn: () => fetchParticipantsByDevoteeFriend(devoteeFriendName),
    enabled: !!devoteeFriendName, // Only run query if devoteeFriendName is provided
  });

  React.useEffect(() => {
    if (error) {
      toast.error("Error loading participants", {
        description: error.message,
      });
    }
  }, [error]);

  if (!devoteeFriendName) {
    return <p className="text-gray-500">Please select a devotee friend to see their participants.</p>;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Error: {error.message}</p>;
  }

  if (!data || data.length === 0) {
    return <p className="text-gray-500">No participants found for {devoteeFriendName}.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Participants for {devoteeFriendName}</h2>
      {data.map((participant) => (
        <ParticipantCard key={participant.id} participant={participant} />
      ))}
    </div>
  );
};

export default ParticipantsList;