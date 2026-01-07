"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Batch, BatchVolunteer } from "@/types/batch";
import { Participant } from "@/types/participant";
import { fetchBatchVolunteers, fetchParticipantById } from "@/utils/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  // 1. Fetch Assigned Volunteers for this batch
  const { data: assignedVolunteers = [], isLoading: isLoadingAssignedVolunteers } = useQuery<BatchVolunteer[]>({
    queryKey: ["batchVolunteers", batch.id],
    queryFn: () => fetchBatchVolunteers(batch.id),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // 2. Fetch full participant details for assigned volunteers
  const { data: assignedVolunteerDetails, isLoading: isLoadingAssignedVolunteerDetails } = useQuery<Participant[]>({
    queryKey: ["assignedVolunteerDetails", batch.id, assignedVolunteers.map(v => v.participant_id).join('-')],
    queryFn: async () => {
      if (assignedVolunteers.length === 0) return [];
      const promises = assignedVolunteers.map(v => fetchParticipantById(v.participant_id));
      return Promise.all(promises);
    },
    enabled: !!assignedVolunteers && assignedVolunteers.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" /> Assigned Volunteers
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenVolunteerAssignmentDialog}
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" /> Manage Volunteers
        </Button>
      </div>
      <ScrollArea className="h-[400px] border rounded-lg">
        <div className="grid gap-2 p-2">
          {isLoadingAssignedVolunteers || isLoadingAssignedVolunteerDetails ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-14 w-full bg-muted animate-pulse rounded-lg" />
            ))
          ) : assignedVolunteerDetails && assignedVolunteerDetails.length > 0 ? (
            assignedVolunteerDetails.map((p) => (
              <div
                key={p.id}
                className="p-3 flex items-center justify-between border rounded-lg bg-background"
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
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Assigned
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">
                No volunteers assigned to this class yet.
              </p>
              <p className="text-xs mt-1">
                Click "Manage Volunteers" to assign them.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default VolunteersTabContent;