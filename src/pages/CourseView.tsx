import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { fetchCourseProgress, fetchMyRequirementSubmission, enrollDefaultCourse } from "@/utils/api";
import { StepProgressDetail, StepExamStatus } from "@/types/course";
import { MaterialTypeEnum } from "@/types/course";
import StepCard from "@/components/course/StepCard";
import StepNavigation from "@/components/course/StepNavigation";
import MaterialCard from "@/components/course/MaterialCard";
import ProgressBar from "@/components/course/ProgressBar";
import VideoViewer from "@/components/material-viewers/VideoViewer";
import DocumentViewer from "@/components/material-viewers/DocumentViewer";
import BookLinkViewer from "@/components/material-viewers/BookLinkViewer";
import AudioViewer from "@/components/material-viewers/AudioViewer";
import RequirementTableViewer from "@/components/requirement-table/RequirementTableViewer";
import { markMaterialComplete } from "@/utils/api";
import ExamTakingView from "@/components/exam/ExamTakingView";
import ExamResultsView from "@/components/exam/ExamResultsView";
import { fetchStepById, startStepExam, submitExamAnswers } from "@/utils/api";
import { ExamStartResponse } from "@/types/course";

const CourseView: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [isMaterialViewerOpen, setIsMaterialViewerOpen] = useState(false);
  const [examData, setExamData] = useState<ExamStartResponse | null>(null);
  const [isExamMode, setIsExamMode] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);
  const [showExamResult, setShowExamResult] = useState(false);
  const [needsEnrollment, setNeedsEnrollment] = useState(false);

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: () => enrollDefaultCourse(user?.user_id || ""),
    onSuccess: (data) => {
      console.log('CourseView: Enrollment successful:', data);
      toast.success('Enrolled in default course');
      setNeedsEnrollment(false);
      // Refetch course progress after enrollment
      queryClient.invalidateQueries({ queryKey: ["courseProgress"] });
      queryClient.invalidateQueries({ queryKey: ["myCourses"] });
    },
    onError: (error: any) => {
      console.error('CourseView: Enrollment failed:', error);
      toast.error('Failed to enroll in course', { description: error.message });
    },
  });

  // Fetch course progress
  const { data: courseProgress, isLoading, error } = useQuery({
    queryKey: ["courseProgress", courseId, user?.user_id, needsEnrollment],
    queryFn: async () => {
      console.log('CourseView: Fetching course progress for courseId:', courseId, 'userId:', user?.user_id);
      try {
        return await fetchCourseProgress(courseId || "", user?.user_id || "");
      } catch (err: any) {
        console.log('CourseView: Error fetching progress:', err);
        // If not enrolled, trigger enrollment flow
        if (err?.message?.includes('Not enrolled') || err?.detail === 'Not enrolled in this course' || err?.detail?.includes('Not enrolled')) {
          console.log('CourseView: Not enrolled, triggering enrollment');
          setNeedsEnrollment(true);
          enrollMutation.mutate();
          throw err; // Re-throw to trigger error state
        }
        throw err;
      }
    },
    enabled: !!courseId && !!user?.user_id && !needsEnrollment,
    retry: false,
  });

  if (isLoading || enrollMutation.isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">
            {enrollMutation.isPending ? 'Enrolling you in the course...' : 'Loading course...'}
          </p>
        </div>
      </div>
    );
  }

  if (!courseProgress) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  const { course, current_step_id, completed_step_ids, is_completed, steps } = courseProgress;

  console.log('CourseView: courseProgress data:', {
    course: course?.name,
    current_step_id,
    completed_step_ids,
    is_completed,
    stepsCount: steps?.length,
    steps: steps,
  });

  // Enrich steps with progress info
  const enrichedSteps = steps.map((step) => ({
    ...step,
    materials_count: step.materials?.length || 0,
    is_locked: !completed_step_ids.includes(step.id) && step.id !== current_step_id,
    is_completed: completed_step_ids.includes(step.id),
    is_current: step.id === current_step_id,
  }));

  // Calculate progress percentage
  const progressPercentage = courseProgress.is_completed
    ? 100
    : Math.round((completed_step_ids.length / steps.length) * 100);

  const handleMaterialClick = async (material: any, stepId: string) => {
    if (material.is_locked) return;
    setSelectedMaterial({ ...material, stepId });
    setIsMaterialViewerOpen(true);
  };

  const handleMarkMaterialComplete = async (materialId: string, stepId: string) => {
    try {
      await markMaterialComplete(materialId, user?.user_id || "");
      toast.success("Material marked as complete");
      // Refetch progress
      // In a real app, you'd use queryClient.invalidateQueries
    } catch (error: any) {
      toast.error("Failed to mark material complete", {
        description: error.message,
      });
    }
  };

  const handleStartExam = async (stepId: string) => {
    try {
      const data = await startStepExam(stepId, user?.user_id || "");
      setExamData(data);
      setIsExamMode(true);
    } catch (error: any) {
      toast.error("Failed to start exam", {
        description: error.message,
      });
    }
  };

  const handleExamSubmit = async (data: any) => {
    try {
      const result = await submitExamAnswers(examData!.submission_id, data);
      setExamResult(result);
      setIsExamMode(false);
      setShowExamResult(true);
    } catch (error: any) {
      toast.error("Failed to submit exam", {
        description: error.message,
      });
    }
  };

  const renderMaterialViewer = () => {
    if (!selectedMaterial) return null;

    const handleComplete = () => {
      handleMarkMaterialComplete(selectedMaterial.id, selectedMaterial.stepId);
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
        return (
          <div className="p-4">
            <p>Material viewer not available for this type.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/my-learning">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          {course.image_url && (
            <img
              src={course.image_url}
              alt={course.name}
              className="h-32 w-full object-cover rounded-lg mb-4"
            />
          )}
          <h1 className="text-3xl font-bold">{course.name}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Course Progress</span>
            <span className="text-sm text-muted-foreground">
              {completed_step_ids.length} of {steps.length} steps completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-center mt-2">
            <span className="text-2xl font-bold">{progressPercentage}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <StepNavigation
        steps={enrichedSteps.map((s) => ({
          id: s.id,
          name: s.name,
          order_index: s.order_index,
          is_locked: s.is_locked,
          is_completed: s.is_completed,
          is_current: s.is_current,
        }))}
        currentStepId={current_step_id || ""}
        onStepClick={(stepId) => {
          // Navigate to step detail
          window.location.href = `/steps/${stepId}`;
        }}
      />

      {/* Steps List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Course Steps</h2>
        <div className="grid gap-4">
          {enrichedSteps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              isLocked={step.is_locked}
              isCompleted={step.is_completed}
              isCurrent={step.is_current}
              onClick={() => {
                if (!step.is_locked) {
                  window.location.href = `/steps/${step.id}`;
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Material Viewer Dialog */}
      <Dialog open={isMaterialViewerOpen} onOpenChange={setIsMaterialViewerOpen}>
        <DialogContent className="max-w-4xl">
          {renderMaterialViewer()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseView;
