"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  UserPlus,
  Loader2,
  ChevronRight,
  Trash2, // Import Trash2 icon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Batch } from "@/types/batch";
import { Participant } from "@/types/participant";
import {
  fetchBatchParticipants,
  addParticipantToBatch,
  fetchParticipants,
  fetchParticipantById,
  removeParticipantFromBatch, // Import the new API function
  fetchBatchVolunteers, // Import fetchBatchVolunteers
} from "@/utils/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, // Import AlertDialog components
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";

interface ParticipantsTabContentProps {
  batch: Batch;
  isOpen: boolean;
  readOnly?: boolean;
}

const ParticipantsTabContent: React.FC<ParticipantsTabContentProps> = ({ batch, isOpen, readOnly = false }) => {

  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [participantIdToRemove, setParticipantIdToRemove] = React.useState<string | null>(null);

  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  const isVolunteer = user?.role === 'Volunteer';

  // Fetch assigned volunteers to determine if the current user is one
  const { data: batchVolunteers } = useQuery({
    queryKey: ["batchVolunteers", batch.id],
    queryFn: () => fetchBatchVolunteers(batch.id),
    enabled: isOpen,
  });

  const isAssignedVolunteer = React.useMemo(() => {
    if (!user || !batchVolunteers) return false;
    return batchVolunteers.some(v => v.participant_id === user.user_id);
  }, [user, batchVolunteers]);

  // 1. Fetch Current Participants
  const { data: currentMappings, isLoading: isLoadingMappings } = useQuery({
    queryKey: ["batchParticipants", batch.id],
    queryFn: () => fetchBatchParticipants(batch.id),
    enabled: isOpen,
  });

  // 2. Fetch Detailed Participant Profiles for the mappings
  const { data: participants, isLoading: isLoadingParticipants } = useQuery<
    Participant[]
  >({
    queryKey: ["batchParticipantDetails", batch.id, currentMappings?.length],
    queryFn: async () => {
      if (!currentMappings) return [];
      const promises = currentMappings.map((m) =>
        fetchParticipantById(m.participant_id)
      );
      return Promise.all(promises);
    },
    enabled: !!currentMappings,
  });

  // 3. Search for Global Participants to Add
  const { data: searchResults, isLoading: isSearching } = useQuery<Participant[]>({
    queryKey: ["participantSearch", searchQuery],
    queryFn: () => fetchParticipants(searchQuery),
    enabled: searchQuery.length >= 3,
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: (pId: string) => addParticipantToBatch(batch.id, pId),
    onSuccess: () => {
      toast.success("Participant added to class!");
      queryClient.invalidateQueries({ queryKey: ["batchParticipants", batch.id] });
      queryClient.invalidateQueries({ queryKey: ["batchParticipantDetails", batch.id] }); // Invalidate details as well
      setSearchQuery("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (pId: string) => removeParticipantFromBatch(batch.id, pId),
    onSuccess: () => {
      toast.success("Participant removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["batchParticipants", batch.id] });
      queryClient.invalidateQueries({ queryKey: ["batchParticipantDetails", batch.id] }); // Invalidate details as well
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleRemoveClick = (participantId: string) => {
    setParticipantIdToRemove(participantId);
    setIsDeleteDialogOpen(true);
  };

  const confirmRemove = () => {
    if (participantIdToRemove) {
      removeMutation.mutate(participantIdToRemove);
      setIsDeleteDialogOpen(false);
      setParticipantIdToRemove(null);
    }
  };

  const isAlreadyInBatch = (participantId: string) => {
    return participants?.some((cp) => cp.id === participantId);
  };

  const canManageParticipants = isManager || (isVolunteer && isAssignedVolunteer); // Control access based on role and assignment

  return (
    <div className="space-y-6">
      {/* Search & Add Section */}
      {!readOnly && canManageParticipants && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Add Participants
          </h4>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone (min 3 chars)..."
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
                  const isAlreadyIn = isAlreadyInBatch(p.id);
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
                        variant={isAlreadyIn ? "ghost" : "outline"}
                        disabled={isAlreadyIn || addMutation.isPending}
                        onClick={() => addMutation.mutate(p.id)}
                      >
                        {isAlreadyIn ? "Added" : "Add"}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No participants found.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Current List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Registered Participants</h4>
          <Badge variant="secondary">{participants?.length || 0} Total</Badge>
        </div>
        <ScrollArea className="h-[300px] border rounded-lg">
          <div className="grid gap-2 p-2">
            {isLoadingParticipants ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 w-full bg-muted animate-pulse rounded-lg"
                />
              ))
            ) : participants && participants.length > 0 ? (
              participants.map((p) => {
                const isCurrentlyAssigned = isAssignedVolunteer && isAlreadyInBatch(p.id); // Check if current user is assigned and this participant is in the batch

                return (
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
                    <div className="flex items-center gap-2">
                      {isManager && ( // Only managers can remove participants
                        <>
                          <AlertDialog open={isDeleteDialogOpen && participantIdToRemove === p.id} onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) setParticipantIdToRemove(null);
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                                onClick={() => setParticipantIdToRemove(p.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Participant?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {p.full_name} from this class? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmRemove} disabled={removeMutation.isPending}>
                                  {removeMutation.isPending ? "Removing..." : "Remove"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">
                  No participants added to this class yet.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ParticipantsTabContent;