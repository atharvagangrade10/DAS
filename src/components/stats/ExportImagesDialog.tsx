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

// Re-import the mobile-specific components to render them within the dialog for capture
import MobileProgramAttendance from "./MobileProgramAttendance";
import MobileDevoteeFriendAttendance from "./MobileDevoteeFriendAttendance";
import MobileStatCard from "./MobileStatCard";

interface SessionData {
  name: string;
  date: string;
  count: number;
}

interface ProgramAttendanceData {
  program_name: string;
  sessions: SessionData[];
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
}) => {
  const [capturedImages, setCapturedImages] = React.useState<CapturedImage[]>([]);
  const [isCapturing, setIsCapturing] = React.useState(false);

  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const hiddenDfAttendanceContainerRef = React.useRef<HTMLDivElement | null>(null);
  const hiddenProgramAttendanceContainerRef = React.useRef<HTMLDivElement | null>(null);

  const captureElement = async (element: HTMLElement, title: string, fileName: string) => {
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: element.style.backgroundColor || window.getComputedStyle(element).backgroundColor,
        });
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
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
    setCapturedImages([]);

    const newCapturedImages: CapturedImage[] = [];

    const staticCardConfigs = [
      { id: "totalParticipants", title: "Total Participants", value: totalParticipants, description: "Current number of registered participants.", fileName: "total_participants" },
      { id: "totalDevoteeFriends", title: "Total Devotee Friends", value: totalDevoteeFriends, description: "Number of registered devotee friends.", fileName: "total_devotee_friends" },
      { id: "participantsWithoutDevoteeFriend", title: "Participants Without Devotee Friend", value: participantsWithoutDevoteeFriend, description: "Participants not associated with a devotee friend.", fileName: "participants_without_df" },
    ];

    for (const config of staticCardConfigs) {
      const captured = await captureElement(cardRefs.current[config.id]!, config.title, config.fileName);
      if (captured) newCapturedImages.push(captured);
    }

    if (hiddenProgramAttendanceContainerRef.current) {
      const cards = hiddenProgramAttendanceContainerRef.current.querySelectorAll('.shadow-sm');
      for (const card of Array.from(cards)) {
        const title = card.querySelector('.text-lg.font-semibold')?.textContent || 'Program Attendance';
        const captured = await captureElement(card as HTMLElement, title, `program_attendance_${title.replace(/\s/g, "_").toLowerCase()}`);
        if (captured) newCapturedImages.push(captured);
      }
    }

    if (hiddenDfAttendanceContainerRef.current) {
      const cards = hiddenDfAttendanceContainerRef.current.querySelectorAll('.shadow-sm');
      for (const card of Array.from(cards)) {
        const title = card.querySelector('.text-lg.font-semibold')?.textContent || 'DF Attendance';
        const captured = await captureElement(card as HTMLElement, title, `df_attendance_${title.replace(/\s/g, "_").toLowerCase()}`);
        if (captured) newCapturedImages.push(captured);
      }
    }

    setCapturedImages(newCapturedImages);
    setIsCapturing(false);
  }, [isOpen, totalParticipants, totalDevoteeFriends, participantsWithoutDevoteeFriend, programSessionAttendance, devoteeFriendProgramSessionAttendance]);

  React.useEffect(() => {
    if (isOpen && !isCapturing && capturedImages.length === 0) {
      const timer = setTimeout(() => handleCaptureAll(), 100);
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
  };

  const handleDownloadAll = () => {
    if (capturedImages.length === 0) {
      toast.info("No images to download.");
      return;
    }
    capturedImages.forEach((image, index) => {
      setTimeout(() => handleDownloadImage(image.dataUrl, image.fileName), index * 300);
    });
    toast.success(`Downloading ${capturedImages.length} images...`);
  };

  const handleShareAll = async () => {
    if (capturedImages.length === 0) {
      toast.info("No images to share.");
      return;
    }

    const files: File[] = [];
    for (const image of capturedImages) {
      const response = await fetch(image.dataUrl);
      const blob = await response.blob();
      files.push(new File([blob], image.fileName, { type: "image/jpeg" }));
    }

    if (navigator.canShare && navigator.canShare({ files })) {
      try {
        await navigator.share({
          files: files,
          title: "DAS Statistics",
          text: "Here are the latest statistics from DAS.",
        });
        toast.success("All images shared successfully!");
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          toast.error("Failed to share all images.");
        } else {
          toast.info("Sharing cancelled.");
        }
      }
    } else {
      toast.error("Sharing all images at once is not supported on your browser.", {
        description: "Please share images one by one using the buttons below.",
      });
    }
  };

  const handleShareSingle = async (dataUrl: string, title: string, fileName: string) => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: "image/jpeg" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: `DAS Statistic: ${title}`,
        });
      } else {
        toast.error("Sharing is not supported on your browser.");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        toast.error("Failed to share image.");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2">
            <div>
              <DialogTitle>Export Statistics as Images</DialogTitle>
              <DialogDescription>
                Download or share the generated images below.
              </DialogDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={handleDownloadAll} variant="outline" disabled={isCapturing || capturedImages.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Download All
              </Button>
              <Button onClick={handleShareAll} className="bg-green-500 hover:bg-green-600 text-white" disabled={isCapturing || capturedImages.length === 0}>
                <Share2 className="mr-2 h-4 w-4" /> Share All
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isCapturing ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold">Generating images...</p>
            <p className="text-sm text-muted-foreground">This might take a moment.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
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
                          <Button onClick={() => handleShareSingle(image.dataUrl, image.title, image.fileName)} className="bg-green-500 hover:bg-green-600 text-white">
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

        <div className="absolute -left-[9999px] -top-[9999px] w-[600px] p-6 bg-background">
          <div className="space-y-6">
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
              ref={(el) => (cardRefs.current["totalDevoteeFriends"] = el)}
            />
            <MobileStatCard
              id="participantsWithoutDevoteeFriend"
              title="Participants Without Devotee Friend"
              value={participantsWithoutDevoteeFriend}
              description="Participants not associated with a devotee friend."
              ref={(el) => (cardRefs.current["participantsWithoutDevoteeFriend"] = el)}
            />
            <div ref={hiddenProgramAttendanceContainerRef}>
              <MobileProgramAttendance data={programSessionAttendance} />
            </div>
            <div ref={hiddenDfAttendanceContainerRef}>
              <MobileDevoteeFriendAttendance data={devoteeFriendProgramSessionAttendance} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportImagesDialog;