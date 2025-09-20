"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import PhoneDialer from "./PhoneDialer";
import EditParticipantDialog from "./EditParticipantDialog";

interface Participant {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  age: number | null;
  gender: string;
  devotee_friend_name: string;
}

interface ParticipantCardProps {
  participant: Participant;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant }) => {
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
      <CardContent className="grid gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Phone:</p>
          <PhoneDialer phoneNumber={participant.phone} participantName={participant.full_name} />
        </div>
        <p><strong>Address:</strong> {participant.address || "N/A"}</p>
        <p><strong>Age:</strong> {participant.age || "N/A"}</p>
        <p><strong>Gender:</strong> {participant.gender || "N/A"}</p>
        <p><strong>Devotee Friend:</strong> {participant.devotee_friend_name || "None"}</p>
      </CardContent>

      <EditParticipantDialog
        participant={participant}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </Card>
  );
};

export default ParticipantCard;