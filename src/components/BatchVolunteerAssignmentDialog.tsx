"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, UserMinus, Loader2, Users, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Batch, BatchVolunteer } from "@/types/batch";
import { Participant } from "@/types/participant";
import {
  fetchBatchVolunteers,
  assignVolunteerToBatch,
  removeVolunteerFromBatch,
  fetchParticipants, // For searching potential volunteers
  fetchParticipantById, // To get full participant info for assigned volunteers
} from "@/utils/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BatchVolunteerAssignmentDialogProps {
  batch: Batch;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BatchVolunteerAssignmentDialog: React.FC<BatchVolunteerAssignmentDialogProps> = ({
  batch,
  isOpen,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState("");

  // 1. Fetch currently assigned volunteers for this batch
  const { data: assignedVolunteers = [], isLoading: isLoadingAssigned } = useQuery<BatchVolunteer[]>({
    queryKey: ["batchVolunteers", batch.id],
    queryFn: () => fetchBatchVolunteers(batch.id),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // 2. Fetch full participant details for assigned volunteers
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

  // 3. Search for potential volunteers (participants with role 'Volunteer')
  const { data: searchResults, isLoading: isSearching } = useQuery<Participant[]>({
    queryKey: ["volunteerSearch", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 3) return [];
      const results = await fetchParticipants(searchQuery);
      // Filter results to only include participants with role 'Volunteer'
      return results.filter(p => p.role === 'Volunteer');
    },
    enabled: searchQuery.length >= 3,
  });

  // Mutations for assigning/removing volunteers
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

  const isAssigned = (participantId: string) => {
    return assignedVolunteers.some(v => v.participant_id === participantId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6 text-primary" />
            Assign Volunteers: {batch.name}
          </DialogTitle>
          <DialogDescription>
            Manage which volunteers can mark attendance for this class.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search & Assign Section */}
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
                    const alreadyAssigned = isAssigned(p.id);
                    return (
                      <div
                        key={p.id}
                        className="p-3 flex items-center justify-between hover:bg-background transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border">
                            {p.profile_photo_url ? (
                              <AvatarImage src={p.profile_photo_url} alt={p.full_name} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {p.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{p.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.phone}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={alreadyAssigned ? "ghost" : "outline"}
                          disabled={alreadyAssigned || assignMutation.isPending}
                          onClick={() => assignMutation.mutate(p.id)}
                        >
                          {alreadyAssigned ? (
                            <><CheckCircle2 className="h-4 w-4 mr-1" /> Assigned</>
                          ) : (
                            <><UserPlus className="h-4 w-4 mr-1" /> Assign</>
                          )}
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No volunteer participants found matching your search.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Assigned Volunteers List */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> Assigned Volunteers
              </h4>
              <Badge variant="secondary">{assignedVolunteers.length} Total</Badge>
            </div>
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="grid gap-2 p-2">
                {isLoadingAssigned || isLoadingAssignedDetails ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 w-full bg-muted animate-pulse rounded-lg" />
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
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {p.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{p.full_name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {p.phone}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={removeMutation.isPending}
                        onClick={() => removeMutation.mutate(p.id)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" /> Unassign
                      </Button>
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

        <DialogFooter className="p-6 pt-3 border-t">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchVolunteerAssignmentDialog;