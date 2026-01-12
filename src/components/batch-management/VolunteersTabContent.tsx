"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, Loader2, CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Batch, BatchVolunteer } from "@/types/batch";
import { Participant } from "@/types/participant";
import { fetchBatchVolunteers, fetchParticipantById, fetchParticipants, assignVolunteerToBatch, removeVolunteerFromBatch } from "@/utils/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface VolunteersTabContentProps {
  batch: Batch;
  isOpen: boolean;
  onOpenVolunteerAssignmentDialog: () => void;
}

const VolunteersTabContent: React.FC<VolunteersTabContentProps> = ({
  batch,
  isOpen,
  onOpenVolunteerAssignmentDialog,
}) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState("");

  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  const isVolunteer = user?.role === 'Volunteer';

  // 1. Fetch Currently Assigned Volunteers
  const { data: assignedVolunteers = [], isLoading: isLoadingAssigned } = useQuery<BatchVolunteer[]>({
    queryKey: ["batchVolunteers", batch.id],
    queryFn: () => fetchBatchVolunteers(batch.id),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // 2. Fetch Full Participant Details for Assigned Volunteers
  const { data: assignedVolunteerDetails, isLoading: isLoadingAssignedDetails } = useQuery<Participant[]>({
    queryKey: ["assignedVolunteerDetails", batch.id, assignedVolunteers.map(v => v.participant_id).join('-')],
    queryFn: async () => {
      if (assignedVolunteers.length === 0) return [];
      const promises = assignedVolunteers.map(v => fetchParticipantById(v.participant_id));
      return Promise.all(promises);
    },
    enabled: !!assignedVolunteers && assignedVolunteers.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // 3. Search for Potential Volunteers (Participants who are Volunteers but not yet assigned)
  const { data: searchResults, isLoading: isSearching } = useQuery<Participant[]>({
    queryKey: ["potentialVolunteers", batch.id, searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 3) return [];
      const allParticipants = await fetchParticipants(searchQuery);
      // Filter results to only include participants who are Volunteers AND not already assigned
      return allParticipants.filter(p => p.role === 'Volunteer' && !assignedVolunteers.some(v => v.participant_id === p.id));
    },
    enabled: (searchQuery.length >= 3 && isOpen),
  });

  // Mutations
  const assignMutation = useMutation({
    mutationFn: (participantId: string) => assignVolunteerToBatch(batch.id, participantId),
    onSuccess: () => {
      toast.success("Volunteer assigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["batchVolunteers", batch.id] });
      queryClient.invalidateQueries({ queryKey: ["assignedVolunteerDetails", batch.id] });
      setSearchQuery(""); // Clear search after assignment
    },
    onError: (error: Error) => {
      toast.error("Failed to assign volunteer", { description: error.message });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (participantId: string) => removeVolunteerFromBatch(batch.id, participantId),
    onSuccess: () => {
      toast.success("Volunteer unassigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["batchVolunteers", batch.id] });
      queryClient.invalidateQueries({ queryKey: ["assignedVolunteerDetails", batch.id] });
    },
    onError: (error: Error) => {
      toast.error("Failed to unassign volunteer", { description: error.message });
    },
  });

  const isAlreadyAssigned = (participantId: string) => {
    return assignedVolunteers.some(v => v.participant_id === participantId);
  };

  const canManageVolunteers = isManager; // Only managers can manage volunteers

  return (
    <div className="space-y-6">
      {/* Search & Assign Section */}
      {canManageVolunteers && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Find & Assign Volunteers
          </h4>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search volunteers by name or phone (min 3 chars)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchQuery.length >= 3 && (
            <div className="border rounded-lg bg-muted/30 divide-y overflow-hidden">
              {isSearching ? (
                <div className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((p) => {
                  const alreadyAssigned = isAlreadyAssigned(p.id);
                  return (
                    <div
                      key={p.id}
                      className="p-3 flex items-center justify-between hover:bg-background transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.phone}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyAssigned ? "ghost" : "outline"}
                        disabled={alreadyAssigned || assignMutation.isPending}
                        onClick={() => assignMutation.mutate(p.id)}
                      >
                        {alreadyAssigned ? "Assigned" : "Assign"}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No available volunteers found.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Assigned Volunteers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Assigned Volunteers</h4>
          <Badge variant="secondary">{assignedVolunteerDetails?.length || 0} Total</Badge>
        </div>
        <ScrollArea className="h-[300px] border rounded-lg">
          <div className="grid gap-2 p-2">
            {isLoadingAssigned || isLoadingAssignedDetails ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 w-full bg-muted animate-pulse rounded-lg"
                />
              ))
            ) : assignedVolunteerDetails && assignedVolunteerDetails.length > 0 ? (
              assignedVolunteerDetails.map((p) => (
                <div
                  key={p.id}
                  className="p-3 flex items-center justify-between border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border">
                      {p.profile_photo_url ? (
                        <AvatarImage src={p.profile_photo_url} alt={p.full_name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {p.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{p.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.phone}</p>
                    </div>
                  </div>
                  {canManageVolunteers && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeMutation.mutate(p.id)}
                      disabled={removeMutation.isPending}
                      className="gap-1"
                    >
                      <Loader2 className={cn("h-3 w-3 animate-spin", removeMutation.isPending ? "inline" : "hidden")} />
                      <Trash2 className={cn("h-4 w-4", removeMutation.isPending ? "hidden" : "inline")} />
                      Unassign
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">
                  No volunteers assigned to this class yet.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default VolunteersTabContent;