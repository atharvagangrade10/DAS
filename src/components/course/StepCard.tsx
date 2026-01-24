import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, Circle, BookOpen, FileText, ClipboardList, PlayCircle, Video } from "lucide-react";
import { Step } from "@/types/course";
import { cn } from "@/lib/utils";

interface StepCardProps {
  step: Step & {
    materials_count?: number;
  };
  isLocked?: boolean;
  isCompleted?: boolean;
  isCurrent?: boolean;
  onClick?: () => void;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  isLocked = false,
  isCompleted = false,
  isCurrent = false,
  onClick,
}) => {
  const getStatusIcon = () => {
    if (isLocked) return <Lock className="h-5 w-5 text-muted-foreground" />;
    if (isCompleted) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (isCurrent) return <Circle className="h-5 w-5 text-primary fill-primary" />;
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusBadge = () => {
    if (isLocked) return <Badge variant="secondary">Locked</Badge>;
    if (isCompleted) return <Badge variant="default" className="bg-green-600">Completed</Badge>;
    if (isCurrent) return <Badge variant="default">In Progress</Badge>;
    return null;
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isCurrent && "ring-2 ring-primary",
        isLocked && "opacity-60"
      )}
      onClick={isLocked ? undefined : onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon()}
              <CardTitle className="line-clamp-1 text-lg">{step.name}</CardTitle>
            </div>
            <CardDescription className="line-clamp-2">{step.description}</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {step.materials_count !== undefined && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{step.materials_count} Materials</span>
            </div>
          )}
          {step.has_exam && (
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Exam</span>
            </div>
          )}
        </div>

        {step.progress && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${step.progress.total_materials > 0
                    ? (step.progress.completed_materials_count / step.progress.total_materials) * 100
                    : 0}%`
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
              {step.progress.completed_materials_count}/{step.progress.total_materials}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StepCard;
