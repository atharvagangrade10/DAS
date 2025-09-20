"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DevoteeFriend {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface DevoteeFriendsDropdownProps {
  onSelectFriend: (friendName: string | null) => void;
}

const fetchDevoteeFriends = async (): Promise<DevoteeFriend[]> => {
  const response = await fetch("http://127.0.0.1:8000/register/devoteefriends");
  if (!response.ok) {
    throw new Error("Failed to fetch devotee friends");
  }
  return response.json();
};

const DevoteeFriendsDropdown: React.FC<DevoteeFriendsDropdownProps> = ({ onSelectFriend }) => {
  const { data, isLoading, error } = useQuery<DevoteeFriend[], Error>({
    queryKey: ["devoteeFriends"],
    queryFn: fetchDevoteeFriends,
  });

  React.useEffect(() => {
    if (error) {
      toast.error("Error loading devotee friends", {
        description: error.message,
      });
    }
  }, [error]);

  const handleValueChange = (value: string) => {
    const selectedFriend = data?.find(friend => friend.id === value);
    onSelectFriend(selectedFriend ? selectedFriend.name : null);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="devotee-friends">Devotee Friends</Label>
        <Select disabled>
          <SelectTrigger id="devotee-friends">
            <SelectValue placeholder="Loading friends..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label htmlFor="devotee-friends">Devotee Friends</Label>
        <Select disabled>
          <SelectTrigger id="devotee-friends" className="border-red-500">
            <SelectValue placeholder="Error loading friends" />
          </SelectTrigger>
        </Select>
        <p className="text-sm text-red-500">Could not load friends: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="devotee-friends">Select a Devotee Friend</Label>
      <Select onValueChange={handleValueChange}>
        <SelectTrigger id="devotee-friends" className="w-[280px]">
          <SelectValue placeholder="Select a friend" />
        </SelectTrigger>
        <SelectContent>
          {data?.map((friend) => (
            <SelectItem key={friend.id} value={friend.id}>
              {friend.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DevoteeFriendsDropdown;