"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, User } from "lucide-react";
import PhoneDialer from "./PhoneDialer";
import EditParticipantDialog from "./EditParticipantDialog";
import { Participant } from "@/types/participant";
import AttendedProgramsList from "./AttendedProgramsList";
import { format, parseISO, isValid } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";

interface ParticipantCardProps {
  participant: Participant;
  onParticipantUpdate?: (updatedParticipant: Participant | null) => void;
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

const deleteParticipant = async (participantId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/participants/${participantId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete participant' }));
    throw new Error(errorData.detail || "Failed to delete participant");
  }
};

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, onParticipantUpdate }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteParticipant,
    onSuccess: () => {
      toast.success("Participant deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["participantsSearch"] });
      queryClient.invalidateQueries({ queryKey: ["allParticipants"] });
      if (onParticipantUpdate) {
        onParticipantUpdate(null);
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to delete participant", {
        description: error.message,
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(participant.id);
  };

  const formattedDob = React.useMemo(() => {
    if (!participant.dob) return "N/A";
    const date = parseISO(participant.dob);
    return isValid(date) ? format(date, "PPP") : "N/A";
  }, [participant.dob]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col">
          <CardTitle className="text-2xl font-semibold">{participant.full_name}</CardTitle>
          {participant.initiated_name && (
            <p className="text-sm font-medium text-primary/80 italic">({participant.initiated_name})</p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
            <span className="sr-only">Edit participant</span>
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200">
                <Trash2 className="h-5 w-5" />
                <span className="sr-only">Delete participant</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the participant{" "}
                  <span className="font-semibold">{participant.full_name}</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        <div className="flex items-center gap-2">
          <p className="font-medium min-w-[120px]">Phone:</p>
          <PhoneDialer phoneNumber={participant.phone} participantName={participant.full_name} />
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium min-w-[120px]">Email:</p>
          <p className="text-gray-700 dark:text-gray-300 truncate">{participant.email || "N/A"}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium min-w-[120px]">Profession:</p>
          <p className="text-gray-700 dark:text-gray-300">{participant.profession || "N/A"}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium min-w-[120px]">Date of Birth:</p>
          <p className="text-gray-700 dark:text-gray-300">{formattedDob}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium min-w-[120px]">Place Name:</p>
          <p className="text-gray-700 dark:text-gray-300">{participant.place_name || "N/A"}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium min-w-[120px]">Address:</p>
          <p className="text-gray-700 dark:text-gray-300">{participant.address || "N/A"}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium min-w-[120px]">Age / Gender:</p>
          <p className="text-gray-700 dark:text-gray-300">
            {participant.age || "N/A"} / {participant.gender || "N/A"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium min-w-[120px]">Devotee Friend:</p>
          <p className="text-gray-700 dark:text-gray-300">{participant.devotee_friend_name || "None"}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium min-w-[120px]">Chanting Rounds:</p>
          <p className="text-gray-700 dark:text-gray-300 font-semibold">{participant.chanting_rounds ?? "N/A"}</p>
        </div>
        
        <AttendedProgramsList participantId={participant.id} />
      </CardContent>

      <EditParticipantDialog
        participant={participant}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdateSuccess={onParticipantUpdate}
      />
    </Card>
  );
};

export default ParticipantCard;