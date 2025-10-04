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
import { Download, Share2, Loader2 } from "lucide-react"; // Removed Whatsapp, kept Share2
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
  const isMobile = useIsMobile();

  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const captureCard = async (cardId: string, title: string, fileName: string) => {
    const element = cardRefs.current[cardId];
    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2, // Increase scale for better resolution
          useCORS: true, // Enable CORS for images if any
          logging: false,
        });
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9); // Export as JPEG
        return { id: cardId, title, dataUrl, fileName: `${fileName}.jpg` };
      } catch (error) {
        console.error(`Failed to capture card ${cardId}:`, error);
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

    const cardConfigs = [
      { id: "totalParticipants", title: "Total Participants", fileName: "total_participants" },
      { id: "totalDevoteeFriends", title: "Total Devotee Friends", fileName: "total_devotee_friends" },
      { id: "participantsWithoutDevoteeFriend", title: "Participants Without Devotee Friend", fileName: "participants_without_df" },
      { id: "programSessionAttendance", title: "Program and Session Attendance Overview", fileName: "program_session_attendance" },
      { id: "devoteeFriendSessionAttendance", title: "Devotee Friend Session Attendance", fileName: "devotee_friend_attendance" },
      { id: "globalDistributionByProgram", title: "Overall Distribution by Program", fileName: "distribution_by_program" },
      { id: "byDevoteeFriendDistribution", title: "Distribution by Devotee Friend", fileName: "distribution_by_df" },
    ];

    const newCapturedImages: CapturedImage[] = [];
    for (const config of cardConfigs) {
      const captured = await captureCard(config.id, config.title, config.fileName);
      if (captured) {
        newCapturedImages.push(captured);
      }
    }
    setCapturedImages(newCapturedImages);
    setIsCapturing(false);
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && !isCapturing && capturedImages.length === 0) {
      handleCaptureAll();
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
          <ScrollArea className="flex-1 pr-4">
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
                          <Share2 className="mr-2 h-4 w-4" /> Share to WhatsApp {/* Changed to Share2 */}
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
        )}

        {/* Hidden elements for capturing */}
        <div className="absolute -left-[9999px] -top-[9999px] w-[1200px] p-6"> {/* Increased width for better capture */}
          <Card ref={(el) => (cardRefs.current["totalParticipants"] = el)} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Total Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalParticipants}</div>
              <p className="text-xs text-muted-foreground">
                Current number of registered participants.
              </p>
            </CardContent>
          </Card>

          <Card ref={(el) => (cardRefs.current["totalDevoteeFriends"] = el)} className="shadow-lg mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Total Devotee Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalDevoteeFriends}</div>
              <p className="text-xs text-muted-foreground">
                Number of registered devotee friends.
              </p>
            </CardContent>
          </Card>

          <Card ref={(el) => (cardRefs.current["participantsWithoutDevoteeFriend"] = el)} className="shadow-lg mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Participants Without Devotee Friend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{participantsWithoutDevoteeFriend}</div>
              <p className="text-xs text-muted-foreground">
                Participants not associated with a devotee friend.
              </p>
            </CardContent>
          </Card>

          <Card ref={(el) => (cardRefs.current["programSessionAttendance"] = el)} className="shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Program and Session Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <MobileProgramAttendance data={programSessionAttendance} />
              ) : programSessionAttendance.length > 0 ? (
                <div className="overflow-x-auto"> {/* Use overflow-x-auto for table capture */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Program Name</TableHead>
                        <TableHead>Session Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Attendees</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programSessionAttendance.map((program) => (
                        <React.Fragment key={program.program_name}>
                          {program.sessions.map((session, index) => (
                            <TableRow key={`${program.program_name}-${session.name}-${session.date}`}>
                              {index === 0 && (
                                <TableCell rowSpan={program.sessions.length} className="font-medium align-top">
                                  {program.program_name}
                                </TableCell>
                              )}
                              <TableCell>{session.name}</TableCell>
                              <TableCell>{format(parseISO(session.date), "MMM dd, yyyy")}</TableCell>
                              <TableCell className="text-right">{session.count}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No program or session attendance data available yet.</p>
              )}
            </CardContent>
          </Card>

          <Card ref={(el) => (cardRefs.current["devoteeFriendSessionAttendance"] = el)} className="shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Devotee Friend Session Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <MobileDevoteeFriendAttendance data={devoteeFriendProgramSessionAttendance} />
              ) : devoteeFriendProgramSessionAttendance.length > 0 ? (
                <div className="overflow-x-auto"> {/* Use overflow-x-auto for table capture */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Devotee Friend</TableHead>
                        <TableHead className="w-[200px]">Program Name</TableHead>
                        <TableHead>Session Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Attendees</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devoteeFriendProgramSessionAttendance.map((df) => (
                        <React.Fragment key={df.devoteeFriendName}>
                          {df.programs.length > 0 ? (
                            df.programs.map((program, programIndex) => (
                              <React.Fragment key={`${df.devoteeFriendName}-${program.program_name}`}>
                                {program.sessions.map((session, sessionIndex) => (
                                  <TableRow key={`${df.devoteeFriendName}-${program.program_name}-${session.name}-${session.date}`}>
                                    {programIndex === 0 && sessionIndex === 0 && (
                                      <TableCell rowSpan={df.programs.reduce((acc, p) => acc + p.sessions.length, 0)} className="font-medium align-top">
                                        {df.devoteeFriendName}
                                      </TableCell>
                                    )}
                                    {sessionIndex === 0 && (
                                      <TableCell rowSpan={program.sessions.length} className="font-medium align-top">
                                        {program.program_name}
                                      </TableCell>
                                    )}
                                    <TableCell>{session.name}</TableCell>
                                    <TableCell>{format(parseISO(session.date), "MMM dd, yyyy")}</TableCell>
                                    <TableCell className="text-right">{session.count}</TableCell>
                                  </TableRow>
                                ))}
                              </React.Fragment>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell className="font-medium">{df.devoteeFriendName}</TableCell>
                              <TableCell colSpan={4} className="text-muted-foreground">No program attendance recorded.</TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No devotee friend attendance data available yet.</p>
              )}
            </CardContent>
          </Card>

          <Card ref={(el) => (cardRefs.current["globalDistributionByProgram"] = el)} className="shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Overall Distribution by Program</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <MobileSessionDistributionByProgram data={sessionAttendanceDistribution.globalByProgram} />
              ) : sessionAttendanceDistribution.globalByProgram.length > 0 ? (
                <div className="overflow-x-auto"> {/* Use overflow-x-auto for table capture */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Program Name</TableHead>
                        <TableHead>Sessions Attended</TableHead>
                        <TableHead className="text-right">Participants Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionAttendanceDistribution.globalByProgram.map((programData) => (
                        <React.Fragment key={programData.programId}>
                          {programData.distribution.map((item, index) => (
                            <TableRow key={`${programData.programId}-${item.numSessions}`}>
                              {index === 0 && (
                                <TableCell rowSpan={programData.distribution.length} className="font-medium align-top">
                                  {programData.programName}
                                </TableCell>
                              )}
                              <TableCell>{item.numSessions} session{item.numSessions !== 1 ? "s" : ""}</TableCell>
                              <TableCell className="text-right">{item.count}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-6">No overall session attendance distribution data available.</p>
              )}
            </CardContent>
          </Card>

          <Card ref={(el) => (cardRefs.current["byDevoteeFriendDistribution"] = el)} className="shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-medium">By Devotee Friend (Total Sessions Attended)</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <MobileSessionDistributionByDevoteeFriend data={sessionAttendanceDistribution.byDevoteeFriend} />
              ) : sessionAttendanceDistribution.byDevoteeFriend.length > 0 ? (
                <div className="overflow-x-auto"> {/* Use overflow-x-auto for table capture */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Devotee Friend</TableHead>
                        <TableHead>Total Sessions Attended</TableHead>
                        <TableHead className="text-right">Participants Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionAttendanceDistribution.byDevoteeFriend.map((df) => (
                        <React.Fragment key={df.devoteeFriendName}>
                          {df.distribution.map((item, index) => (
                            <TableRow key={`${df.devoteeFriendName}-${item.numSessions}`}>
                              {index === 0 && (
                                <TableCell rowSpan={df.distribution.length} className="font-medium align-top">
                                  {df.devoteeFriendName}
                                </TableCell>
                              )}
                              <TableCell>{item.numSessions} session{item.numSessions !== 1 ? "s" : ""}</TableCell>
                              <TableCell className="text-right">{item.count}</TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No devotee friend session attendance distribution data available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportImagesDialog;