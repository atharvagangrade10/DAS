"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Re-import the mobile-specific components to render them within the dialog for capture
import MobileProgramAttendance from "./MobileProgramAttendance";
import MobileDevoteeFriendAttendance from "./MobileDevoteeFriendAttendance";
import MobileSessionDistributionByProgram from "./MobileSessionDistributionByProgram";
import MobileSessionDistributionByDevoteeFriend from "./MobileSessionDistributionByDevoteeFriend";
import MobileStatCard from "./MobileStatCard"; // Import the new component

interface SessionData {
  name: string;
  date: string;
  count: number;
}

interface ProgramAttendanceData {
  program_name: string;
  sessions: SessionData[];
}

interface DistributionItem {
  numSessions: number;
  count: number;
}

interface ProgramDistributionData {
  programId: string;
  programName: string;
  distribution: DistributionItem[];
}

interface DevoteeFriendDistributionData {
  devoteeFriendName: string;
  distribution: DistributionItem[];
}

interface ProgramDataForDfAttendance {
  program_name: string;
  sessions: SessionData[];
}

interface DevoteeFriendAttendanceData {
  devoteeFriendName: string;
  programs: ProgramDataForDfAttendance[];
}

interface ExportImagesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalParticipants: number;
  totalDevoteeFriends: number;
  participantsWithoutDevoteeFriend: number;
  programSessionAttendance: ProgramAttendanceData[];
  devoteeFriendProgramSessionAttendance: DevoteeFriendAttendanceData[];
  sessionAttendanceDistribution: {
    globalByProgram: ProgramDistributionData[];
    byDevoteeFriend: DevoteeFriendDistributionData[];
  };
}

interface CapturedImage {
  id: string;
  title: string;
  dataUrl: string;
  fileName: string;
}

