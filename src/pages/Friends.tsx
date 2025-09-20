import React from 'react';
import DevoteeFriendsDropdown from '@/components/DevoteeFriendsDropdown';
import ParticipantsList from '@/components/ParticipantsList';

const Friends = () => {
  const [selectedDevoteeFriendName, setSelectedDevoteeFriendName] = React.useState<string | null>(null);

  return (
    <div className="container mx-auto p-6 sm:p-8"> {/* Increased padding */}
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Friends Management</h1> {/* Larger title */}
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl"> {/* Adjusted margin and max-width */}
        Select a devotee friend from the dropdown to view and manage their associated participants.
      </p>
      
      <div className="max-w-md mb-10"> {/* Increased margin-bottom */}
        <DevoteeFriendsDropdown onSelectFriend={setSelectedDevoteeFriendName} />
      </div>

      {selectedDevoteeFriendName && (
        <div className="max-w-3xl mt-8"> {/* Increased max-width and margin-top */}
          <ParticipantsList devoteeFriendName={selectedDevoteeFriendName} />
        </div>
      )}
    </div>
  );
};

export default Friends;