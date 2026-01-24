import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, ArrowRight, Save, Send } from "lucide-react";
import { Exam, ExamStartResponse, MCQAnswer, TheoryAnswer, QuestionTypeEnum } from "@/types/course";
import MCQQuestionView from "./MCQQuestionView";
import TheoryQuestionView from "./TheoryQuestionView";
import ExamTimer from "./ExamTimer";
import { toast } from "sonner";

interface ExamTakingViewProps {
  examData: ExamStartResponse;
  onSubmit: (data: { mcq_answers: MCQAnswer[]; theory_answers: TheoryAnswer[] }) => void;
  onExit?: () => void;
}

const ExamTakingView: React.FC<ExamTakingViewProps> = ({ examData, onSubmit, onExit }) => {
  const { form, duration_minutes, started_at, submission_id } = examData;
  const questions = form.questions;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, string>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load saved answers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`exam_${submission_id}_answers`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMcqAnswers(parsed.mcq || {});
        setTheoryAnswers(parsed.theory || {});
      } catch {
        // Ignore parse errors
      }
    }
  }, [submission_id]);

  // Save answers to localStorage periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem(
        `exam_${submission_id}_answers`,
        JSON.stringify({ mcq: mcqAnswers, theory: theoryAnswers })
      );
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [submission_id, mcqAnswers, theoryAnswers]);

  const currentQuestion = questions[currentQuestionIndex];
  const isMCQ = currentQuestion.question_type === QuestionTypeEnum.MCQ;

  const handleMCQAnswer = (optionId: string) => {
    setMcqAnswers({ ...mcqAnswers, [currentQuestion.question_id]: { question_id: currentQuestion.question_id, selected_option_id: optionId } });
  };

  const handleTheoryAnswer = (answerText: string) => {
    setTheoryAnswers({ ...theoryAnswers, [currentQuestion.question_id]: { question_id: currentQuestion.question_id, answer_text: answerText } });
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmit = () => {
    // Check if all questions are answered
    const answeredMCQs = Object.keys(mcqAnswers).length;
    const answeredTheory = Object.keys(theoryAnswers).length;
    const mcqCount = questions.filter((q) => q.question_type === QuestionTypeEnum.MCQ).length;
    const theoryCount = questions.filter((q) => q.question_type === QuestionTypeEnum.THEORY).length;

    if (answeredMCQs < mcqCount || answeredTheory < theoryCount) {
      setShowConfirmDialog(true);
      return;
    }

    submitExam();
  };

  const submitExam = () => {
    // Prepare submission data
    const mcqAnswersArray: MCQAnswer[] = Object.values(mcqAnswers);
    const theoryAnswersArray: TheoryAnswer[] = Object.values(theoryAnswers);

    // Clear saved answers
    localStorage.removeItem(`exam_${submission_id}_answers`);

    onSubmit({
      mcq_answers: mcqAnswersArray,
      theory_answers: theoryAnswersArray,
    });
  };

  const getQuestionStatus = (questionId: string) => {
    if (mcqAnswers[questionId]) return "answered";
    if (theoryAnswers[questionId]) return "answered";
    return "unanswered";
  };

  const answeredCount = Object.keys(mcqAnswers).length + Object.keys(theoryAnswers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  return (
    <div className="space-y-4">
      {/* Timer */}
      <ExamTimer
        duration={duration_minutes}
        startedAt={started_at}
        onTimeUp={submitExam}
        examName={form.name}
      />

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium">{answeredCount} answered</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Question Navigator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => {
              const status = getQuestionStatus(q.question_id);
              const isCurrent = index === currentQuestionIndex;

              return (
                <button
                  key={q.question_id}
                  onClick={() => goToQuestion(index)}
                  className={`w-10 h-10 rounded-lg font-medium text-sm transition-colors ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : status === "answered"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      {isMCQ ? (
        <MCQQuestionView
          question={currentQuestion}
          selectedAnswer={mcqAnswers[currentQuestion.question_id]?.selected_option_id}
          onAnswerChange={handleMCQAnswer}
          questionNumber={currentQuestionIndex + 1}
        />
      ) : (
        <TheoryQuestionView
          question={currentQuestion}
          answer={theoryAnswers[currentQuestion.question_id]?.answer_text}
          onAnswerChange={handleTheoryAnswer}
          questionNumber={currentQuestionIndex + 1}
        />
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentQuestionIndex === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.setItem(
                    `exam_${submission_id}_answers`,
                    JSON.stringify({ mcq: mcqAnswers, theory: theoryAnswers })
                  );
                  toast.success("Draft saved");
                }}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button onClick={goToNext} className="gap-2">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="gap-2">
                  <Send className="h-4 w-4" />
                  Submit Exam
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Submit Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Incomplete Exam</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You have not answered all questions. Are you sure you want to submit?
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Continue Exam
                </Button>
                <Button variant="destructive" onClick={submitExam}>
                  Submit Anyway
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ExamTakingView;
