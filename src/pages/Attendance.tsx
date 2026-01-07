"use client";

import React from 'react';
import AttendanceSearch from '@/components/AttendanceSearch';
import MarkAttendanceCard from '@/components/MarkAttendanceCard';
import ParticipantCard from '@/components/ParticipantCard';
import CreateParticipantDialog from '@/components/CreateParticipantDialog';
import { Participant } from '@/types/participant';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

const Attendance = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'Manager';
  const queryClient = useQueryClient();
  const [selectedParticipant, setSelectedParticipant] = React.useState<Participant | null>(null);
  const [isCreateParticipantDialogOpen, setIsCreateParticipantDialogOpen] = React.useState(false);

  const handleAttendanceMarked = (participantId: string) => {
    queryClient.invalidateQueries({ queryKey: ["attendedPrograms", participantId] });
  };

  const handleParticipantUpdate = (updatedParticipant: Participant | null) => {
    setSelectedParticipant(updatedParticipant); // Update the selected participant with new data or null if deleted
  };

  const handleParticipantCreationSuccess = (newParticipant: Participant) => {
    setSelectedParticipant(newParticipant);
    setIsCreateParticipantDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-6 sm:p-8 space-y-8 text-left">
      <div>
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Attendance Tracking</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl">
          Search for a participant to mark their attendance for a program session or view/edit their details.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 max-w-md">
        <div className="flex-1 text-left">
          <AttendanceSearch onParticipantSelect={setSelectedParticipant} />
        </div>
        {isManager && (
          <Button onClick={() => setIsCreateParticipantDialogOpen(true)} className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Add New Participant
          </Button>
        )}
      </div>


      {selectedParticipant && (
        <>
          <div className="max-w-md">
            <ParticipantCard
              participant={selectedParticipant}
              onParticipantUpdate={handleParticipantUpdate}
            />
          </div>
          <div className="max-w-md">
            <MarkAttendanceCard
              participant={selectedParticipant}
              onAttendanceMarked={handleAttendanceMarked}
            />
          </div>
        </>
      )}

      <CreateParticipantDialog
        isOpen={isCreateParticipantDialogOpen}
        onOpenChange={setIsCreateParticipantDialogOpen}
        onCreationSuccess={handleParticipantCreationSuccess}
      />
    </div>
  );
};

export default Attendance;