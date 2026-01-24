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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { QuestionTypeEnum } from "@/types/course";
import { Exam, ExamQuestionCreate } from "@/types/course";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExamBuilderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ExamCreateData) => void;
  initialExam?: Exam;
  stepId: string;
}

export interface ExamCreateData {
  name: string;
  description?: string;
  step_id: string;
  duration_minutes: number;
  passing_marks: number;
  total_marks: number;
  max_attempts: number;
  passing_percentage: number;
  questions: ExamQuestionCreate[];
}

const ExamBuilderDialog: React.FC<ExamBuilderDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExam,
  stepId,
}) => {
  const [name, setName] = useState(initialExam?.name || "");
  const [description, setDescription] = useState(initialExam?.description || "");
  const [durationMinutes, setDurationMinutes] = useState(initialExam?.duration_minutes || 30);
  const [passingMarks, setPassingMarks] = useState(initialExam?.passing_marks || 30);
  const [totalMarks, setTotalMarks] = useState(initialExam?.total_marks || 50);
  const [maxAttempts, setMaxAttempts] = useState(initialExam?.max_attempts || 3);
  const [passingPercentage, setPassingPercentage] = useState(initialExam?.passing_percentage || 60);
  const [questions, setQuestions] = useState<ExamQuestionCreate[]>(
    initialExam?.questions.map((q, i) => ({
      question_id: q.question_id,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options,
      marks: q.marks,
      max_words: q.max_words,
    })) || []
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setDurationMinutes(30);
    setPassingMarks(30);
    setTotalMarks(50);
    setMaxAttempts(3);
    setPassingPercentage(60);
    setQuestions([]);
  };

  const handleAddQuestion = (type: QuestionTypeEnum) => {
    const newQuestion: ExamQuestionCreate = {
      question_id: `q${Date.now()}`,
      question_type: type,
      question_text: "",
      marks: 5,
      options: type === QuestionTypeEnum.MCQ
        ? [
            { option_id: "a", text: "", is_correct: false },
            { option_id: "b", text: "", is_correct: false },
            { option_id: "c", text: "", is_correct: false },
            { option_id: "d", text: "", is_correct: false },
          ]
        : undefined,
      max_words: type === QuestionTypeEnum.THEORY ? 200 : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.question_id !== questionId));
  };

  const handleUpdateQuestion = (questionId: string, updates: Partial<ExamQuestionCreate>) => {
    setQuestions(questions.map((q) =>
      q.question_id === questionId ? { ...q, ...updates } : q
    ));
  };

  const handleUpdateOption = (
    questionId: string,
    optionId: string,
    field: "text" | "is_correct",
    value: string | boolean
  ) => {
    setQuestions(questions.map((q) => {
      if (q.question_id === questionId && q.options) {
        return {
          ...q,
          options: q.options.map((opt) =>
            opt.option_id === optionId ? { ...opt, [field]: value } : opt
          ),
        };
      }
      return q;
    }));
  };

  const handleAddOption = (questionId: string) => {
    setQuestions(questions.map((q) => {
      if (q.question_id === questionId && q.options) {
        const newOptionId = String.fromCharCode(97 + q.options.length);
        return {
          ...q,
          options: [...q.options, { option_id: newOptionId, text: "", is_correct: false }],
        };
      }
      return q;
    }));
  };

  const handleRemoveOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map((q) => {
      if (q.question_id === questionId && q.options) {
        return {
          ...q,
          options: q.options.filter((opt) => opt.option_id !== optionId),
        };
      }
      return q;
    }));
  };

  const handleSetCorrectOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map((q) => {
      if (q.question_id === questionId && q.options) {
        return {
          ...q,
          options: q.options.map((opt) => ({
            ...opt,
            is_correct: opt.option_id === optionId,
          })),
        };
      }
      return q;
    }));
  };

  const calculatedTotalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }
    if (questions.length === 0) {
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      step_id: stepId,
      duration_minutes: durationMinutes,
      passing_marks: passingMarks,
      total_marks: calculatedTotalMarks,
      max_attempts: maxAttempts,
      passing_percentage: passingPercentage,
      questions: questions.map((q, i) => ({
        ...q,
        question_id: q.question_id || `q${i}`,
      })),
    });

    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialExam ? "Edit Exam" : "Create Exam"}</DialogTitle>
          <DialogDescription>
            Create an exam with MCQ and theory questions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Exam Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Exam Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam-name">Exam Name *</Label>
                <Input
                  id="exam-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Step 1 Assessment"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passing-marks">Passing Marks *</Label>
                <Input
                  id="passing-marks"
                  type="number"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-attempts">Max Attempts *</Label>
                <Input
                  id="max-attempts"
                  type="number"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the exam..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span>Total Questions: <strong>{questions.length}</strong></span>
              <span>Total Marks: <strong>{calculatedTotalMarks}</strong></span>
              <span>Passing: <strong>{passingPercentage}%</strong></span>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Questions</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddQuestion(QuestionTypeEnum.MCQ)}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add MCQ
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddQuestion(QuestionTypeEnum.THEORY)}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Theory
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <Card key={question.question_id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        Question {index + 1}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={question.question_type === QuestionTypeEnum.MCQ ? "default" : "secondary"}>
                          {question.question_type === QuestionTypeEnum.MCQ ? "MCQ" : "Theory"}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveQuestion(question.question_id!)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-3 space-y-2">
                        <Label>Question Text</Label>
                        <Textarea
                          value={question.question_text}
                          onChange={(e) => handleUpdateQuestion(question.question_id!, { question_text: e.target.value })}
                          placeholder="Enter your question..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Marks</Label>
                        <Input
                          type="number"
                          value={question.marks}
                          onChange={(e) => handleUpdateQuestion(question.question_id!, { marks: parseInt(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>
                    </div>

                    {question.question_type === QuestionTypeEnum.MCQ && question.options && (
                      <div className="space-y-2">
                        <Label>Options (select correct answer)</Label>
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <div key={option.option_id} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${question.question_id}`}
                                checked={option.is_correct}
                                onChange={() => handleSetCorrectOption(question.question_id!, option.option_id)}
                                className="h-4 w-4"
                              />
                              <span className="text-sm text-muted-foreground w-6">{option.option_id.toUpperCase()}.</span>
                              <Input
                                value={option.text}
                                onChange={(e) => handleUpdateOption(question.question_id!, option.option_id, "text", e.target.value)}
                                placeholder={`Option ${option.option_id.toUpperCase()}`}
                                className={option.is_correct ? "border-green-600" : ""}
                              />
                              {question.options && question.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveOption(question.question_id!, option.option_id)}
                                  className="h-8 w-8 p-0 text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        {question.options.length < 6 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOption(question.question_id!)}
                            className="gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add Option
                          </Button>
                        )}
                      </div>
                    )}

                    {question.question_type === QuestionTypeEnum.THEORY && (
                      <div className="space-y-2">
                        <Label>Max Words</Label>
                        <Input
                          type="number"
                          value={question.max_words || ""}
                          onChange={(e) => handleUpdateQuestion(question.question_id!, { max_words: parseInt(e.target.value) || undefined })}
                          placeholder="e.g., 200"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {questions.length === 0 && (
              <Card className="p-8">
                <div className="text-center text-muted-foreground">
                  No questions yet. Add MCQ or Theory questions to get started.
                </div>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || questions.length === 0}>
            Save Exam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExamBuilderDialog;
