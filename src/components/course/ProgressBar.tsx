import React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  className,
  showLabel = false,
  size = "md"
}) => {
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3"
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2">
        <Progress value={value} className={cn("flex-1", sizeClasses[size])} />
        {showLabel && (
          <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
            {Math.round(value)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
