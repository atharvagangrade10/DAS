"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DownloadShareButtonProps {
  cardId: string;
  cardTitle: string;
}

const DownloadShareButton: React.FC<DownloadShareButtonProps> = ({ cardId, cardTitle }) => {
  const [isCapturing, setIsCapturing] = React.useState(false);

  const captureAndProcessCard = async () => {
    setIsCapturing(true);
    const cardElement = document.getElementById(cardId);
    if (!cardElement) {
      toast.error("Error capturing card", {
        description: "Could not find the element to capture.",
      });
      setIsCapturing(false);
      return null;
    }

    try {
      const canvas = await html2canvas(cardElement, {
        useCORS: true, // Important for images loaded from other origins
        scale: 2, // Increase scale for better resolution
      });
      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image", {
        description: "An error occurred while creating the image.",
      });
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = async () => {
    const imageDataUrl = await captureAndProcessCard();
    if (imageDataUrl) {
      const link = document.createElement("a");
      link.href = imageDataUrl;
      link.download = `${cardTitle.replace(/\s/g, "_").toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Image downloaded successfully!");
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      toast.info("Web Share API not supported", {
        description: "Your browser does not support sharing images directly. Please use the download option.",
      });
      return;
    }

    const imageDataUrl = await captureAndProcessCard();
    if (imageDataUrl) {
      try {
        const blob = await (await fetch(imageDataUrl)).blob();
        const file = new File([blob], `${cardTitle.replace(/\s/g, "_").toLowerCase()}.png`, { type: "image/png" });

        await navigator.share({
          files: [file],
          title: cardTitle,
          text: `Check out this statistic from DAS: ${cardTitle}`,
        });
        toast.success("Image shared successfully!");
      } catch (error: any) {
        if (error.name !== "AbortError") { // User cancelled share
          console.error("Error sharing image:", error);
          toast.error("Failed to share image", {
            description: error.message || "An error occurred while sharing.",
          });
        }
      }
    }
  };

  return (
    <div className="flex justify-end gap-2 mt-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isCapturing}
            className="flex items-center gap-1"
          >
            {isCapturing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download this card as an image</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isCapturing}
            className="flex items-center gap-1"
          >
            {isCapturing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            Share
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share this card as an image</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default DownloadShareButton;