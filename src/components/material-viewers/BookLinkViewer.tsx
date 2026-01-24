import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, BookOpen, X } from "lucide-react";
import { MaterialContent } from "@/types/course";

interface BookLinkViewerProps {
  content: MaterialContent;
  title: string;
  description?: string;
  onComplete?: () => void;
  isCompleted?: boolean;
  onClose?: () => void;
}

const BookLinkViewer: React.FC<BookLinkViewerProps> = ({
  content,
  title,
  description,
  onComplete,
  isCompleted = false,
  onClose,
}) => {
  const url = content.url;

  const handleOpenLink = () => {
    window.open(url, "_blank", "noopener,noreferrer");
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

      <div className="border rounded-lg p-8 bg-muted/20">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h4 className="text-lg font-semibold">{content.title || "External Resource"}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Click the button below to open this resource in a new tab.
            </p>
          </div>
          <Button onClick={handleOpenLink} size="lg" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Open Resource
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Link: <span className="font-mono text-xs">{url}</span>
        </div>

        {onComplete && (
          <>
            {isCompleted ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span>Completed</span>
              </div>
            ) : (
              <Button onClick={handleMarkComplete}>
                Mark as Complete
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookLinkViewer;
