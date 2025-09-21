"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import PhoneDialer from "./PhoneDialer";
import EditParticipantDialog from "./EditParticipantDialog";
import { Participant } from "@/types/participant"; // Import Participant type
import AttendedProgramsList from "./AttendedProgramsList"; // Import new component

interface ParticipantCardProps {
  participant: Participant;
  onParticipantUpdate?: (updatedParticipant: Participant) => void; // New prop
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, onParticipantUpdate }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-semibold">{participant.full_name}</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
          <Pencil className="h-5 w-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
          <span className="sr-only">Edit participant</span>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        <div className="flex items-center gap-2">
          <p className="font-medium">Phone:</p>
          <PhoneDialer phoneNumber={participant.phone} participantName={participant.full_name} />
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium">Address:</p>
          <p className="text-gray-700 dark:text-gray-300">{participant.address || "N/A"}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium">Age:</p>
          <p className="text-gray-700 dark:text-gray-300">{participant.age || "N/A"}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium">Gender:</p>
          <p className="text-gray-700 dark:text-gray-300">{participant.gender || "N/A"}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-medium">Devotee Friend:</p>
          <p className="text-gray-700 dark:text-gray-300">{participant.devotee_friend_name || "None"}</p>
        </div>
        
        {/* Attended Programs List */}
        <AttendedProgramsList participantId={participant.id} />
      </CardContent>

      <EditParticipantDialog
        participant={participant}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdateSuccess={onParticipantUpdate} // Pass the callback
      />
    </Card>
  );
};

export default ParticipantCard;