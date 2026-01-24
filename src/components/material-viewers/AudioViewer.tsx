import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";

interface AudioViewerProps {
  url: string;
  title: string;
  description?: string;
  onComplete?: () => void;
  isCompleted?: boolean;
  onClose?: () => void;
}

const AudioViewer: React.FC<AudioViewerProps> = ({
  url,
  title,
  description,
  onComplete,
  isCompleted = false,
  onClose,
}) => {
  const [hasListened, setHasListened] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      // Consider "listened" when 75% complete
      if (duration > 0 && currentTime / duration >= 0.75) {
        setHasListened(true);
      }
    }
  };

  const handleMarkComplete = () => {
    onComplete?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="border rounded-lg p-6 bg-muted/20">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3z" />
              </svg>
            </div>
          </div>

          <audio
            ref={audioRef}
            controls
            className="w-full"
            onTimeUpdate={handleTimeUpdate}
          >
            <source src={url} />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>

      {onComplete && (
        <div className="flex items-center justify-between">
          {isCompleted ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>Completed</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {hasListened
                ? "You've listened to most of the audio. Mark as complete to continue."
                : "Listen to the audio to mark it complete."}
            </p>
          )}

          {!isCompleted && (
            <Button
              onClick={handleMarkComplete}
              disabled={!hasListened}
              variant={hasListened ? "default" : "secondary"}
            >
              Mark as Complete
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioViewer;
