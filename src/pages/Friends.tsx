import React from 'react';
import DevoteeFriendsDropdown from '@/components/DevoteeFriendsDropdown';
import ParticipantsList from '@/components/ParticipantsList';

const Friends = () => {
  const [selectedDevoteeFriendName, setSelectedDevoteeFriendName] = React.useState<string | null>(null);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Friends Page</h1>
      <p className="text-lg text-gray-700 mb-6">Manage your devotee friends and their associated participants.</p>
      
      <div className="max-w-md mb-8">
        <DevoteeFriendsDropdown onSelectFriend={setSelectedDevoteeFriendName} />
      </div>

      {selectedDevoteeFriendName && (
        <div className="max-w-2xl">
          <ParticipantsList devoteeFriendName={selectedDevoteeFriendName} />
        </div>
      )}
    </div>
  );
};

export default Friends;