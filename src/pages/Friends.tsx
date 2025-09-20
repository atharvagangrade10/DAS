import React from 'react';
import DevoteeFriendsDropdown from '@/components/DevoteeFriendsDropdown';

const Friends = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Friends Page</h1>
      <p className="text-lg text-gray-700 mb-6">Content for managing friends will go here.</p>
      
      <div className="max-w-md">
        <DevoteeFriendsDropdown />
      </div>
    </div>
  );
};

export default Friends;