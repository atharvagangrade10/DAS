import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, BookOpen, Users, Clock } from "lucide-react";
import { Course } from "@/types/course";
import ProgressBar from "./ProgressBar";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  course: Course & {
    steps_count?: number;
    materials_count?: number;
    progress?: number;
  };
  isLocked?: boolean;
  onEdit?: (courseId: string) => void;
  onDelete?: (courseId: string) => void;
  onSetDefault?: (courseId: string) => void;
  canManage?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  isLocked = false,
  onEdit,
  onDelete,
  onSetDefault,
  canManage = false,
}) => {
  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md",
      isLocked && "opacity-75"
    )}>
      {course.image_url && (
        <div className="h-40 w-full overflow-hidden bg-muted">
          <img
            src={course.image_url}
            alt={course.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-1">{course.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {course.description}
            </CardDescription>
          </div>
          {isLocked && (
            <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          {course.is_default && (
            <Badge variant="secondary" className="shrink-0">Default</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {course.steps_count !== undefined && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{course.steps_count} Steps</span>
            </div>
          )}
          {course.materials_count !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.materials_count} Materials</span>
            </div>
          )}
        </div>

        {course.progress !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(course.progress)}%</span>
            </div>
            <ProgressBar value={course.progress} size="sm" />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2">
        {canManage ? (
          <>
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(course.id)}
                >
                  Edit
                </Button>
              )}
              {onSetDefault && !course.is_default && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSetDefault(course.id)}
                >
                  Set Default
                </Button>
              )}
            </div>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(course.id)}
              >
                Delete
              </Button>
            )}
          </>
        ) : (
          <Button asChild variant="default" className="w-full">
            <Link to={`/courses/${course.id}`}>
              {isLocked ? (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Locked
                </>
              ) : course.progress !== undefined && course.progress > 0 ? (
                "Continue"
              ) : (
                "Start Course"
              )}
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
