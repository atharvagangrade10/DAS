"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getStatsImages } from "@/lib/api";
import { Image } from "@/lib/types";

interface ExportImagesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportImagesDialog({
  isOpen,
  onOpenChange,
}: ExportImagesDialogProps) {
  const [selectedImagesToExport, setSelectedImagesToExport] = useState<
    Set<string>
  >(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: images, isLoading } = useQuery<Image[]>({
    queryKey: ["statsImages"],
    queryFn: getStatsImages,
    enabled: isOpen,
  });

  // Reset selection and search when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedImagesToExport(new Set());
      setSelectAll(false);
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredImages = useMemo(() => {
    if (!images) return [];
    return images.filter((image) =>
      image.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [images, searchQuery]);

  const handleToggleImage = useCallback((imageId: string) => {
    setSelectedImagesToExport((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedImagesToExport(new Set());
    } else {
      setSelectedImagesToExport(new Set(filteredImages.map((img) => img.id)));
    }
    setSelectAll((prev) => !prev);
  }, [selectAll, filteredImages]);

  const handleClearSelection = useCallback(() => {
    setSelectedImagesToExport(new Set());
    setSelectAll(false);
  }, []);

  const handleExport = useCallback(() => {
    if (!selectedImagesToExport || selectedImagesToExport.size === 0) {
      toast.error("Please select at least one image to export.");
      return;
    }

    const imagesToDownload = images?.filter((img) =>
      selectedImagesToExport.has(img.id)
    );

    if (imagesToDownload && imagesToDownload.length > 0) {
      imagesToDownload.forEach((image) => {
        const link = document.createElement("a");
        link.href = image.url;
        link.download = image.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
      toast.success(
        `Exported ${imagesToDownload.length} image${
          imagesToDownload.length > 1 ? "s" : ""
        }.`
      );
      onOpenChange(false);
      handleClearSelection(); // Clear selection after export
    } else {
      toast.error("No images found to export.");
    }
  }, [selectedImagesToExport, images, onOpenChange, handleClearSelection]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2">
            <div>
              <DialogTitle>Export Images</DialogTitle>
              <DialogDescription>
                Select the images you want to export.
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
              disabled={!selectedImagesToExport || selectedImagesToExport.size === 0}
            >
              Clear Selection
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 flex-grow min-h-0">
          <Input
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />

          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="selectAll"
              checked={selectAll || (filteredImages.length > 0 && selectedImagesToExport && selectedImagesToExport.size === filteredImages.length)}
              onCheckedChange={handleSelectAll}
              disabled={isLoading || filteredImages.length === 0}
            />
            <Label htmlFor="selectAll" className="text-sm font-medium">
              Select All ({selectedImagesToExport?.size || 0} /{" "}
              {filteredImages.length} selected)
            </Label>
          </div>

          {isLoading ? (
            <div className="text-center text-gray-500">Loading images...</div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center text-gray-500">No images found.</div>
          ) : (
            <ScrollArea className="flex-grow min-h-0 max-h-[calc(90vh-250px)] pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    className="flex flex-col items-center space-y-2 p-2 border rounded-md"
                  >
                    <Checkbox
                      id={`image-${image.id}`}
                      checked={selectedImagesToExport?.has(image.id) || false}
                      onCheckedChange={() => handleToggleImage(image.id)}
                    />
                    <Label htmlFor={`image-${image.id}`} className="text-sm">
                      {image.name}
                    </Label>
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!selectedImagesToExport || selectedImagesToExport.size === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Export Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}