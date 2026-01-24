import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, BookOpen, PlayCircle, FileText, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { fetchStepProgress } from "@/utils/api";
import { StepProgressDetail, MaterialTypeEnum, StepExamStatus } from "@/types/course";
import MaterialCard from "@/components/course/MaterialCard";
import VideoViewer from "@/components/material-viewers/VideoViewer";
import DocumentViewer from "@/components/material-viewers/DocumentViewer";
import BookLinkViewer from "@/components/material-viewers/BookLinkViewer";
import AudioViewer from "@/components/material-viewers/AudioViewer";
import RequirementTableViewer from "@/components/requirement-table/RequirementTableViewer";
import RequirementTableBuilder from "@/components/requirement-table/RequirementTableBuilder";
import { markMaterialComplete, markMaterialsComplete, fetchMyRequirementSubmission, updateRequirementRow, submitRequirementTable } from "@/utils/api";
import ExamTakingView from "@/components/exam/ExamTakingView";
import ExamResultsView from "@/components/exam/ExamResultsView";
import { startStepExam, submitExamAnswers, fetchRequirementTableById, createRequirementTable } from "@/utils/api";
import { ExamStartResponse, ExamSubmissionRequest } from "@/types/course";

const StepView: React.FC = () => {
  const { stepId } = useParams<{ stepId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [isMaterialViewerOpen, setIsMaterialViewerOpen] = useState(false);
  const [examData, setExamData] = useState<ExamStartResponse | null>(null);
  const [isExamMode, setIsExamMode] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);
  const [showExamResult, setShowExamResult] = useState(false);
  const [requirementSubmission, setRequirementSubmission] = useState<any>(null);
  const [isRequirementDialogOpen, setIsRequirementDialogOpen] = useState(false);

  // Fetch step progress
  const { data: stepProgress, isLoading, refetch } = useQuery({
    queryKey: ["stepProgress", stepId, user?.user_id],
    queryFn: () => fetchStepProgress(stepId || "", user?.user_id || ""),
    enabled: !!stepId && !!user?.user_id,
  });

  const canTakeExam = () => {
    if (!stepProgress) return false;
    const { progress, materials } = stepProgress;
    const mandatoryMaterials = materials.filter((m) => m.is_mandatory);
    return mandatoryMaterials.every((m) => m.is_completed);
  };

  const handleMaterialClick = async (material: any) => {
    if (material.is_locked) {
      toast.error("Complete previous materials first");
      return;
    }

    // If it's a requirement table, fetch the submission data
    if (material.material_type === MaterialTypeEnum.REQUIREMENT_TABLE) {
      try {
        const tableId = material.content.requirement_table_id;
        const submission = await fetchMyRequirementSubmission(tableId, user?.user_id || "");
        setRequirementSubmission(submission);
        setIsRequirementDialogOpen(true);
      } catch {
        // Create new submission
        const table = await fetchRequirementTableById(material.content.requirement_table_id);
        setRequirementSubmission({
          requirement_table: table,
          row_statuses: table.requirements.map((r: any) => ({
            serial_number: r.serial_number,
            activity: r.activity,
            target: r.target,
            unit: r.unit,
            completed: false,
            approved: false,
          })),
          is_completed: false,
          is_approved: false,
        });
        setIsRequirementDialogOpen(true);
      }
      return;
    }

    setSelectedMaterial(material);
    setIsMaterialViewerOpen(true);
  };

  const handleMarkMaterialComplete = async (materialId: string) => {
    try {
      await markMaterialComplete(materialId, user?.user_id || "");
      toast.success("Material marked as complete");
      refetch();
    } catch (error: any) {
      toast.error("Failed to mark complete", { description: error.message });
    }
  };

  const handleMarkAllMaterialsComplete = async () => {
    try {
      await markMaterialsComplete(stepId || "", user?.user_id || "");
      toast.success("All materials marked as complete");
      refetch();
    } catch (error: any) {
      toast.error("Failed to mark materials complete", { description: error.message });
    }
  };

  const handleStartExam = async () => {
    try {
      const data = await startStepExam(stepId || "", user?.user_id || "");
      setExamData(data);
      setIsExamMode(true);
    } catch (error: any) {
      toast.error("Failed to start exam", { description: error.message });
    }
  };

  const handleExamSubmit = async (data: ExamSubmissionRequest) => {
    try {
      const result = await submitExamAnswers(examData!.submission_id, data);
      setExamResult(result);
      setIsExamMode(false);
      setShowExamResult(true);
      refetch();
    } catch (error: any) {
      toast.error("Failed to submit exam", { description: error.message });
    }
  };

  const handleRequirementRowUpdate = async (serialNumber: number, data: any) => {
    try {
      if (!requirementSubmission?.submission_id) {
        // First time - submission will be created
        return;
      }
      await updateRequirementRow(
        requirementSubmission.submission_id,
        user?.user_id || "",
        data
      );
      // Refresh the requirement submission
      const tableId = selectedMaterial?.content?.requirement_table_id;
      if (tableId) {
        const updated = await fetchMyRequirementSubmission(tableId, user?.user_id || "");
        setRequirementSubmission(updated);
      }
    } catch (error: any) {
      toast.error("Failed to update requirement", { description: error.message });
    }
  };

  const handleRequirementSubmit = async () => {
    try {
      await submitRequirementTable(
        requirementSubmission.submission_id,
        user?.user_id || ""
      );
      toast.success("Submitted for review");
      setIsRequirementDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error("Failed to submit", { description: error.message });
    }
  };

  const renderMaterialViewer = () => {
    if (!selectedMaterial) return null;

    const handleComplete = () => {
      handleMarkMaterialComplete(selectedMaterial.id);
      setSelectedMaterial({ ...selectedMaterial, is_completed: true });
    };

    switch (selectedMaterial.material_type) {
      case MaterialTypeEnum.VIDEO:
        return (
          <VideoViewer
            url={selectedMaterial.content.url}
            title={selectedMaterial.title}
            description={selectedMaterial.description}
            onComplete={handleComplete}
            isCompleted={selectedMaterial.is_completed}
            onClose={() => setIsMaterialViewerOpen(false)}
          />
        );
      case MaterialTypeEnum.DOCUMENT:
        return (
          <DocumentViewer
            url={selectedMaterial.content.url}
            title={selectedMaterial.title}
            description={selectedMaterial.description}
            onComplete={handleComplete}
            isCompleted={selectedMaterial.is_completed}
            onClose={() => setIsMaterialViewerOpen(false)}
          />
        );
      case MaterialTypeEnum.BOOK_LINK:
        return (
          <BookLinkViewer
            content={selectedMaterial.content}
            title={selectedMaterial.title}
            description={selectedMaterial.description}
            onComplete={handleComplete}
            isCompleted={selectedMaterial.is_completed}
            onClose={() => setIsMaterialViewerOpen(false)}
          />
        );
      case MaterialTypeEnum.AUDIO:
        return (
          <AudioViewer
            url={selectedMaterial.content.url}
            title={selectedMaterial.title}
            description={selectedMaterial.description}
            onComplete={handleComplete}
            isCompleted={selectedMaterial.is_completed}
            onClose={() => setIsMaterialViewerOpen(false)}
          />
        );
      default:
        return null;
    }
  };

  const getExamStatusBadge = () => {
    if (!stepProgress?.progress) return null;

    const status = stepProgress.progress.exam_status;
    switch (status) {
      case StepExamStatus.NotStarted:
        return <Badge variant="secondary">Not Started</Badge>;
      case StepExamStatus.InProgress:
        return <Badge variant="default">In Progress</Badge>;
      case StepExamStatus.Submitted:
        return <Badge className="bg-orange-600">Under Review</Badge>;
      case StepExamStatus.Approved:
        return <Badge className="bg-green-600">Passed</Badge>;
      case StepExamStatus.Rejected:
        return <Badge variant="destructive">Needs Retake</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stepProgress) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Step not found</p>
      </div>
    );
  }

  const { step, progress, materials, exam_submission } = stepProgress;
  const materialsCompleted = progress.materials_completed;
  const materialsCount = progress.total_materials;
  const examLocked = !canTakeExam();
  const examAlreadyTaken = progress.exam_status !== StepExamStatus.NotStarted;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/courses/${step.course_id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{step.name}</h1>
            {getExamStatusBadge()}
          </div>
          <p className="text-muted-foreground">{step.description}</p>
        </div>
      </div>

      {/* Progress */}
      {materialsCount > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Materials Progress</span>
              <span className="text-sm text-muted-foreground">
                {progress.completed_materials_count} of {materialsCount} completed
              </span>
            </div>
            <Progress
              value={(progress.completed_materials_count / materialsCount) * 100}
              className="h-2"
            />
            {materialsCompleted && !examLocked && !examAlreadyTaken && (
              <div className="mt-2 text-xs text-muted-foreground">
                You can now take the exam!
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Exam Mode */}
      {isExamMode && examData && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Exam: {examData.form.name}</CardTitle>
            <CardDescription>
              Duration: {examData.duration_minutes} minutes • Attempt {examData.attempt_number}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExamTakingView
              examData={examData}
              onSubmit={handleExamSubmit}
            />
          </CardContent>
        </Card>
      )}

      {/* Exam Results */}
      {showExamResult && examResult && step.exam_info && (
        <ExamResultsView
          examName={step.exam_info.name}
          mcqScore={examResult.mcq_score}
          theoryScore={examResult.theory_score}
          totalScore={examResult.total_score}
          passingMarks={step.exam_info.passing_marks}
          totalMarks={step.exam_info.total_marks}
          status={examResult.submission_status}
          feedback={examResult.feedback}
          attemptNumber={examData?.attempt_number}
          maxAttempts={step.exam_info.max_attempts}
          onContinue={() => {
            setShowExamResult(false);
            navigate("/my-learning");
          }}
        />
      )}

      {/* Regular View */}
      {!isExamMode && (
        <Tabs defaultValue="materials" className="space-y-4">
          <TabsList>
            <TabsTrigger value="materials" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Materials ({materialsCount})
            </TabsTrigger>
            {step.has_exam && (
              <TabsTrigger value="exam" className="gap-2">
                <FileText className="h-4 w-4" />
                Exam
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
            {materials.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No materials for this step</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4">
                  {materials.map((material) => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      isLocked={!material.is_completed && materials.some((m) => !m.is_completed && m.order_index < material.order_index && !m.is_completed)}
                      onView={() => handleMaterialClick(material)}
                      onComplete={material.is_completed ? undefined : () => handleMarkMaterialComplete(material.id)}
                    />
                  ))}
                </div>

                {materialsCompleted && !examAlreadyTaken && (
                  <div className="flex justify-center">
                    <Button onClick={handleMarkAllMaterialsComplete} variant="outline">
                      Mark All as Complete
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="exam" className="space-y-4">
            {step.exam_info ? (
              <Card>
                <CardHeader>
                  <CardTitle>{step.exam_info.name}</CardTitle>
                  <CardDescription>
                    Duration: {step.exam_info.duration_minutes} minutes •
                    Marks: {step.exam_info.total_marks} •
                    Passing: {step.exam_info.passing_marks}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {examLocked && (
                    <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                      <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Complete materials first</div>
                        <p className="text-sm text-muted-foreground">
                          You must complete all mandatory materials before taking the exam.
                        </p>
                      </div>
                    </div>
                  )}

                  {examAlreadyTaken && progress.exam_status === StepExamStatus.Submitted && (
                    <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <PlayCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Exam Under Review</div>
                        <p className="text-sm text-muted-foreground">
                          Your exam has been submitted and is awaiting review by a manager.
                        </p>
                      </div>
                    </div>
                  )}

                  {progress.exam_status === StepExamStatus.Approved && (
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Exam Passed!</div>
                        <p className="text-sm text-muted-foreground">
                          Congratulations! You've passed this exam and can proceed to the next step.
                        </p>
                      </div>
                    </div>
                  )}

                  {progress.exam_status === StepExamStatus.Rejected && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <PlayCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Exam Not Passed</div>
                        <p className="text-sm text-muted-foreground">
                          You didn't achieve the passing score. Review the materials and try again.
                        </p>
                      </div>
                    </div>
                  )}

                  {!examLocked && !examAlreadyTaken && (
                    <Button onClick={handleStartExam} size="lg" className="w-full">
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Start Exam
                    </Button>
                  )}

                  {examAlreadyTaken && progress.exam_status === StepExamStatus.Rejected && (
                    <Button onClick={handleStartExam} size="lg" className="w-full" variant="outline">
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Retake Exam
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">No exam configured for this step</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Material Viewer Dialog */}
      <Dialog open={isMaterialViewerOpen} onOpenChange={setIsMaterialViewerOpen}>
        <DialogContent className="max-w-4xl">
          {renderMaterialViewer()}
        </DialogContent>
      </Dialog>

      {/* Requirement Table Dialog */}
      <Dialog open={isRequirementDialogOpen} onOpenChange={setIsRequirementDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {requirementSubmission && (
            <RequirementTableViewer
              submission={requirementSubmission}
              onUpdateRow={handleRequirementRowUpdate}
              onSubmit={handleRequirementSubmit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StepView;
