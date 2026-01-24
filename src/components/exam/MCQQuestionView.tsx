import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Question } from "@/types/course";

interface MCQQuestionViewProps {
  question: Question & { options: Array<{ option_id: string; text: string; is_correct?: boolean }> };
  selectedAnswer?: string;
  onAnswerChange: (optionId: string) => void;
  showResult?: boolean;
  questionNumber: number;
}

const MCQQuestionView: React.FC<MCQQuestionViewProps> = ({
  question,
  selectedAnswer,
  onAnswerChange,
  showResult = false,
  questionNumber,
}) => {
  const correctOption = question.options.find((o) => o.is_correct);
  const isCorrect = selectedAnswer === correctOption?.option_id;
  const hasAnswered = !!selectedAnswer;

  return (
    <Card className={showResult ? (isCorrect ? "border-green-600" : "border-red-600") : ""}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Badge variant="outline" className="mt-1">
            Q{questionNumber}
          </Badge>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium">{question.question_text}</h3>
              <Badge variant="secondary">{question.marks} marks</Badge>
            </div>

            <RadioGroup value={selectedAnswer || ""} onValueChange={onAnswerChange} disabled={showResult}>
              <div className="space-y-3">
                {question.options.map((option) => {
                  const isSelected = selectedAnswer === option.option_id;
                  const isCorrectOption = option.is_correct;
                  const showCorrect = showResult && isCorrectOption;
                  const showWrong = showResult && isSelected && !isCorrectOption;

                  return (
                    <div
                      key={option.option_id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        showCorrect
                          ? "bg-green-100 border-green-600 dark:bg-green-900/30"
                          : showWrong
                            ? "bg-red-100 border-red-600 dark:bg-red-900/30"
                            : isSelected
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem
                        value={option.option_id}
                        id={`${question.question_id}-${option.option_id}`}
                        disabled={showResult}
                      />
                      <Label
                        htmlFor={`${question.question_id}-${option.option_id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <span className="font-medium mr-2">{option.option_id.toUpperCase()}.</span>
                        {option.text}
                      </Label>
                      {showCorrect && (
                        <Badge className="bg-green-600">Correct</Badge>
                      )}
                      {showWrong && (
                        <Badge variant="destructive">Your Answer</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </RadioGroup>

            {showResult && (
              <div className="mt-4 p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  <span className="font-medium">Correct Answer:</span>{" "}
                  {correctOption?.option_id.toUpperCase()}. {correctOption?.text}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MCQQuestionView;
