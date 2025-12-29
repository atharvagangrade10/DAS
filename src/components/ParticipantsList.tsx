"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ParticipantDetailsDialog from "./ParticipantDetailsDialog";
import { API_BASE_URL } from "@/config/api";
import { Participant } from "@/types/participant";

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
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { data, isLoading, error } = useQuery<Participant[], Error>({
    queryKey: ["participants", devoteeFriendName],
    queryFn: () => fetchParticipantsByDevoteeFriend(devoteeFriendName),
    enabled: !!devoteeFriendName,
  });

  React.useEffect(() => {
    if (error) {
      toast.error("Error loading participants", {
        description: error.message,
      });
    }
  }, [error]);

  const handleViewDetails = (id: string) => {
    setSelectedId(id);
    setIsDialogOpen(true);
  };

  if (!devoteeFriendName) {
    return <p className="text-gray-500">Please select a devotee friend to see their participants.</p>;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Participants for {devoteeFriendName}</h2>
        <Badge variant="outline">{data.length} Total</Badge>
      </div>
      
      <div className="grid gap-3">
        {data.map((participant) => (
          <Card key={participant.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 border">
                {participant.profile_photo_url ? (
                  <AvatarImage src={participant.profile_photo_url} alt={participant.full_name} className="object-cover" />
                ) : null}
                <AvatarFallback><User className="h-5 w-5 text-muted-foreground" /></AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold truncate">{participant.full_name}</p>
                <p className="text-xs text-muted-foreground">{participant.phone}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => handleViewDetails(participant.id)}
            >
              <Eye className="h-4 w-4" />
              View Details
            </Button>
          </Card>
        ))}
      </div>

      <ParticipantDetailsDialog 
        participantId={selectedId} 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </div>
  );
};

// Simple Badge component if not imported from shadcn
const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: string }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${variant === "outline" ? "border border-gray-300" : "bg-primary text-primary-foreground"}`}>
    {children}
  </span>
);

export default ParticipantsList;