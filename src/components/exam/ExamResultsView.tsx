import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock, RotateCcw, Trophy } from "lucide-react";
import { FormSubmissionStatus, StepExamStatus } from "@/types/course";
import { useNavigate } from "react-router-dom";

interface ExamResultsViewProps {
  examName: string;
  mcqScore: number;
  theoryScore: number | null;
  totalScore: number | null;
  passingMarks: number;
  totalMarks: number;
  status: FormSubmissionStatus | StepExamStatus;
  feedback?: string;
  attemptNumber?: number;
  maxAttempts?: number;
  canRetake?: boolean;
  onStartRetake?: () => void;
  onContinue?: () => void;
}

const ExamResultsView: React.FC<ExamResultsViewProps> = ({
  examName,
  mcqScore,
  theoryScore,
  totalScore,
  passingMarks,
  totalMarks,
  status,
  feedback,
  attemptNumber = 1,
  maxAttempts = 3,
  canRetake = false,
  onStartRetake,
  onContinue,
}) => {
  const navigate = useNavigate();

  const isPassed = status === "Approved";
  const isPending = status === "Submitted" || status === "UnderReview";
  const isRejected = status === "Rejected";
  const percentage = totalScore !== null ? (totalScore / totalMarks) * 100 : 0;

  const getScoreDisplay = () => {
    if (isPending && totalScore === null) {
      return (
        <div className="flex items-center gap-2 text-orange-600">
          <Clock className="h-5 w-5" />
          <span>Pending Review</span>
        </div>
      );
    }

    if (isPassed) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span>Passed!</span>
        </div>
      );
    }

    if (isRejected) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <span>Needs Improvement</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-muted-foreground">
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className={`${isPassed ? "border-green-600" : ""}`}>
        <CardHeader>
          <CardTitle className="text-2xl">{examName}</CardTitle>
          <CardDescription>
            Attempt {attemptNumber} of {maxAttempts}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {totalScore !== null ? `${totalScore}/${totalMarks}` : `${mcqScore}/${totalMarks}`}
            </div>
            <div className="text-xl">{getScoreDisplay()}</div>
            {totalScore !== null && (
              <div className="text-sm text-muted-foreground mt-1">
                {percentage.toFixed(1)}% • Passing: {passingMarks}/{totalMarks} ({((passingMarks / totalMarks) * 100).toFixed(1)}%)
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {totalScore !== null && (
            <Progress value={percentage} className="h-3" />
          )}

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">MCQ Score</div>
                <div className="text-2xl font-bold">{mcqScore}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Theory Score</div>
                <div className="text-2xl font-bold">
                  {theoryScore !== null ? theoryScore : "Pending"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feedback */}
          {feedback && (
            <Card className={isPassed ? "bg-green-50 dark:bg-green-900/20" : "bg-muted"}>
              <CardContent className="p-4">
                <div className="text-sm">
                  <span className="font-medium">Feedback: </span>
                  {feedback}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What's Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPassed && (
            <div className="flex items-start gap-3">
              <Trophy className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Congratulations!</div>
                <p className="text-sm text-muted-foreground">
                  You've passed this exam. You can now proceed to the next step.
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <div className="font-medium">Awaiting Review</div>
                <p className="text-sm text-muted-foreground">
                  Your theory answers need to be reviewed by a manager. You'll be notified once the review is complete.
                </p>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="flex items-start gap-3">
              <RotateCcw className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <div className="font-medium">Keep Practicing!</div>
                <p className="text-sm text-muted-foreground">
                  You didn't pass this time. Review the materials and try again.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {isPassed && onContinue && (
              <Button onClick={onContinue} className="flex-1">
                Continue to Next Step
              </Button>
            )}

            {(isRejected || canRetake) && attemptNumber < maxAttempts && onStartRetake && (
              <Button onClick={onStartRetake} variant="outline" className="flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake Exam
              </Button>
            )}

            <Button
              onClick={() => navigate("/my-learning")}
              variant="outline"
              className="flex-1"
            >
              Back to My Learning
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamResultsView;
