import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileText, ClipboardList, Clock, CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingSubmissions, fetchPendingRequirementSubmissions } from "@/utils/api";
import { ExamSubmission, PendingRequirementSubmission } from "@/types/course";
import { formatDistanceToNow } from "date-fns";

const Review: React.FC = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"exams" | "requirements" | "all">("all");

  // Fetch pending exam submissions
  const { data: examSubmissions = [], isLoading: isLoadingExams, refetch: refetchExams } = useQuery({
    queryKey: ["pendingExamSubmissions"],
    queryFn: () => fetchPendingSubmissions(),
  });

  // Fetch pending requirement submissions
  const { data: requirementSubmissions = [], isLoading: isLoadingRequirements, refetch: refetchRequirements } = useQuery({
    queryKey: ["pendingRequirementSubmissions"],
    queryFn: () => fetchPendingRequirementSubmissions(),
  });

  const isLoading = isLoadingExams || isLoadingRequirements;

  // Get submission by type
  const getExamSubmissions = () => examSubmissions;
  const getRequirementSubmissions = () => requirementSubmissions;
  const getAllSubmissions = () => [
    ...examSubmissions.map((s) => ({ ...s, type: "exam" as const })),
    ...requirementSubmissions.map((s) => ({ ...s, type: "requirement" as const })),
  ];

  const submissions = selectedTab === "exams"
    ? getExamSubmissions()
    : selectedTab === "requirements"
      ? getRequirementSubmissions()
      : getAllSubmissions();

  const stats = {
    examPending: examSubmissions.length,
    requirementPending: requirementSubmissions.length,
    total: examSubmissions.length + requirementSubmissions.length,
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const renderSubmissionCard = (submission: any) => {
    if (submission.type === "requirement" || submission.table_name) {
      // Requirement table submission
      const req = submission as PendingRequirementSubmission;
      return (
        <Card key={req.submission_id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{req.table_name}</CardTitle>
                  <CardDescription className="mt-1">
                    {req.participant_id} • {req.step_id}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">{formatDate(req.submitted_at)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {req.completed_rows}/{req.total_rows} rows completed • {req.approved_rows} approved
              </div>
              <Button size="sm" variant="outline" className="gap-1">
                <Eye className="h-4 w-4" />
                Review
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      // Exam submission
      const exam = submission as ExamSubmission;
      return (
        <Card key={exam.submission_id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{exam.form_name}</CardTitle>
                  <CardDescription className="mt-1">
                    {exam.participant_id} • {exam.course_name}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">{formatDate(exam.submitted_at)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">MCQ Score: </span>
                <span className="font-medium">{exam.mcq_score}</span>
                {exam.theory_score !== null && (
                  <>
                    <span className="text-muted-foreground ml-2">Theory: </span>
                    <span className="font-medium">{exam.theory_score}</span>
                  </>
                )}
              </div>
              <Button size="sm" variant="outline" className="gap-1">
                <Eye className="h-4 w-4" />
                Review
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Dashboard</h1>
          <p className="text-muted-foreground">Review exam submissions and requirement tables</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Dashboard</h1>
        <p className="text-muted-foreground">Review exam submissions and requirement tables</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Pending</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Clock className="h-6 w-6 text-orange-500" />
              {stats.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Exam Reviews</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-500" />
              {stats.examPending}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Requirement Approvals</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-green-500" />
              {stats.requirementPending}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">
            All ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="exams">
            Exams ({stats.examPending})
          </TabsTrigger>
          <TabsTrigger value="requirements">
            Requirements ({stats.requirementPending})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-4">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                <p className="text-muted-foreground">No pending {selectedTab === "all" ? "submissions" : selectedTab} to review!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => renderSubmissionCard(submission))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Review;
