import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 min-h-[calc(100vh-10rem)]"> {/* Increased padding and min-height */}
      <div className="text-center mb-10"> {/* Increased margin-bottom */}
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 text-gray-900 dark:text-white leading-tight">Welcome to DAS</h1> {/* Larger text, tighter leading */}
        <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto"> {/* Larger text, max-width for readability */}
          Your comprehensive system for managing programs, attendees, and attendance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"> {/* Increased max-width */}
        <Card className="flex flex-col items-center justify-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300"> {/* Added shadow and hover effect */}
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary dark:text-primary-foreground">Friends Overview</CardTitle> {/* Applied primary color */}
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Quick insights into your friends network.</p>
            {/* Future content like friend count, recent activity */}
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary dark:text-primary-foreground">Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">See a summary of recent attendance records.</p>
            {/* Future content like attendance charts, upcoming sessions */}
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary dark:text-primary-foreground">Programs Snapshot</CardTitle>
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