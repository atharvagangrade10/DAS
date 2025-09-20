import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">Welcome to DAS</h1>
        <p className="text-xl text-gray-700 dark:text-gray-300">
          Your comprehensive system for managing programs, attendees, and attendance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Friends Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Quick insights into your friends network.</p>
            {/* Future content like friend count, recent activity */}
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">See a summary of recent attendance records.</p>
            {/* Future content like attendance charts, upcoming sessions */}
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Programs Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Get a quick look at your active programs.</p>
            {/* Future content like program count, next program */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;