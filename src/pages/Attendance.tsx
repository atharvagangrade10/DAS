import React from 'react';
import AttendanceSearch from '@/components/AttendanceSearch';
import MarkAttendanceCard from '@/components/MarkAttendanceCard';
import { Participant } from '@/types/participant';

const Attendance = () => {
  const [selectedParticipant, setSelectedParticipant] = React.useState<Participant | null>(null);

  const handleAttendanceMarked = () => {
    setSelectedParticipant(null);
  };

  return (
    <div className="container mx-auto p-6 sm:p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">Attendance Tracking</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl">
          Search for a participant to mark their attendance for a program session.
        </p>
      </div>

      <div className="max-w-md">
        <AttendanceSearch onParticipantSelect={setSelectedParticipant} />
      </div>

      {selectedParticipant && (
        <div className="max-w-md">
          <MarkAttendanceCard 
            participant={selectedParticipant} 
            onAttendanceMarked={handleAttendanceMarked} 
          />
        </div>
      )}
    </div>
  );
};

export default Attendance;