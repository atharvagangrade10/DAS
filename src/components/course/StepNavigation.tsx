import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepNavItem {
  id: string;
  name: string;
  order_index: number;
  is_locked?: boolean;
  is_completed?: boolean;
  is_current?: boolean;
}

interface StepNavigationProps {
  steps: StepNavItem[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  steps,
  currentStepId,
  onStepClick,
  className,
}) => {
  // Sort steps by order_index
  const sortedSteps = [...steps].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="flex items-center gap-2 min-w-max">
        {sortedSteps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          const isCompleted = step.is_completed;
          const isLocked = step.is_locked || (!isCompleted && !isCurrent && index > 0);

          return (
            <React.Fragment key={step.id}>
              {/* Connector line */}
              {index > 0 && (
                <div className={cn(
                  "w-8 h-0.5",
                  isCompleted ? "bg-primary" : "bg-muted"
                )} />
              )}

              <Button
                variant={isCurrent ? "default" : "outline"}
                size="sm"
                className={cn(
                  "relative rounded-full h-10 px-4 min-w-max",
                  isLocked && "opacity-50",
                  isCurrent && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => !isLocked && onStepClick?.(step.id)}
                disabled={isLocked}
              >
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isLocked ? (
                    <Lock className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Circle className="h-4 w-4 fill-current" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span className="truncate max-w-[120px]">{step.name}</span>
                </div>
                {isCompleted && (
                  <Badge className="ml-2 h-5 px-1 text-xs bg-green-600 hover:bg-green-600">
                    Done
                  </Badge>
                )}
              </Button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepNavigation;
