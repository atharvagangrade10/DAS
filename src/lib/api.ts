import { Image } from "./types";

// Mock function to simulate fetching image data
export const getStatsImages = async (): Promise<Image[]> => {
  // In a real application, this would fetch data from your backend.
  // For now, we'll return some dummy data.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: "1", name: "Total Participants", url: "/placeholder.svg" },
        { id: "2", name: "Total Devotee Friends", url: "/placeholder.svg" },
        { id: "3", name: "Participants Without Devotee Friend", url: "/placeholder.svg" },
        { id: "4", name: "Program Attendance Overview", url: "/placeholder.svg" },
        { id: "5", name: "Devotee Friend Attendance", url: "/placeholder.svg" },
        { id: "6", name: "Session Distribution by Program", url: "/placeholder.svg" },
        { id: "7", name: "Session Distribution by Devotee Friend", url: "/placeholder.svg" },
      ]);
    }, 500); // Simulate network delay
  });
};