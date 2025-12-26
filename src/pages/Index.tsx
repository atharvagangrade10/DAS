import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 min-h-[calc(100vh-10rem)]">
      <div className="text-center mb-10">
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 text-gray-900 dark:text-white leading-tight">Welcome to DAS</h1>
        <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          Your comprehensive system for managing programs, attendees, and attendance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        
        <Link to="/friends" className="block">
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-primary dark:text-primary-foreground">Friends Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Quick insights into your friends network.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/attendance" className="block">
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-primary dark:text-primary-foreground">Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">See a summary of recent attendance records.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/programs" className="block">
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-primary dark:text-primary-foreground">Programs Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Get a quick look at your active programs.</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/yatra" className="block">
          <Card className="flex flex-col items-center justify-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-primary dark:text-primary-foreground">Yatra Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Manage upcoming and past spiritual trips.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Index;