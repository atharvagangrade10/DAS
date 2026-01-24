import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentViewerProps {
  url: string;
  title: string;
  description?: string;
  onComplete?: () => void;
  isCompleted?: boolean;
  onClose?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  url,
  title,
  description,
  onComplete,
  isCompleted = false,
  onClose,
}) => {
  const [loadError, setLoadError] = useState(false);

  const handleDownload = () => {
    window.open(url, "_blank");
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

      <div className="border rounded-lg overflow-hidden bg-muted/20">
        {!loadError ? (
          <iframe
            src={url}
            className="w-full h-[600px]"
            title={title}
            onError={() => setLoadError(true)}
          />
        ) : (
          <div className="h-[600px] flex flex-col items-center justify-center p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Unable to preview the document. You can download it to view.
            </p>
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Document
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>

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

export default DocumentViewer;
