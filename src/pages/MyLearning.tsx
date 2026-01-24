import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { fetchMyCourses, enrollDefaultCourse } from "@/utils/api";
import { MyLearning as MyLearningType } from "@/types/course";
import CourseCard from "@/components/course/CourseCard";

const MyLearning: React.FC = () => {
  const { user } = useAuth();

  // Fetch user's courses
  const { data: myCourses = [], isLoading, refetch } = useQuery({
    queryKey: ["myCourses", user?.user_id],
    queryFn: () => fetchMyCourses(user?.user_id || ""),
    enabled: !!user?.user_id,
  });

  // Auto-enroll in default course if no courses
  useEffect(() => {
    if (user?.user_id && myCourses.length === 0 && !isLoading) {
      enrollDefaultCourse(user.user_id)
        .then(() => {
          toast.success("Enrolled in default course");
          refetch();
        })
        .catch(() => {
          // No default course set, that's fine
        });
    }
  }, [user, myCourses, isLoading, refetch]);

  // Separate current course from other courses
  const currentCourse = myCourses.find((c: MyLearningType) => !c.is_completed && c.progress.percentage < 100);
  const completedCourses = myCourses.filter((c: MyLearningType) => c.is_completed || c.progress.percentage >= 100);
  const otherCourses = myCourses.filter((c: MyLearningType) => c.id !== currentCourse?.id && !c.is_completed);

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Learning</h1>
        <p className="text-muted-foreground">Track your course progress and continue learning</p>
      </div>

      {myCourses.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No courses yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You haven't been enrolled in any courses yet.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Current Course - Prominent */}
          {currentCourse && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Current Course
                </Badge>
              </div>
              <Card className="overflow-hidden">
                <div className="md:flex">
                  {currentCourse.image_url && (
                    <div className="md:w-1/3">
                      <img
                        src={currentCourse.image_url}
                        alt={currentCourse.course_name}
                        className="w-full h-48 md:h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-6 space-y-4">
                    <div>
                      <CardTitle className="text-2xl">{currentCourse.course_name}</CardTitle>
                      <CardDescription className="mt-1">{currentCourse.description}</CardDescription>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(currentCourse.progress.percentage)}%</span>
                      </div>
                      <Progress value={currentCourse.progress.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {currentCourse.progress.completed_steps} of {currentCourse.progress.total_steps} steps completed
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button asChild className="flex-1">
                        <Link to={`/courses/${currentCourse.course_id}`}>
                          Continue Learning
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Other Enrolled Courses */}
          {otherCourses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Enrolled Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherCourses.map((course) => (
                  <Card key={course.course_id} className="overflow-hidden">
                    {course.image_url && (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={course.image_url}
                          alt={course.course_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{course.course_name}</CardTitle>
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{Math.round(course.progress.percentage)}%</span>
                        </div>
                        <Progress value={course.progress.percentage} className="h-2" />
                      </div>
                      <Button asChild variant="outline" className="w-full">
                        <Link to={`/courses/${course.course_id}`}>
                          {course.progress.percentage > 0 ? "Continue" : "Start Course"}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Courses */}
          {completedCourses.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Completed Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedCourses.map((course) => (
                  <Card key={course.course_id} className="border-green-600 dark:border-green-500">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="line-clamp-1">{course.course_name}</CardTitle>
                          <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="outline" className="w-full">
                        <Link to={`/courses/${course.course_id}`}>
                          Review Course
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyLearning;
