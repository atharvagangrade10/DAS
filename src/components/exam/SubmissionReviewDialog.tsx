import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, FileText, Edit3 } from "lucide-react";
import { ExamSubmissionDetails, QuestionTypeEnum, GradeTheoryRequest } from "@/types/course";
import { toast } from "sonner";

interface SubmissionReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  submission: ExamSubmissionDetails | null;
  managerId: string;
  onGrade?: (submissionId: string, managerId: string, data: GradeTheoryRequest) => void;
  onApprove?: (submissionId: string, managerId: string, data: { feedback?: string }) => void;
  onReject?: (submissionId: string, managerId: string, data: { feedback?: string }) => void;
}

const SubmissionReviewDialog: React.FC<SubmissionReviewDialogProps> = ({
  isOpen,
  onClose,
  submission,
  managerId,
  onGrade,
  onApprove,
  onReject,
}) => {
  const [theoryGrades, setTheoryGrades] = useState<Record<string, number>>({});
  const [overallFeedback, setOverallFeedback] = useState(submission?.feedback || "");

  // Initialize theory grades when submission loads
  React.useEffect(() => {
    if (submission) {
      const grades: Record<string, number> = {};
      submission.questions.forEach((q) => {
        if (q.question_type === QuestionTypeEnum.THEORY && q.marks_awarded !== undefined) {
          grades[q.question_id] = q.marks_awarded;
        }
      });
      setTheoryGrades(grades);
      setOverallFeedback(submission.feedback || "");
    }
  }, [submission]);

  if (!submission) return null;

  const mcqQuestions = submission.questions.filter((q) => q.question_type === QuestionTypeEnum.MCQ);
  const theoryQuestions = submission.questions.filter((q) => q.question_type === QuestionTypeEnum.THEORY);

  const mcqCorrect = mcqQuestions.filter((q) => {
    const answer = q.participant_answer as any;
    const correctOption = q.options.find((o) => o.is_correct);
    return answer?.selected_option_id === correctOption?.option_id;
  }).length;

  const totalTheoryMarks = theoryQuestions.reduce((sum, q) => sum + q.marks, 0);
  const awardedTheoryMarks = Object.values(theoryGrades).reduce((sum, marks) => sum + marks, 0);

  const handleTheoryGradeChange = (questionId: string, marks: number) => {
    setTheoryGrades({ ...theoryGrades, [questionId]: marks });
  };

  const handleSaveGrades = () => {
    if (!onGrade) return;

    const theoryGradesArray = Object.entries(theoryGrades).map(([questionId, marks]) => ({
      question_id: questionId,
      marks_awarded: marks,
    }));

    onGrade(submission.submission_id, managerId, {
      theory_grades: theoryGradesArray,
    });
  };

  const handleApprove = () => {
    if (!onApprove) return;
    onApprove(submission.submission_id, managerId, {
      feedback: overallFeedback,
    });
  };

  const handleReject = () => {
    if (!onReject) return;
    onReject(submission.submission_id, managerId, {
      feedback: overallFeedback,
    });
  };

  const calculateTotal = () => {
    return submission.mcq_score + awardedTheoryMarks;
  };

  const isPassing = calculateTotal() >= submission.form.passing_marks;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Exam Submission</DialogTitle>
          <DialogDescription>
            {submission.participant_id} • {submission.form_name} • {submission.course_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Score Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">MCQ Score</div>
                  <div className="text-xl font-bold">{submission.mcq_score}</div>
                  <div className="text-xs text-muted-foreground">{mcqCorrect}/{mcqQuestions.length} correct</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Theory Score</div>
                  <div className="text-xl font-bold">
                    {awardedTheoryMarks}/{totalTheoryMarks}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                  <div className={`text-xl font-bold ${isPassing ? "text-green-600" : "text-red-600"}`}>
                    {calculateTotal()}/{submission.form.total_marks}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Passing Marks</div>
                  <div className="text-xl font-bold">{submission.form.passing_marks}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Tabs defaultValue="mcq">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mcq">
                MCQ Answers ({mcqQuestions.length})
              </TabsTrigger>
              <TabsTrigger value="theory">
                Theory Answers ({theoryQuestions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mcq" className="space-y-3">
              {mcqQuestions.map((q, index) => {
                const answer = q.participant_answer as any;
                const selectedOption = q.options.find((o) => o.option_id === answer?.selected_option_id);
                const correctOption = q.options.find((o) => o.is_correct);
                const isCorrect = answer?.selected_option_id === correctOption?.option_id;

                return (
                  <Card key={q.question_id} className={isCorrect ? "border-green-600" : "border-red-600"}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium">Question {index + 1}</div>
                          <div className="font-medium">{q.question_text}</div>
                        </div>
                        <Badge variant={isCorrect ? "default" : "destructive"}>
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Correct
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Incorrect
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Selected:</div>
                          <div className="font-medium">{selectedOption?.option_id.toUpperCase()}. {selectedOption?.text}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Correct:</div>
                          <div className="font-medium text-green-600">{correctOption?.option_id.toUpperCase()}. {correctOption?.text}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground mt-2">
                        {q.marks} marks
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="theory" className="space-y-3">
              {theoryQuestions.map((q, index) => {
                const answer = q.participant_answer as any;
                const currentGrade = theoryGrades[q.question_id] || 0;

                return (
                  <Card key={q.question_id}>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <div className="text-sm font-medium mb-1">Question {index + 1}</div>
                        <div className="font-medium">{q.question_text}</div>
                        <div className="text-sm text-muted-foreground">{q.marks} marks</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="text-sm text-muted-foreground mb-1">Participant's Answer:</div>
                        <p className="text-sm">{answer?.answer_text || "No answer provided"}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`grade-${q.question_id}`}>Grade:</Label>
                          <Input
                            id={`grade-${q.question_id}`}
                            type="number"
                            min="0"
                            max={q.marks}
                            value={currentGrade}
                            onChange={(e) => handleTheoryGradeChange(q.question_id, parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">/ {q.marks}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Overall Feedback</Label>
            <Textarea
              id="feedback"
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              placeholder="Provide feedback for the participant..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 sm:ml-auto">
            {onGrade && (
              <Button variant="outline" onClick={handleSaveGrades}>
                <Edit3 className="mr-2 h-4 w-4" />
                Save Grades
              </Button>
            )}
            {onReject && (
              <Button variant="destructive" onClick={handleReject}>
                Reject
              </Button>
            )}
            {onApprove && (
              <Button
                onClick={handleApprove}
                disabled={!isPassing && awardedTheoryMarks < totalTheoryMarks}
                className={!isPassing ? "bg-orange-600 hover:bg-orange-700" : ""}
              >
                {isPassing ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve & Unlock
                  </>
                ) : (
                  "Approve (Below Passing)"
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionReviewDialog;
