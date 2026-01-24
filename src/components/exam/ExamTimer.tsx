import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";
import { Exam } from "@/types/course";

interface ExamTimerProps {
  duration: number; // in minutes
  startedAt: string;
  onTimeUp: () => void;
  examName: string;
}

const ExamTimer: React.FC<ExamTimerProps> = ({ duration, startedAt, onTimeUp, examName }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    // Calculate initial time remaining
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const start = new Date(startedAt).getTime();
      const elapsed = now - start;
      const totalMs = duration * 60 * 1000;
      return Math.max(0, totalMs - elapsed);
    };

    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Show warning when less than 5 minutes
      if (remaining <= 5 * 60 * 1000 && remaining > 0) {
        setIsWarning(true);
      }

      // Auto-submit when time is up
      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, startedAt, onTimeUp]);

  // Format time as MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // Calculate percentage for progress bar
  const totalMs = duration * 60 * 1000;
  const percentage = ((totalMs - timeRemaining) / totalMs) * 100;

  // Check if less than 1 minute
  const isCritical = timeRemaining <= 60 * 1000;

  return (
    <Card className={`${isCritical ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className={`h-4 w-4 ${isCritical ? "text-red-600 animate-pulse" : ""}`} />
            <span className="font-medium">{examName}</span>
          </div>
          <div className={`text-2xl font-mono font-bold ${isCritical ? "text-red-600" : isWarning ? "text-orange-600" : ""}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>

        <Progress value={percentage} className="h-2" />

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Time remaining</span>
          {isCritical && (
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <AlertTriangle className="h-3 w-3" />
              Less than 1 minute!
            </span>
          )}
          {isWarning && !isCritical && (
            <span className="text-orange-600 font-medium">
              Less than 5 minutes remaining
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamTimer;