const ExportImagesDialog: React.FC<ExportImagesDialogProps> = ({
  isOpen,
  onOpenChange,
  totalParticipants,
  totalDevoteeFriends,
  participantsWithoutDevoteeFriend,
  programSessionAttendance,
  devoteeFriendProgramSessionAttendance,
  sessionAttendanceDistribution,
}) => {
  const [capturedImages, setCapturedImages] = React.useState<CapturedImage[]>([]);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const isMobile = useIsMobile(); // This hook is not used in the hidden section, but kept for context if needed elsewhere.

  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const hiddenDfAttendanceContainerRef = React.useRef<HTMLDivElement | null>(null);
  const hiddenProgramAttendanceContainerRef = React.useRef<HTMLDivElement | null>(null);
  const hiddenGlobalDistContainerRef = React.useRef<HTMLDivElement | null>(null);
  const hiddenDfDistContainerRef = React.useRef<HTMLDivElement | null>(null);

  const captureElement = async (element: HTMLElement, title: string, fileName: string) => {
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2, // Increase scale for better resolution
          useCORS: true, // Enable CORS for images if any
          logging: false,
          backgroundColor: element.style.backgroundColor || window.getComputedStyle(element).backgroundColor, // Ensure background is captured
        });
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9); // Export as JPEG
        return { id: element.id || title.replace(/\s/g, "_").toLowerCase(), title, dataUrl, fileName: `${fileName}.jpg` };
      } catch (error) {
        console.error(`Failed to capture element for "${title}":`, error);
        toast.error(`Failed to capture image for "${title}"`, {
          description: "Please try again.",
        });
        return null;
      }
    }
    return null;
  };

  const handleCaptureAll = React.useCallback(async () => {
    if (!isOpen) return;

    setIsCapturing(true);
    setCapturedImages([]); // Clear previous images

    const newCapturedImages: CapturedImage[] = [];

    // Capture static cards using the new MobileStatCard
    const staticCardConfigs = [
      { id: "totalParticipants", title: "Total Participants", value: totalParticipants, description: "Current number of registered participants.", fileName: "total_participants" },
      { id: "totalDevoteeFriends", title: "Total Devotee Friends", value: totalDevoteeFriends, description: "Number of registered devotee friends.", fileName: "total_devotee_friends" },
      { id: "participantsWithoutDevoteeFriend", title: "Participants Without Devotee Friend", value: participantsWithoutDevoteeFriend, description: "Participants not associated with a devotee friend.", fileName: "participants_without_df" },
    ];

    for (const config of staticCardConfigs) {
      const captured = await captureElement(cardRefs.current[config.id]!, config.title, config.fileName);
      if (captured) {
        newCapturedImages.push(captured);
      }
    }

    // Capture Program and Session Attendance Overview (using MobileProgramAttendance)
    if (hiddenProgramAttendanceContainerRef.current) {
      const programAttendanceCards = hiddenProgramAttendanceContainerRef.current.querySelectorAll('.shadow-sm');
      for (const cardElement of Array.from(programAttendanceCards)) {
        const titleElement = cardElement.querySelector('.text-lg.font-semibold');
        const programName = titleElement ? titleElement.textContent : 'Program Attendance';
        const captured = await captureElement(cardElement as HTMLElement, programName!, `program_attendance_${programName?.replace(/\s/g, "_").toLowerCase()}`);
        if (captured) {
          newCapturedImages.push(captured);
        }
      }
    }

    // Capture Devotee Friend Session Attendance (individual cards from MobileDevoteeFriendAttendance)
    if (hiddenDfAttendanceContainerRef.current) {
      const dfCards = hiddenDfAttendanceContainerRef.current.querySelectorAll('.shadow-sm');
      for (const cardElement of Array.from(dfCards)) {
        const titleElement = cardElement.querySelector('.text-lg.font-semibold');
        const devoteeFriendName = titleElement ? titleElement.textContent : 'Devotee Friend Attendance';
        const captured = await captureElement(cardElement as HTMLElement, devoteeFriendName!, `df_attendance_${devoteeFriendName?.replace(/\s/g, "_").toLowerCase()}`);
        if (captured) {
          newCapturedImages.push(captured);
        }
      }
    }

    // Capture Session Attendance Distribution by Program (individual cards from MobileSessionDistributionByProgram)
    if (hiddenGlobalDistContainerRef.current) {
      const globalDistCards = hiddenGlobalDistContainerRef.current.querySelectorAll('.shadow-sm');
      for (const cardElement of Array.from(globalDistCards)) {
        const titleElement = cardElement.querySelector('.text-lg.font-semibold');
        const programName = titleElement ? titleElement.textContent : 'Program Distribution';
        const captured = await captureElement(cardElement as HTMLElement, programName!, `session_dist_program_${programName?.replace(/\s/g, "_").toLowerCase()}`);
        if (captured) {
          newCapturedImages.push(captured);
        }
      }
    }

    // Capture Session Attendance Distribution by Devotee Friend (individual cards from MobileSessionDistributionByDevoteeFriend)
    if (hiddenDfDistContainerRef.current) {
      const dfDistCards = hiddenDfDistContainerRef.current.querySelectorAll('.shadow-sm');
      for (const cardElement of Array.from(dfDistCards)) {
        const titleElement = cardElement.querySelector('.text-lg.font-semibold');
        const devoteeFriendName = titleElement ? titleElement.textContent : 'Devotee Friend Distribution';
        const captured = await captureElement(cardElement as HTMLElement, devoteeFriendName!, `session_dist_df_${devoteeFriendName?.replace(/\s/g, "_").toLowerCase()}`);
        if (captured) {
          newCapturedImages.push(captured);
        }
      }
    }

    setCapturedImages(newCapturedImages);
    setIsCapturing(false);
  }, [isOpen, totalParticipants, totalDevoteeFriends, participantsWithoutDevoteeFriend, programSessionAttendance, devoteeFriendProgramSessionAttendance, sessionAttendanceDistribution]);

  React.useEffect(() => {
    if (isOpen && !isCapturing && capturedImages.length === 0) {
      // Delay capture slightly to ensure all hidden elements are fully rendered
      const timer = setTimeout(() => {
        handleCaptureAll();
      }, 100); 
      return () => clearTimeout(timer);
    }
  }, [isOpen, isCapturing, capturedImages.length, handleCaptureAll]);

  const handleDownloadImage = (dataUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Image downloaded successfully!");
  };

  const handleShareToWhatsApp = async (dataUrl: string, title: string, fileName: string) => {
    if (navigator.share) {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: "image/jpeg" });

        await navigator.share({
          files: [file],
          title: title,
          text: `Check out this statistic from DAS: ${title}`,
        });
        toast.success("Image shared successfully!");
      } catch (error) {
        console.error("Error sharing image:", error);
        if ((error as DOMException).name === "AbortError") {
          toast.info("Sharing cancelled.");
        } else {
          toast.error("Failed to share image directly.", {
            description: "Your browser might not support direct image sharing to WhatsApp. Please download and share manually.",
          });
        }
      }
    } else {
      toast.error("Web Share API not supported", {
        description: "Your browser does not support direct sharing. Please download the image and share manually.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Statistics as Images</DialogTitle>
          <DialogDescription>
            Generate images of your statistical cards for easy sharing and download.
          </DialogDescription>
        </DialogHeader>

        {isCapturing ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold">Generating images...</p>
            <p className="text-sm text-muted-foreground">This might take a moment.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0"> {/* Added min-h-0 here */}
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                {capturedImages.length > 0 ? (
                  capturedImages.map((image) => (
                    <Card key={image.id} className="shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg">{image.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center">
                        <img src={image.dataUrl} alt={image.title} className="max-w-full h-auto border rounded-md mb-4" />
                        <div className="flex gap-2">
                          <Button onClick={() => handleDownloadImage(image.dataUrl, image.fileName)} variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Download
                          </Button>
                          <Button onClick={() => handleShareToWhatsApp(image.dataUrl, image.title, image.fileName)} className="bg-green-500 hover:bg-green-600 text-white">
                            <Share2 className="mr-2 h-4 w-4" /> Share
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-10">No images generated. Try again.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Hidden elements for capturing */}
        <div className="absolute -left-[9999px] -top-[9999px] w-[1200px] p-6 bg-background"> {/* Increased width for better capture, added bg-background */}
          <MobileStatCard
            id="totalParticipants"
            title="Total Participants"
            value={totalParticipants}
            description="Current number of registered participants."
            ref={(el) => (cardRefs.current["totalParticipants"] = el)}
          />

          <MobileStatCard
            id="totalDevoteeFriends"
            title="Total Devotee Friends"
            value={totalDevoteeFriends}
            description="Number of registered devotee friends."
            className="mt-6" // Apply margin for spacing
            ref={(el) => (cardRefs.current["totalDevoteeFriends"] = el)}
          />

          <MobileStatCard
            id="participantsWithoutDevoteeFriend"
            title="Participants Without Devotee Friend"
            value={participantsWithoutDevoteeFriend}
            description="Participants not associated with a devotee friend."
            className="mt-6" // Apply margin for spacing
            ref={(el) => (cardRefs.current["participantsWithoutDevoteeFriend"] = el)}
          />

          {/* Render MobileProgramAttendance for capture */}
          <div ref={hiddenProgramAttendanceContainerRef} className="mt-6" id="hidden-program-attendance-container">
            <MobileProgramAttendance data={programSessionAttendance} />
          </div>

          {/* Render MobileDevoteeFriendAttendance for capture */}
          <div ref={hiddenDfAttendanceContainerRef} className="mt-6" id="hidden-devotee-friend-attendance-container">
            <MobileDevoteeFriendAttendance data={devoteeFriendProgramSessionAttendance} />
          </div>

          {/* Render MobileSessionDistributionByProgram for capture */}
          <div ref={hiddenGlobalDistContainerRef} className="mt-6" id="hidden-session-dist-program-container">
            <MobileSessionDistributionByProgram data={sessionAttendanceDistribution.globalByProgram} />
          </div>

          {/* Render MobileSessionDistributionByDevoteeFriend for capture */}
          <div ref={hiddenDfDistContainerRef} className="mt-6" id="hidden-session-dist-df-container">
            <MobileSessionDistributionByDevoteeFriend data={sessionAttendanceDistribution.byDevoteeFriend} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportImagesDialog;