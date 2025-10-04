"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DownloadShareButtonProps {
  cardId: string;
  cardTitle: string;
  iconOnly?: boolean; // New prop
}

const DownloadShareButton: React.FC<DownloadShareButtonProps> = ({ cardId, cardTitle, iconOnly = false }) => {
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

    // Store original styles
    const originalCardOverflow = cardElement.style.overflow;
    const originalCardHeight = cardElement.style.height;

    // Temporarily modify styles for capture
    cardElement.style.overflow = 'visible';
    cardElement.style.height = 'auto'; // Ensure height adjusts to content

    // Find all open AccordionContent elements within the card and set their overflow to visible
    // The AccordionContent itself has overflow-hidden for animation purposes.
    const accordionContents = cardElement.querySelectorAll('div[data-state="open"].overflow-hidden');
    const originalAccordionOverflows: string[] = [];
    accordionContents.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      originalAccordionOverflows.push(htmlEl.style.overflow);
      htmlEl.style.overflow = 'visible';
    });

    try {
      // Give the browser a moment to apply the style changes before capturing
      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = await html2canvas(cardElement, {
        useCORS: true,
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
      // Revert styles
      cardElement.style.overflow = originalCardOverflow;
      cardElement.style.height = originalCardHeight;
      accordionContents.forEach((el: Element, index) => {
        (el as HTMLElement).style.overflow = originalAccordionOverflows[index];
      });
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
    <div className={cn("flex justify-end gap-2", !iconOnly && "mt-4")}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size={iconOnly ? "icon" : "sm"}
            onClick={handleDownload}
            disabled={isCapturing}
            className={cn("flex items-center", !iconOnly && "gap-1")}
          >
            {isCapturing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {!iconOnly && "Download"}
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
            size={iconOnly ? "icon" : "sm"}
            onClick={handleShare}
            disabled={isCapturing}
            className={cn("flex items-center", !iconOnly && "gap-1")}
          >
            {isCapturing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {!iconOnly && "Share"}
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