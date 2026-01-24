import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, ArrowLeft, GripVertical, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCourseById, updateCourse, createStep, updateStep, deleteStep, createMaterial, updateMaterial, deleteMaterial, linkExamToStep, fetchForms, createExam } from "@/utils/api";
import { Course, Step, Material, MaterialTypeEnum, MaterialCreate, Exam, ExamCreate } from "@/types/course";
import StepCard from "@/components/course/StepCard";
import MaterialCard from "@/components/material-viewers/MaterialCard";
import MaterialFormDialog from "@/components/course/MaterialFormDialog";
import ExamBuilderDialog from "@/components/exam/ExamBuilderDialog";

interface TempMaterial {
  material_type: MaterialTypeEnum;
  title: string;
  description: string;
  content: any;
  order_index: number;
  is_mandatory: boolean;
}

const CourseBuilder: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Course form state
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseImageUrl, setCourseImageUrl] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Step dialog state
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [stepName, setStepName] = useState("");
  const [stepDescription, setStepDescription] = useState("");
  const [stepMaterials, setStepMaterials] = useState<TempMaterial[]>([]);
  const [stepExamId, setStepExamId] = useState<string>("");
  const [stepDialogTab, setStepDialogTab] = useState("info");
  const [previousStepId, setPreviousStepId] = useState<string>("");
  const [unlockOnExamPass, setUnlockOnExamPass] = useState(false);

  // Material dialog state (for inline add)
  const [isInlineMaterialDialogOpen, setIsInlineMaterialDialogOpen] = useState(false);
  const [inlineMaterialData, setInlineMaterialData] = useState<Partial<TempMaterial>>({
    material_type: MaterialTypeEnum.VIDEO,
    title: "",
    description: "",
    content: { url: "" },
    is_mandatory: true,
  });

  // Material dialog state
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [selectedStepForMaterial, setSelectedStepForMaterial] = useState<Step | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Exam dialog state
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);

  // Fetch course data
  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => fetchCourseById(courseId || ""),
    enabled: !!courseId,
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: (data: any) => updateCourse(courseId!, data),
    onSuccess: () => {
      toast.success("Course updated successfully");
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });

  // Create step mutation
  const createStepMutation = useMutation({
    mutationFn: createStep,
    onSuccess: async (data) => {
      toast.success("Step created successfully");

      // Create materials if any
      if (stepMaterials.length > 0) {
        for (const material of stepMaterials) {
          try {
            await createMaterial(data.id, material as MaterialCreate);
          } catch (error) {
            console.error("Failed to create material:", error);
          }
        }
      }

      // Link exam if selected
      if (stepExamId) {
        try {
          await linkExamToStep(data.id, stepExamId);
          toast.success("Exam linked to step");
        } catch (error) {
          console.error("Failed to link exam:", error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      setIsStepDialogOpen(false);
      setEditingStep(null);
      setStepName("");
      setStepDescription("");
      setStepMaterials([]);
      setStepExamId("");
      setPreviousStepId("");
      setUnlockOnExamPass(false);
      setStepDialogTab("info");
    },
  });

  // Update step mutation
  const updateStepMutation = useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: any }) => updateStep(stepId, data),
    onSuccess: () => {
      toast.success("Step updated successfully");
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      setIsStepDialogOpen(false);
      setEditingStep(null);
    },
  });

  // Delete step mutation
  const deleteStepMutation = useMutation({
    mutationFn: deleteStep,
    onSuccess: () => {
      toast.success("Step deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });

  // Material mutations
  const createMaterialMutation = useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: any }) => createMaterial(stepId, data),
    onSuccess: () => {
      toast.success("Material added successfully");
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      setIsMaterialDialogOpen(false);
      setSelectedStepForMaterial(null);
      setEditingMaterial(null);
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: ({ materialId, data }: { materialId: string; data: any }) => updateMaterial(materialId, data),
    onSuccess: () => {
      toast.success("Material updated successfully");
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      setIsMaterialDialogOpen(false);
      setEditingMaterial(null);
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      toast.success("Material deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
  });

  // Create and link exam mutation
  const createAndLinkExamMutation = useMutation({
    mutationFn: async ({ stepId, examData }: { stepId: string; examData: ExamCreate }) => {
      // Step 1: Create the exam using POST /forms
      console.log('Creating exam:', examData);
      const createdExam = await createExam(examData);
      console.log('Exam created with ID:', createdExam.id);

      // Step 2: Link the exam to the step using PUT /steps/{step_id}/exam?form_id={form_id}
      await linkExamToStep(stepId, createdExam.id);
      console.log('Exam linked to step:', stepId);

      return createdExam;
    },
    onSuccess: () => {
      toast.success("Exam created and linked to step successfully");
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      setIsExamDialogOpen(false);
    },
    onError: (error: any) => {
      console.error('Failed to create/link exam:', error);
      toast.error("Failed to create exam", { description: error.message });
    },
  });

  // Load course data when available
  useEffect(() => {
    if (course) {
      setCourseName(course.name);
      setCourseDescription(course.description || "");
      setCourseImageUrl(course.image_url || "");
      setIsDefault(course.is_default);
    }
  }, [course]);

  // Fetch exams for linking
  const { data: allExams = [] } = useQuery({
    queryKey: ["forms"],
    queryFn: () => fetchForms(),
  });

  const handleCourseUpdate = () => {
    updateCourseMutation.mutate({
      name: courseName,
      description: courseDescription,
      image_url: courseImageUrl || undefined,
      is_default: isDefault,
    });
  };

  const handleCreateStep = () => {
    if (!courseId) return;

    createStepMutation.mutate({
      course_id: courseId,
      name: stepName,
      description: stepDescription,
      order_index: course?.steps?.length || 0,
      previous_step_id: previousStepId || undefined,
      unlock_on_exam_pass: unlockOnExamPass,
    });
  };

  const handleUpdateStep = () => {
    if (!editingStep) return;

    updateStepMutation.mutate({
      stepId: editingStep.id,
      data: {
        name: stepName,
        description: stepDescription,
        previous_step_id: previousStepId || undefined,
        unlock_on_exam_pass: unlockOnExamPass,
      },
    });
  };

  const handleDeleteStep = (stepId: string) => {
    if (confirm("Are you sure you want to delete this step?")) {
      deleteStepMutation.mutate(stepId);
    }
  };

  const handleEditStep = (step: Step) => {
    setEditingStep(step);
    setStepName(step.name);
    setStepDescription(step.description || "");
    setStepMaterials([]);
    setStepExamId(step.exam_id || "");
    setPreviousStepId(step.previous_step_id || "");
    setUnlockOnExamPass(step.unlock_on_exam_pass || false);
    setStepDialogTab("info");
    setIsStepDialogOpen(true);
  };

  const handleAddInlineMaterial = () => {
    if (!inlineMaterialData.title?.trim()) {
      toast.error("Material title is required");
      return;
    }

    const newMaterial: TempMaterial = {
      material_type: inlineMaterialData.material_type || MaterialTypeEnum.VIDEO,
      title: inlineMaterialData.title,
      description: inlineMaterialData.description || "",
      content: inlineMaterialData.content || { url: "" },
      order_index: stepMaterials.length,
      is_mandatory: inlineMaterialData.is_mandatory ?? true,
    };

    setStepMaterials([...stepMaterials, newMaterial]);
    setInlineMaterialData({
      material_type: MaterialTypeEnum.VIDEO,
      title: "",
      description: "",
      content: { url: "" },
      is_mandatory: true,
    });
    setIsInlineMaterialDialogOpen(false);
  };

  const handleRemoveInlineMaterial = (index: number) => {
    setStepMaterials(stepMaterials.filter((_, i) => i !== index));
  };

  const handleAddMaterial = (step: Step) => {
    setSelectedStepForMaterial(step);
    setEditingMaterial(null);
    setIsMaterialDialogOpen(true);
  };

  const handleEditMaterial = (step: Step, material: Material) => {
    setSelectedStepForMaterial(step);
    setEditingMaterial(material);
    setIsMaterialDialogOpen(true);
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      deleteMaterialMutation.mutate(materialId);
    }
  };

  const handleLinkExam = (step: Step, examId: string) => {
    linkExamToStep(step.id, examId)
      .then(() => {
        toast.success("Exam linked to step");
        queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      })
      .catch((error) => {
        toast.error("Failed to link exam", { description: error.message });
      });
  };

  const handleCreateExam = (step: Step) => {
    setSelectedStepForMaterial(step);
    setIsExamDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Course Builder</h1>
          <p className="text-muted-foreground">{course.name}</p>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="steps">Steps & Content</TabsTrigger>
        </TabsList>

        {/* Course Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Course</CardTitle>
              <CardDescription>Update course information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course-name">Course Name</Label>
                <Input
                  id="course-name"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Course name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-description">Description</Label>
                <Textarea
                  id="course-description"
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Course description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-image">Image URL</Label>
                <Input
                  id="course-image"
                  value={courseImageUrl}
                  onChange={(e) => setCourseImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is-default"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
                <Label htmlFor="is-default">Set as default course</Label>
              </div>

              <Button onClick={handleCourseUpdate} disabled={updateCourseMutation.isPending}>
                {updateCourseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Steps Tab */}
        <TabsContent value="steps" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Course Steps</h2>
            <Button onClick={() => {
              setEditingStep(null);
              setStepName("");
              setStepDescription("");
              setStepMaterials([]);
              setStepExamId("");
              setStepDialogTab("info");
              setIsStepDialogOpen(true);
            }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Step
            </Button>
          </div>

          {course.steps && course.steps.length > 0 ? (
            <div className="space-y-4">
              {course.steps.map((step) => (
                <Card key={step.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <div>
                          <CardTitle>{step.name}</CardTitle>
                          <CardDescription>{step.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditStep(step)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteStep(step.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Materials */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Materials ({step.materials?.length || 0})</span>
                        <Button variant="outline" size="sm" onClick={() => handleAddMaterial(step)} className="h-7 gap-1">
                          <Plus className="h-3 w-3" />
                          Add Material
                        </Button>
                      </div>
                      {step.materials && step.materials.length > 0 && (
                        <div className="grid gap-2">
                          {step.materials.map((material) => (
                            <div key={material.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                              <span>{material.title}</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="h-7" onClick={() => handleEditMaterial(step, material)}>
                                  Edit
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => handleDeleteMaterial(material.id)}>
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Exam */}
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <span className="text-sm font-medium">Exam</span>
                        {step.exam_info && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {step.exam_info.name} • {step.exam_info.duration_minutes} min • {step.exam_info.total_marks} marks
                          </span>
                        )}
                      </div>
                      {step.has_exam ? (
                        <Badge variant="secondary">{step.exam_info?.name}</Badge>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleCreateExam(step)}>
                          Add Exam
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No steps yet. Add your first step to get started.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Step Dialog */}
      <Dialog open={isStepDialogOpen} onOpenChange={setIsStepDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStep ? "Edit Step" : "Add Step"}</DialogTitle>
            <DialogDescription>
              {editingStep ? "Update step information" : "Create a new step for this course with materials and exam"}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={stepDialogTab} onValueChange={setStepDialogTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="exam">Exam</TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="step-name">Step Name *</Label>
                <Input
                  id="step-name"
                  value={stepName}
                  onChange={(e) => setStepName(e.target.value)}
                  placeholder="e.g., Step 1: Introduction"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="step-description">Description</Label>
                <Textarea
                  id="step-description"
                  value={stepDescription}
                  onChange={(e) => setStepDescription(e.target.value)}
                  placeholder="Brief description of this step..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous-step">Previous Step (Optional)</Label>
                <Select value={previousStepId || "none"} onValueChange={(value) => setPreviousStepId(value === "none" ? "" : value)}>
                  <SelectTrigger id="previous-step">
                    <SelectValue placeholder="Select previous step (for sequential unlock)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Previous Step (First Step)</SelectItem>
                    {course?.steps?.filter((s) => s.id !== editingStep?.id).map((step) => (
                      <SelectItem key={step.id} value={step.id}>
                        {step.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This step will be locked until the previous step is completed.
                </p>
              </div>

              {previousStepId && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Switch
                    id="unlock-on-exam"
                    checked={unlockOnExamPass}
                    onCheckedChange={setUnlockOnExamPass}
                  />
                  <div className="flex-1">
                    <Label htmlFor="unlock-on-exam" className="cursor-pointer">Unlock only after passing exam</Label>
                    <p className="text-xs text-muted-foreground">
                      Participants must pass the previous step's exam to unlock this step
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Materials</h3>
                  <p className="text-sm text-muted-foreground">Add materials to this step</p>
                </div>
                <Button size="sm" onClick={() => setIsInlineMaterialDialogOpen(true)} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add Material
                </Button>
              </div>

              {stepMaterials.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground">No materials added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stepMaterials.map((material, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{material.material_type}</Badge>
                        <div>
                          <p className="font-medium text-sm">{material.title}</p>
                          {material.description && (
                            <p className="text-xs text-muted-foreground">{material.description}</p>
                          )}
                        </div>
                        {material.is_mandatory && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveInlineMaterial(index)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Exam Tab */}
            <TabsContent value="exam" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="step-exam">Link Exam</Label>
                <Select value={stepExamId || "none"} onValueChange={(value) => setStepExamId(value === "none" ? "" : value)}>
                  <SelectTrigger id="step-exam">
                    <SelectValue placeholder="Select an exam to link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Exam</SelectItem>
                    {allExams.map((exam: Exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name} ({exam.duration_minutes} min, {exam.total_marks} marks)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select an exam to link to this step. Participants will need to complete this exam after finishing all materials.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsStepDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingStep ? handleUpdateStep : handleCreateStep}
              disabled={!stepName || (createStepMutation.isPending || updateStepMutation.isPending)}
            >
              {createStepMutation.isPending || updateStepMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>{editingStep ? "Update" : "Create"} Step</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline Material Dialog */}
      <Dialog open={isInlineMaterialDialogOpen} onOpenChange={setIsInlineMaterialDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Material</DialogTitle>
            <DialogDescription>Add a learning material to this step</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Material Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(MaterialTypeEnum).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInlineMaterialData({ ...inlineMaterialData, material_type: type })}
                    className={`p-2 text-left rounded-lg border text-sm transition-colors ${inlineMaterialData.material_type === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:bg-muted"
                      }`}
                  >
                    {type === MaterialTypeEnum.VIDEO && "Video"}
                    {type === MaterialTypeEnum.BOOK_LINK && "Book Link"}
                    {type === MaterialTypeEnum.DOCUMENT && "Document"}
                    {type === MaterialTypeEnum.AUDIO && "Audio"}
                    {type === MaterialTypeEnum.REQUIREMENT_TABLE && "Requirement Table"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inline-material-title">Title *</Label>
              <Input
                id="inline-material-title"
                value={inlineMaterialData.title || ""}
                onChange={(e) => setInlineMaterialData({ ...inlineMaterialData, title: e.target.value })}
                placeholder="Material title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inline-material-description">Description</Label>
              <Textarea
                id="inline-material-description"
                value={inlineMaterialData.description || ""}
                onChange={(e) => setInlineMaterialData({ ...inlineMaterialData, description: e.target.value })}
                placeholder="Brief description..."
                rows={2}
              />
            </div>

            {inlineMaterialData.material_type !== MaterialTypeEnum.REQUIREMENT_TABLE && (
              <div className="space-y-2">
                <Label htmlFor="inline-material-url">URL</Label>
                <Input
                  id="inline-material-url"
                  value={inlineMaterialData.content?.url || ""}
                  onChange={(e) => setInlineMaterialData({
                    ...inlineMaterialData,
                    content: { ...inlineMaterialData.content, url: e.target.value }
                  })}
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                id="inline-is-mandatory"
                checked={inlineMaterialData.is_mandatory ?? true}
                onCheckedChange={(checked) => setInlineMaterialData({ ...inlineMaterialData, is_mandatory: checked })}
              />
              <Label htmlFor="inline-is-mandatory" className="text-sm">Required material</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInlineMaterialDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddInlineMaterial} disabled={!inlineMaterialData.title?.trim()}>
              Add Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Dialog */}
      <MaterialFormDialog
        isOpen={isMaterialDialogOpen}
        onClose={() => {
          setIsMaterialDialogOpen(false);
          setSelectedStepForMaterial(null);
          setEditingMaterial(null);
        }}
        onSave={(data) => {
          if (editingMaterial) {
            updateMaterialMutation.mutate({
              materialId: editingMaterial.id,
              data,
            });
          } else {
            createMaterialMutation.mutate({
              stepId: selectedStepForMaterial!.id,
              data,
            });
          }
        }}
        stepId={selectedStepForMaterial?.id || ""}
        material={editingMaterial}
      />

      {/* Exam Dialog */}
      <ExamBuilderDialog
        isOpen={isExamDialogOpen}
        onClose={() => setIsExamDialogOpen(false)}
        onSave={(data) => {
          // Create exam using POST /forms, then link to step using PUT /steps/{step_id}/exam
          if (selectedStepForMaterial) {
            createAndLinkExamMutation.mutate({
              stepId: selectedStepForMaterial.id,
              examData: {
                ...data,
                step_id: selectedStepForMaterial.id, // Include step_id in exam data
              },
            });
          }
        }}
        stepId={selectedStepForMaterial?.id || ""}
        initialExam={undefined}
      />
    </div>
  );
};

export default CourseBuilder;
