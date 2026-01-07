"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchBatchAttendance } from "@/utils/api";
import { Batch } from "@/types/batch";
import { Participant } from "@/types/participant";

interface BatchAttendanceHistoryDialogProps {
  batch: Batch;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
}

interface AttendanceRecord {
  participant_id: string;
  date: string;
  status: string;
  marked_by?: string;
}

const BatchAttendanceHistoryDialog: React.FC<BatchAttendanceHistoryDialogProps> = ({
  batch,
  isOpen,
  onOpenChange,
  participants,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  // Get all days in the current month for the calendar view
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Fetch attendance data for all days in the current month
  const { data: attendanceData = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["batchAttendanceHistory", batch.id, format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      if (!isOpen || !batch.id) return [];

      const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
      });

      const attendancePromises = daysInMonth.map(async (day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        try {
          const dailyAttendance = await fetchBatchAttendance(batch.id, dateStr);
          // Add the date to each record for easier grouping later
          return dailyAttendance.map((record: any) => ({ ...record, date: dateStr }));
        } catch (error) {
          console.error(`Failed to fetch attendance for ${dateStr}:`, error);
          return [];
        }
      });

      const allDailyAttendance = await Promise.all(attendancePromises);
      return allDailyAttendance.flat(); // Flatten the array of arrays into a single array
    },
    enabled: isOpen,
  });

  // Group attendance by date for easier access
  const attendanceByDate = React.useMemo(() => {
    const grouped: Record<string, AttendanceRecord[]> = {};
    attendanceData.forEach(record => {
      const dateStr = record.date;
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(record);
    });
    return grouped;
  }, [attendanceData]);

  // Get attendance for selected date
  const selectedDateAttendance = React.useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return attendanceByDate[dateStr] || [];
  }, [selectedDate, attendanceByDate]);

  // Find participant by ID
  const findParticipant = (id: string) => {
    return participants.find(p => p.id === id);
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Reset selected date when month changes
  React.useEffect(() => {
    setSelectedDate(null);
  }, [currentMonth]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Calendar className="h-6 w-6 text-primary" />
            Attendance History: {batch.name}
          </DialogTitle>
          <DialogDescription>
            View and manage attendance records for this class.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Calendar View */}
          <div className="w-full md:w-1/2 border-r p-4">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day, index) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayAttendance = attendanceByDate[dateStr] || [];
                const presentCount = dayAttendance.filter(a => a.status === "Present").length;
                // const totalCount = dayAttendance.length; // Not currently used, but useful for future enhancements
                
                const isSelected = selectedDate && isSameDay(selectedDate, day);
                const isCurrentMonthDay = isSameMonth(day, currentMonth);
                
                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-10 w-10 p-0 text-xs relative",
                      !isCurrentMonthDay && "text-muted-foreground opacity-50",
                      isSelected && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedDate(day)}
                    disabled={!isCurrentMonthDay}
                  >
                    <span className="absolute top-0.5 right-0.5 text-[8px] font-bold">
                      {presentCount > 0 ? presentCount : ""}
                    </span>
                    {format(day, "d")}
                  </Button>
                );
              })}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              <p>Click on a date to view detailed attendance records.</p>
            </div>
          </div>

          {/* Attendance Details */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold">
                {selectedDate 
                  ? `Attendance for ${format(selectedDate, "PPP")}` 
                  : "Select a date to view attendance"}
              </h3>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              {selectedDate ? (
                isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <p>Loading attendance data...</p>
                  </div>
                ) : selectedDateAttendance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Participant</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDateAttendance.map((record) => {
                        const participant = findParticipant(record.participant_id);
                        return (
                          <TableRow key={`${record.participant_id}-${record.date}`}>
                            <TableCell>
                              <div className="font-medium">
                                {participant?.full_name || "Unknown Participant"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {participant?.phone}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={record.status === "Present" ? "default" : "secondary"}
                                className={cn(
                                  record.status === "Present" ? "bg-green-500" : "bg-red-500",
                                  "text-white"
                                )}
                              >
                                {record.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <p>No attendance records found for this date.</p>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-32">
                  <p>Select a date from the calendar to view attendance details.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter className="p-6 pt-3 border-t">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchAttendanceHistoryDialog;