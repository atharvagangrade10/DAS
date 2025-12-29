"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fetchParticipantById } from "@/utils/api";
import { Participant } from "@/types/participant";
import ParticipantCard from "./ParticipantCard";
import { Loader2 } from "lucide-react";

interface ParticipantDetailsDialogProps {
  participantId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ParticipantDetailsDialog: React.FC<ParticipantDetailsDialogProps> = ({
  participantId,
  isOpen,
  onOpenChange,
}) => {
  const { data: participant, isLoading, error } = useQuery<Participant, Error>({
    queryKey: ["participant", participantId],
    queryFn: () => fetchParticipantById(participantId!),
    enabled: !!participantId && isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Participant Profile</DialogTitle>
          <DialogDescription>
            Detailed information for the selected participant.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 pt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Fetching details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error loading participant details.</p>
              <p className="text-xs">{error.message}</p>
            </div>
          ) : participant ? (
            <div className="border rounded-lg overflow-hidden">
              <ParticipantCard participant={participant} />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantDetailsDialog;