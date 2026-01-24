import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Question } from "@/types/course";

interface TheoryQuestionViewProps {
  question: Question;
  answer?: string;
  onAnswerChange: (answer: string) => void;
  showResult?: boolean;
  marksAwarded?: number;
  questionNumber: number;
  readOnly?: boolean;
}

const TheoryQuestionView: React.FC<TheoryQuestionViewProps> = ({
  question,
  answer = "",
  onAnswerChange,
  showResult = false,
  marksAwarded,
  questionNumber,
  readOnly = false,
}) => {
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const words = answer.trim().split(/\s+/).filter((w) => w.length > 0);
    setWordCount(words.length);
  }, [answer]);

  const maxWords = question.max_words || 200;
  const isOverLimit = wordCount > maxWords;
  const remainingWords = maxWords - wordCount;

  return (
    <Card className={showResult && marksAwarded !== undefined ? "border-blue-600" : ""}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Badge variant="outline" className="mt-1">
                Q{questionNumber}
              </Badge>
              <div>
                <h3 className="text-lg font-medium">{question.question_text}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {question.marks} marks
                  {maxWords && ` • Max ${maxWords} words`}
                </p>
              </div>
            </div>
            {showResult && marksAwarded !== undefined && (
              <Badge variant="secondary" className="text-base px-3 py-1">
                {marksAwarded}/{question.marks}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`answer-${question.question_id}`}>Your Answer</Label>
            <Textarea
              id={`answer-${question.question_id}`}
              value={answer}
              onChange={(e) => !readOnly && onAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              rows={6}
              disabled={readOnly}
              className={isOverLimit ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            <div className={`flex items-center justify-between text-sm ${
              isOverLimit ? "text-red-600" : remainingWords <= 20 ? "text-orange-600" : "text-muted-foreground"
            }`}>
              <span>{wordCount} words</span>
              {maxWords && (
                <span className="flex items-center gap-1">
                  {isOverLimit && <AlertCircle className="h-4 w-4" />}
                  {isOverLimit
                    ? `${Math.abs(remainingWords)} words over limit!`
                    : `${remainingWords} words remaining`}
                </span>
              )}
            </div>
          </div>

          {showResult && marksAwarded !== undefined && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                <span className="font-medium">Marks Awarded:</span> {marksAwarded} / {question.marks}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TheoryQuestionView;
