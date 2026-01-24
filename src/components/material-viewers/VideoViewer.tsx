import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X } from "lucide-react";

interface VideoViewerProps {
  url: string;
  title: string;
  description?: string;
  onComplete?: () => void;
  isCompleted?: boolean;
  onClose?: () => void;
}

// Extract YouTube video ID from various URL formats
const getYouTubeEmbedUrl = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[2]?.length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    } else if (match && match[1]?.length === 11) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  return null;
};

// Check if URL is a video file (mp4, webm, etc.)
const isVideoFile = (url: string): boolean => {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
};

const VideoViewer: React.FC<VideoViewerProps> = ({
  url,
  title,
  description,
  onComplete,
  isCompleted = false,
  onClose,
}) => {
  const [videoEnded, setVideoEnded] = useState(false);

  // Check if video is YouTube or direct file
  const youtubeUrl = getYouTubeEmbedUrl(url);
  const isDirectVideo = isVideoFile(url);

  useEffect(() => {
    // Listen for YouTube video end events
    if (youtubeUrl) {
      const handleYouTubeMessage = (event: MessageEvent) => {
        if (event.data === "videoEnded") {
          setVideoEnded(true);
        }
      };

      window.addEventListener("message", handleYouTubeMessage);
      return () => window.removeEventListener("message", handleYouTubeMessage);
    }
  }, [youtubeUrl]);

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

      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        {youtubeUrl ? (
          <YouTubePlayer url={youtubeUrl} onEnded={() => setVideoEnded(true)} />
        ) : isDirectVideo ? (
          <video
            controls
            className="w-full h-full"
            onEnded={() => setVideoEnded(true)}
          >
            <source src={url} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <p>Unable to load video. Please check the URL.</p>
          </div>
        )}
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
              {videoEnded ? "Video finished! Mark as complete to continue." : "Watch the full video to mark it complete."}
            </p>
          )}

          {!isCompleted && (
            <Button
              onClick={handleMarkComplete}
              disabled={!videoEnded}
              variant={videoEnded ? "default" : "secondary"}
            >
              Mark as Complete
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// YouTube Player with API for detecting video end
const YouTubePlayer: React.FC<{ url: string; onEnded: () => void }> = ({ url, onEnded }) => {
  const videoId = url.split("/embed/")[1];

  useEffect(() => {
    // Inject YouTube IFrame API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    // @ts-ignore - YouTube API global
    window.onYouTubeIframeAPIReady = () => {
      new window.YT.Player("youtube-player", {
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              onEnded();
            }
          },
        },
      });
    };
  }, [videoId, onEnded]);

  return (
    <iframe
      id="youtube-player"
      width="100%"
      height="100%"
      src={`${url}?enablejsapi=1`}
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
};

export default VideoViewer;
