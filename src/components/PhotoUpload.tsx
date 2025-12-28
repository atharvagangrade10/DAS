"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { uploadPhoto } from "@/utils/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PhotoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  participantId?: string; // Required for upload API
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  value, 
  onChange, 
  label = "Profile Photo",
  participantId = "new_participant" // Default for creation flows
}) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large (max 5MB)");
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadPhoto(file, participantId);
      onChange(url);
      toast.success("Photo uploaded successfully!");
    } catch (error: any) {
      toast.error("Upload failed", { description: error.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const clearPhoto = () => {
    onChange(null);
  };

  return (
    <div className="space-y-4 flex flex-col items-center">
      <label className="text-sm font-medium self-start">{label}</label>
      <div className="relative">
        <Avatar className="h-32 w-32 border-2 border-muted shadow-sm">
          {value ? (
            <AvatarImage src={value} alt="Profile preview" className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="h-12 w-12" />
          </AvatarFallback>
        </Avatar>
        
        {value && !isUploading && (
          <button
            onClick={clearPhoto}
            type="button"
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-background/60 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.setAttribute("capture", "user");
              fileInputRef.current.click();
            }
          }}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          Capture
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 5MB.</p>
    </div>
  );
};

export default PhotoUpload;