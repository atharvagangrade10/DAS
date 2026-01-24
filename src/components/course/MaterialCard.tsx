import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MaterialTypeEnum } from "@/types/course";
import { Material } from "@/types/course";
import {
  Video,
  BookOpen,
  FileText,
  Headphones,
  ClipboardList,
  CheckCircle2,
  Circle,
  Lock,
  Play,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialCardProps {
  material: Material;
  isLocked?: boolean;
  onView?: () => void;
  onComplete?: () => void;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  isLocked = false,
  onView,
  onComplete,
  canManage = false,
  onEdit,
  onDelete,
}) => {
  const getMaterialIcon = () => {
    switch (material.material_type) {
      case MaterialTypeEnum.VIDEO:
        return <Video className="h-5 w-5" />;
      case MaterialTypeEnum.BOOK_LINK:
        return <BookOpen className="h-5 w-5" />;
      case MaterialTypeEnum.DOCUMENT:
        return <FileText className="h-5 w-5" />;
      case MaterialTypeEnum.AUDIO:
        return <Headphones className="h-5 w-5" />;
      case MaterialTypeEnum.REQUIREMENT_TABLE:
        return <ClipboardList className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getMaterialTypeLabel = () => {
    switch (material.material_type) {
      case MaterialTypeEnum.VIDEO:
        return "Video";
      case MaterialTypeEnum.BOOK_LINK:
        return "Book";
      case MaterialTypeEnum.DOCUMENT:
        return "Document";
      case MaterialTypeEnum.AUDIO:
        return "Audio";
      case MaterialTypeEnum.REQUIREMENT_TABLE:
        return "Requirement Table";
      default:
        return "Material";
    }
  };

  const getMaterialTypeColor = () => {
    switch (material.material_type) {
      case MaterialTypeEnum.VIDEO:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case MaterialTypeEnum.BOOK_LINK:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case MaterialTypeEnum.DOCUMENT:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case MaterialTypeEnum.AUDIO:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case MaterialTypeEnum.REQUIREMENT_TABLE:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        isLocked && "opacity-60",
        material.is_completed && "border-green-600 dark:border-green-500"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              "p-2 rounded-lg",
              getMaterialTypeColor()
            )}>
              {getMaterialIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="line-clamp-1 text-base">{material.title}</CardTitle>
                {material.is_completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : isLocked ? (
                  <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {material.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {getMaterialTypeLabel()}
          </Badge>
        </div>
        {material.is_mandatory && (
          <Badge variant="outline" className="mt-2">Mandatory</Badge>
        )}
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-2">
        {/* Requirement Table Progress */}
        {material.material_type === MaterialTypeEnum.REQUIREMENT_TABLE && material.requirement_progress && (
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{material.requirement_progress.completed}/{material.requirement_progress.total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${material.requirement_progress.total > 0
                    ? (material.requirement_progress.completed / material.requirement_progress.total) * 100
                    : 0}%`
                }}
              />
            </div>
            {material.requirement_progress.is_submitted && (
              <Badge variant="secondary" className="mt-2 text-xs">
                Submitted for review
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {!isLocked && (
            <>
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onView}
                  className="gap-1"
                >
                  {material.material_type === MaterialTypeEnum.VIDEO ? (
                    <>
                      <Play className="h-3 w-3" />
                      Watch
                    </>
                  ) : material.material_type === MaterialTypeEnum.BOOK_LINK ? (
                    <>
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </>
                  ) : (
                    <>View</>
                  )}
                </Button>
              )}
              {onComplete && !material.is_completed && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onComplete}
                >
                  Mark Complete
                </Button>
              )}
            </>
          )}

          {canManage && (
            <>
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={onDelete}
                >
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialCard;
