import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CourseCard from "@/components/course/CourseCard";
import { fetchCourses, createCourse, updateCourse, deleteCourse, setDefaultCourse } from "@/utils/api";
import { Course } from "@/types/course";

const Courses: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    is_default: false,
    previous_course_id: "",
    order_index: 0,
  });

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => fetchCourses(),
  });

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      toast.success("Course created successfully");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Failed to create course", { description: error.message });
    },
  });

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateCourse(id, data),
    onSuccess: () => {
      toast.success("Course updated successfully");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update course", { description: error.message });
    },
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      toast.success("Course deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to delete course", { description: error.message });
    },
  });

  // Set default course mutation
  const setDefaultMutation = useMutation({
    mutationFn: setDefaultCourse,
    onSuccess: () => {
      toast.success("Default course updated");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image_url: "",
      is_default: false,
      previous_course_id: "",
      order_index: courses.length,
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Course name is required");
      return;
    }

    createMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      image_url: formData.image_url.trim() || undefined,
      is_default: formData.is_default,
      previous_course_id: formData.previous_course_id || null,
      order_index: courses.length,
    });
  };

  const handleDeleteClick = (courseId: string) => {
    setCourseToDelete(courseId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (courseToDelete) {
      deleteMutation.mutate(courseToDelete);
    }
  };

  const handleSetDefault = (courseId: string) => {
    setDefaultMutation.mutate(courseId);
  };

  // Filter courses based on search
  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Enrich courses with counts
  const enrichedCourses = filteredCourses.map((course) => ({
    ...course,
    steps_count: course.steps?.length || 0,
    materials_count: course.steps?.reduce((acc, step) => acc + (step.materials?.length || 0), 0) || 0,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">Manage courses, steps, and learning materials</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Course
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 max-w-sm"
        />
      </div>

      {/* Courses Grid */}
      {enrichedCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">
            {searchQuery ? "No courses found matching your search." : "No courses yet. Create your first course!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrichedCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              canManage={true}
              onEdit={(id) => navigate(`/courses/builder/${id}`)}
              onDelete={handleDeleteClick}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Create Course Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Add a new course to the learning management system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bhakti Shastri"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the course..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_default">Set as Default Course</Label>
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previous_course">Previous Course (Optional)</Label>
              <Select
                value={formData.previous_course_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, previous_course_id: value === "none" ? "" : value })}
              >
                <SelectTrigger id="previous_course">
                  <SelectValue placeholder="Select previous course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be undone and will also delete all associated steps and materials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Courses;
